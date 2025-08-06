'use client';
import { Sun, LogOut } from 'lucide-react';
import { useSupabase } from '../auth/SupabaseProvider';
import { useRouter } from 'next/navigation';

const Header = ({ onMyGPTs }) => {
  const { supabase } = useSupabase();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="flex items-center justify-between p-4 border-b border-gray-700">
      <nav className="flex items-center gap-6">
        <button onClick={onMyGPTs} className="text-gray-300 hover:text-white">My GPTs</button>
        <a href="#" className="text-gray-300 hover:text-white">Pricing</a>
      </nav>
      <div className="flex items-center gap-4">
        <button className="text-gray-400 hover:text-white">
          <Sun size={20} />
        </button>
        <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;