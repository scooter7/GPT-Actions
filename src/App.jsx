import React, { useState, useEffect } from 'react';
import { supabase } from './integrations/supabase/client';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gpts, setGpts] = useState([]);

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

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error.message);
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

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-200">
        <p className="text-lg text-gray-700">Loading...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-200">
      <h1 className="text-4xl font-bold mb-4 text-black">GPT Auth</h1>
      <p className="text-lg text-gray-700 mb-8">Authenticate your custom GPTs with ease.</p>
      
      {!session ? (
        <button
          onClick={handleSignIn}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Sign in with Google
        </button>
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
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default App;