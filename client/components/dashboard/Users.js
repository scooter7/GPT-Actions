'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../auth/SupabaseProvider';
import { Loader2 } from 'lucide-react';

// Helper component to handle client-side date localization
const LocalizedDate = ({ dateString }) => {
  const [formattedDate, setFormattedDate] = useState(dateString);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (dateString) {
      setFormattedDate(new Date(dateString).toLocaleString());
    }
  }, [dateString]);

  return isClient ? formattedDate : dateString;
};

const Users = ({ selectedGPT }) => {
  const { supabase } = useSupabase();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    if (!selectedGPT) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const { data, error: fetchError } = await supabase
      .from('gpt_users')
      .select('email, created_at')
      .eq('gpt_id', selectedGPT.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      setError('Failed to load users. Please try again.');
      setUsers([]);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }, [supabase, selectedGPT]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Users {selectedGPT && <span className="text-blue-400">({selectedGPT.name})</span>}</h2>
      </div>
      <div className="bg-[#161b22] border border-gray-700 rounded-lg">
        {loading ? (
          <div className="p-12 text-center text-gray-400 flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 mr-2" />
            <span>Loading users...</span>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-400">{error}</div>
        ) : !users || users.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p>Your signed up users will appear here once they interact with your GPT.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 font-semibold">Email</th>
                  <th className="px-6 py-3 font-semibold">Sign-up Date</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4"><LocalizedDate dateString={user.created_at} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;