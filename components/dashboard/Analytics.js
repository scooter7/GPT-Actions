'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../auth/SupabaseProvider';
import { Loader2, MessageSquare, Users, BarChart3 } from 'lucide-react';

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

const StatCard = ({ title, value, icon }) => (
  <div className="bg-[#161b22] border border-gray-700 p-4 rounded-lg flex items-center gap-4">
    <div className="bg-gray-700 p-3 rounded-lg">{icon}</div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const Analytics = ({ selectedGPT }) => {
  const { supabase } = useSupabase();
  const [stats, setStats] = useState({ totalUsers: 0, totalConversations: 0, avgMessages: 0 });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = useCallback(async () => {
    if (!selectedGPT) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Fetch users count
      const { count: usersCount, error: usersError } = await supabase
        .from('gpt_users')
        .select('id', { count: 'exact', head: true })
        .eq('gpt_id', selectedGPT.id);

      if (usersError) throw usersError;

      // Fetch logs and logs count
      const { data: logsData, count: logsCount, error: logsError } = await supabase
        .from('gpt_logs')
        .select('user_message, assistant_response, created_at, gpt_users(email)', { count: 'exact' })
        .eq('gpt_id', selectedGPT.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (logsError) throw logsError;

      setStats({
        totalUsers: usersCount || 0,
        totalConversations: logsCount || 0,
        avgMessages: (usersCount || 0) > 0 ? ((logsCount || 0) / (usersCount || 0)).toFixed(1) : 0,
      });
      setLogs(logsData || []);

    } catch (fetchError) {
      console.error('Error fetching analytics:', fetchError);
      setError('Failed to load analytics data. Please try again.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedGPT]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <Loader2 className="animate-spin h-12 w-12" />
        <p className="mt-4">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-12 text-center text-red-400">{error}</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Analytics {selectedGPT && <span className="text-blue-400">({selectedGPT.name})</span>}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Users" value={stats.totalUsers} icon={<Users size={24} />} />
        <StatCard title="Total Messages" value={stats.totalConversations} icon={<MessageSquare size={24} />} />
        <StatCard title="Avg Msgs / User" value={stats.avgMessages} icon={<BarChart3 size={24} />} />
      </div>
      <div className="bg-[#161b22] border border-gray-700 p-4 rounded-lg">
        <h3 className="font-semibold text-white mb-4">Recent Conversations</h3>
        {(!logs || logs.length === 0) ? (
          <div className="text-center text-gray-400 py-8">
            <p>No recent conversations to display.</p>
            <p className="text-sm">Interact with your GPT to see logs here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log, index) => (
              <div key={index} className="bg-[#0d1117] p-4 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center mb-3 text-sm">
                  <p className="font-semibold text-blue-400">{log.gpt_users?.email || 'Unknown User'}</p>
                  <p className="text-gray-500"><LocalizedDate dateString={log.created_at} /></p>
                </div>
                <div className="space-y-2 text-gray-300">
                  <p><strong>User:</strong> {log.user_message}</p>
                  <p><strong>Assistant:</strong> {log.assistant_response}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;