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

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  // This automatically uses the NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
  // environment variables.
  const [supabase] = useState(() => createClientComponentClient());

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