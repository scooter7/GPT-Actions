import os
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from sqlalchemy.orm import sessionmaker

# Use a relative import to load the database configuration
from .database import engine, User, Credentials

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app)

# --- Database Session ---
Session = sessionmaker(bind=engine)

# --- Google OAuth Configuration ---
SCOPES = ['https://www.googleapis.com/auth/userinfo.email', 'openid']

# --- API Endpoints ---

@app.route('/api/get_credentials', methods=['POST'])
def get_credentials_route():
    """Creates new credentials or retrieves existing ones."""
    session = Session()
    data = request.get_json()
    
    if 'id' in data:
        # Retrieve existing credentials using the admin ID
        creds = session.query(Credentials).filter_by(adminId=data['id']).first()
        if creds:
            response = {'id': creds.id, 'secret': creds.secret, 'adminId': creds.adminId}
        else:
            response = {'error': 'Credentials not found'}, 404
    elif 'googleId' in data and 'googleSecret' in data:
        # Create new credentials
        new_creds = Credentials(
            id=str(uuid.uuid4()),
            secret=str(uuid.uuid4()),
            adminId=str(uuid.uuid4()),
            googleId=data['googleId'],
            googleSecret=data['googleSecret']
        )
        session.add(new_creds)
        session.commit()
        response = {'id': new_creds.id, 'secret': new_creds.secret, 'adminId': new_creds.adminId}
    else:
        response = {'error': 'Invalid request'}, 400
        
    session.close()
    return jsonify(response)

@app.route('/api/get_login_url', methods=['GET'])
def get_login_url():
    """Generates the Google OAuth login URL."""
    session = Session()
    admin_id = request.args.get('id')
    creds = session.query(Credentials).filter_by(adminId=admin_id).first()
    session.close()

    if not creds:
        return jsonify({'error': 'Invalid admin ID'}), 404

    redirect_uri = request.url_root + 'api/login'
    flow = Flow.from_client_config(
        client_config={"web": {
            "client_id": creds.googleId,
            "client_secret": creds.googleSecret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [redirect_uri]
        }},
        scopes=SCOPES,
        redirect_uri=redirect_uri
    )
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        state=admin_id
    )
    return jsonify(authorization_url)

@app.route('/api/login', methods=['GET'])
def login():
    """Handles the OAuth callback from Google."""
    session = Session()
    admin_id = request.args.get('state')
    creds = session.query(Credentials).filter_by(adminId=admin_id).first()
    
    if not creds:
        session.close()
        return jsonify({'error': 'Invalid state or admin ID'}), 400

    redirect_uri = request.url_root + 'api/login'
    flow = Flow.from_client_config(
        client_config={"web": {
            "client_id": creds.googleId,
            "client_secret": creds.googleSecret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [redirect_uri]
        }},
        scopes=SCOPES,
        redirect_uri=redirect_uri
    )

    flow.fetch_token(authorization_response=request.url)
    google_creds = flow.credentials
    
    userinfo_service = build('oauth2', 'v2', credentials=google_creds)
    user_info = userinfo_service.userinfo().get().execute()
    
    user = session.query(User).filter_by(id=user_info['id'], adminId=admin_id).first()
    if not user:
        user = User(
            id=user_info['id'],
            email=user_info['email'],
            adminId=admin_id,
            access_token=google_creds.token,
            refresh_token=google_creds.refresh_token
        )
        session.add(user)
    else:
        user.access_token = google_creds.token
        if google_creds.refresh_token:
            user.refresh_token = google_creds.refresh_token
            
    session.commit()
    session.close()
    return jsonify({'status': 'success', 'email': user_info['email']})

@app.route('/api/verify_token/<adminId>', methods=['POST'])
def verify_token(adminId):
    """Verifies the access token provided by the GPT."""
    session = Session()
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        session.close()
        return jsonify({'error': 'Missing or invalid Authorization header'}), 401
        
    token = auth_header.split(' ')[1]
    user = session.query(User).filter_by(access_token=token, adminId=adminId).first()
    
    if not user:
        session.close()
        return jsonify({'error': 'Invalid token'}), 401
        
    session.close()
    return jsonify({'email': user.email, 'status': 'verified'})

# Note: The Flask 'app' object is automatically discovered by Vercel.