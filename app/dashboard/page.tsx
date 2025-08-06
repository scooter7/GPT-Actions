"use client";

import { useSupabase } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { supabase, session } = useSupabase();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!session) {
    // This is a fallback, AuthProvider should handle redirection
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">GPT Auth Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-4">
                Logged in as {session.user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Welcome to your Dashboard</h2>
              <p>This is where you will manage your custom GPTs.</p>
              {/* GPT list and creation form will go here */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}