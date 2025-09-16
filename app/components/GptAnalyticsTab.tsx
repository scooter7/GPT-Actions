"use client";

import { useEffect, useState } from 'react';
import { useSupabase } from './AuthProvider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type GptLog = {
  id: number;
  user_message: string | null;
  assistant_response: string | null;
  created_at: string;
  gpt_user_id: string | null;
  gpt_users: { session_id: string | null; } | null;
};

interface GptAnalyticsTabProps {
  gptId: string;
}

export default function GptAnalyticsTab({ gptId }: GptAnalyticsTabProps) {
  const { supabase } = useSupabase();
  const [logs, setLogs] = useState<GptLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      
      // Updated query to properly join with gpt_users table
      const { data, error } = await supabase
        .from('gpt_logs')
        .select(`
          id, 
          user_message, 
          assistant_response, 
          created_at, 
          gpt_user_id,
          gpt_users!inner(session_id)
        `)
        .eq('gpt_id', gptId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) {
        console.log('Fetched logs data:', data);
        setLogs(data.map(log => ({
          ...log,
          gpt_users: Array.isArray(log.gpt_users) ? log.gpt_users[0] : log.gpt_users
        })) as GptLog[]);
      }
      if (error) {
        console.error("Error fetching GPT logs:", error);
      }
      setLoading(false);
    };

    if (gptId) {
      fetchLogs();
    }
  }, [gptId, supabase]);

  // Helper function to extract a readable user identifier from session ID
  const getUserDisplayName = (sessionId: string | null | undefined) => {
    if (!sessionId) return 'Unknown';
    
    // If it's a session ID (starts with user_), extract a shorter version
    if (sessionId.startsWith('user_')) {
      const parts = sessionId.split('_');
      if (parts.length >= 3) {
        // Return last 6 characters for brevity
        return `User ${parts[2].substring(0, 6)}`;
      }
    }
    
    // If it's an email or other format, return as is (truncated)
    return sessionId.length > 20 ? `${sessionId.substring(0, 20)}...` : sessionId;
  };

  // Helper function to get a consistent color for each user
  const getUserColor = (sessionId: string | null | undefined) => {
    if (!sessionId) return 'secondary';
    
    const colors = ['default', 'secondary', 'destructive', 'outline'];
    const hash = sessionId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) {
    return <p>Loading analytics...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation Logs</CardTitle>
        <p className="text-sm text-gray-600">
          Each user session is identified with a unique ID to distinguish between different users.
        </p>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500">No conversation logs found for this GPT yet.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Session</TableHead>
                  <TableHead>User Message</TableHead>
                  <TableHead>Assistant Response</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const sessionId = log.gpt_users?.session_id;
                  const displayName = getUserDisplayName(sessionId);
                  const badgeVariant = getUserColor(sessionId);
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant={badgeVariant as any} className="text-xs">
                          {displayName}
                        </Badge>
                        {/* Debug info - remove this after testing */}
                        <div className="text-xs text-gray-400 mt-1">
                          ID: {log.gpt_user_id} | Session: {sessionId || 'null'}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {log.user_message ? (
                          <div className="truncate" title={log.user_message}>
                            {log.user_message}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">First message</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={log.assistant_response || ''}>
                          {log.assistant_response}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {isClient ? new Date(log.created_at).toLocaleString() : ''}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {logs.length >= 100 && <p className="text-sm text-gray-500 mt-4">Showing the last 100 log entries.</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}