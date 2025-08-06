import React, { useState, useEffect } from 'react';
import { supabase } from './integrations/supabase/client';
import CreateGPTForm from './components/CreateGPTForm';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gpts, setGpts] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  useEffect(() => {
    // Check for an existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchGpts();
    }
  }, [session]);

  const fetchGpts = async () => {
    try {
      const { data, error } = await supabase
        .from('gpts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGpts(data || []);
    } catch (error) {
      console.error('Error fetching GPTs:', error);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error.message);
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Show success message
      setAuthError("Check your email for the confirmation link!");
    } catch (error) {
      console.error('Error signing up:', error.message);
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
      });
      
      if (error) throw error;
      
      // Show success message
      setAuthError("Check your email for the magic link!");
    } catch (error) {
      console.error('Error sending magic link:', error.message);
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGptCreated = (newGpt) => {
    setGpts([newGpt, ...gpts]);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-200">
        <p className="text-lg text-gray-700">Loading...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-200 p-4">
      <h1 className="text-4xl font-bold mb-4 text-black">GPT Auth</h1>
      <p className="text-lg text-gray-700 mb-8">Authenticate your custom GPTs with ease.</p>
      
      {!session ? (
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between mb-4">
            <button 
              onClick={() => setShowSignUp(false)}
              className={`px-4 py-2 ${!showSignUp ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} rounded-lg font-semibold`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setShowSignUp(true)}
              className={`px-4 py-2 ${showSignUp ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} rounded-lg font-semibold`}
            >
              Sign Up
            </button>
          </div>
          
          {authError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {authError}
            </div>
          )}
          
          <form onSubmit={showSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-gray-700 mb-1">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-gray-700 mb-1">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              disabled={authLoading}
            >
              {authLoading ? 'Loading...' : showSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-4">
            <button
              onClick={handleMagicLink}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              disabled={!email || authLoading}
            >
              Sign In with Magic Link
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl p-6 bg-white rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Welcome, {session.user.email}</h2>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Sign Out
            </button>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Your GPTs</h3>
            {gpts.length === 0 ? (
              <p className="text-gray-500">You don't have any GPTs yet.</p>
            ) : (
              <ul className="space-y-2">
                {gpts.map((gpt) => (
                  <li key={gpt.id} className="p-4 bg-gray-100 rounded-lg">
                    <h4 className="font-bold">{gpt.name}</h4>
                    <p className="text-gray-600">{gpt.description || 'No description'}</p>
                    <div className="mt-2 flex gap-2">
                      <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                        View Details
                      </button>
                      <button className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300">
                        Copy API Key
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <CreateGPTForm onGptCreated={handleGptCreated} />
        </div>
      )}
    </main>
  );
}

export default App;