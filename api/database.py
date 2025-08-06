import os
from sqlalchemy import create_engine, Column, String, Text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Get the database connection URL from Vercel environment variables
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set.")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Database Models ---

class Credentials(Base):
    """Stores the credentials for each GPT Auth instance."""
    __tablename__ = "credentials"
    id = Column(String, primary_key=True, index=True)
    secret = Column(String)
    adminId = Column(String, unique=True, index=True)
    googleId = Column(String)
    googleSecret = Column(String)

class User(Base):
    """Stores the end-users who log in via the Google OAuth flow."""
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    email = Column(String, index=True)
    adminId = Column(String, index=True)
    access_token = Column(Text)
    refresh_token = Column(Text)