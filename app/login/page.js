'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSupabase } from '../../components/auth/SupabaseProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';

export default function Login() {
  const { supabase, session } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-[#0d1117] p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <Image src="/logo.svg" alt="GPT Auth Logo" width={80} height={80} />
          <h1 className="text-3xl font-bold text-white mt-4">GPT Auth</h1>
          <p className="text-gray-400">Sign in to manage your GPTs</p>
        </div>
        <div className="bg-[#161b22] p-8 rounded-lg border border-gray-700">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            theme="dark"
            providers={['google']}
            redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`}
          />
        </div>
      </div>
    </main>
  );
}