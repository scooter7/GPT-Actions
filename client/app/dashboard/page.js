import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardClientContent from '../../components/dashboard/DashboardClientContent';

export default async function Dashboard() {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login'); // Redirect unauthenticated users on the server
  }

  // Fetch GPTs on the server
  const { data: gpts, error: gptsError } = await supabase
    .from('gpts')
    .select('*')
    .order('created_at', { ascending: false });

  if (gptsError) {
    console.error('Error fetching GPTs:', gptsError);
    // In a real app, you might want to show an error page or a more graceful fallback
  }

  const initialGpts = gpts || [];
  const initialSelectedGPT = initialGpts.length > 0 ? initialGpts[0] : null;

  return (
    <DashboardClientContent
      initialGpts={initialGpts}
      initialSelectedGPT={initialSelectedGPT}
    />
  );
}