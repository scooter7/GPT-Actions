import { Inter } from 'next/font/google'
import './globals.css'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import SupabaseProvider from '../components/auth/SupabaseProvider'
import ToastProvider from '../components/ToastProvider' // Import ToastProvider

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'GPTAuth',
  description: 'Authenticate with your GPT',
  icons: {
    icon: '/favicon.ico',
  },
}

export default async function RootLayout({ children }) {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Securely get the user by verifying the session with the Supabase server
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null;
  // Fetch the user's profile only if the user is authenticated
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0d1117] text-white`}>
        <SupabaseProvider session={session} profile={profile}>
          <ToastProvider /> {/* Add ToastProvider here */}
          {children}
        </SupabaseProvider>
      </body>
    </html>
  )
}