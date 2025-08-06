"use client";

import { useSupabase } from '@/app/components/AuthProvider';
import GptDashboard from '@/app/components/GptDashboard';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { session, supabase } = useSupabase();
  const { push } = require('next/navigation').useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    push('/login');
  };

  if (!session) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <div>
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">GPT Auth</h1>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-4">
                {session.user.email}
              </span>
              <Button onClick={handleSignOut} variant="outline">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <GptDashboard />
    </div>
  );
}