"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, usePathname } from 'next/navigation';
import type { SupabaseClient, Session } from '@supabase/supabase-js';

type SupabaseContextType = {
  supabase: SupabaseClient;
  session: Session | null;
};

const SupabaseContext = createContext<SupabaseContextType | null>(null);

// --- TEMPORARY HARDCODED VALUES FOR DEBUGGING ---
// This is not a permanent solution. We are doing this to diagnose
// why the environment variables might not be loading correctly.
const SUPABASE_URL = "https://qrhafhfqdjcrqsxnkaij.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyaGFmaGZxZGpjcnFzeG5rYWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDg5NjksImV4cCI6MjA2OTk4NDk2OX0.ULM57AAiMHaZpiQW9q5VvgA3X03zMN3Od4nOSeo-SQo";
// --- END TEMPORARY VALUES ---

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClientComponentClient({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_ANON_KEY
  }));

  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error fetching session, signing out:", error.message);
          await supabase.auth.signOut();
          setSession(null);
        } else {
          setSession(initialSession);
        }
      } catch (e) {
        console.error("Exception fetching session, signing out:", e);
        await supabase.auth.signOut();
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login';

    if (!session && !isAuthPage) {
      router.push('/login');
    }
    
    if (session && isAuthPage) {
      router.push('/dashboard');
    }
  }, [session, pathname, router, loading]);

  return (
    <SupabaseContext.Provider value={{ supabase, session }}>
      {loading ? (
        <div className="flex min-h-screen flex-col items-center justify-center p-24">
            <p>Loading session...</p>
        </div>
      ) : children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === null) {
    throw new Error('useSupabase must be used within an AuthProvider');
  }
  return context;
};