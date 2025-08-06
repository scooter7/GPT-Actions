import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';

function Analytics({ gpt }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    avgMessagesPerUser: 0
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    if (!gpt) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Get user count
      const { count: userCount, error: userError } = await supabase
        .from('gpt_users')
        .select('id', { count: 'exact', head: true })
        .eq('gpt_id', gpt.id);

      if (userError) throw userError;

      // Get message logs
      const { data: logData, count: logCount, error: logError } = await supabase
        .from('gpt_logs')
        .select('id, user_message, assistant_response, created_at, gpt_users(email)', { count: 'exact' })
        .eq('gpt_id', gpt.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (logError) throw logError;

      // Calculate stats
      const avgMessages = userCount > 0 ? (logCount / userCount).toFixed(1) : 0;

      setStats({
        totalUsers: userCount || 0,
        totalMessages: logCount || 0,
        avgMessagesPerUser: avgMessages
      });

      setLogs(logData || []);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [gpt]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleTestTrack = async () => {
    setTestResult(null);
    setTestLoading(true);
    try {
      const apiKey = gpt?.client_id;
      if (!apiKey) {
        setTestResult({ type: 'error', message: 'No API key found for this GPT.' });
        return;
      }
      const response = await fetch('https://qrhafhfqdjcrqsxnkaij.supabase.co/functions/v1/track', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_email: 'test@example.com',
          user_message: 'This is a test message from the dashboard.',
          assistant_response: 'This is a test assistant response.'
        })
      });
      const data = await response.json();
      if (response.ok) {
        setTestResult({ type: 'success', message: 'Test log sent successfully! Log ID: ' + (data.log_id || 'N/A') });
        fetchAnalytics(); // Refresh analytics
      } else {
        setTestResult({ type: 'error', message: data.error || 'Unknown error' });
      }
    } catch (err) {
      setTestResult({ type: 'error', message: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Analytics</h3>
        <button
          onClick={handleTestTrack}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition disabled:opacity-50"
          disabled={testLoading || !gpt}
        >
          {testLoading ? 'Sending...' : 'Send Test Track Log'}
        </button>
      </div>

      {testResult && (
        <div className={`mb-4 px-4 py-2 rounded text-sm ${testResult.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
          {testResult.message}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-gray-500 text-sm">Total Users</p>
          <p className="text-2xl font-bold">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-gray-500 text-sm">Total Messages</p>
          <p className="text-2xl font-bold">{stats.totalMessages}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-gray-500 text-sm">Avg. Messages per User</p>
          <p className="text-2xl font-bold">{stats.avgMessagesPerUser}</p>
        </div>
      </div>
      
      <h4 className="font-semibold mb-2">Recent Conversations</h4>
      {logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
          No conversation logs available yet.
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">{log.gpt_users?.email || 'Unknown User'}</span>
                <span className="text-sm text-gray-500">{formatDate(log.created_at)}</span>
              </div>
              <div className="mb-2">
                <span className="font-medium">User: </span>
                <span className="text-gray-700">{log.user_message}</span>
              </div>
              <div>
                <span className="font-medium">Assistant: </span>
                <span className="text-gray-700">{log.assistant_response}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Analytics;