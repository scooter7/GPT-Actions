"use client";

import { useEffect, useState } from 'react';
import { useSupabase } from './AuthProvider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type GptLog = {
  id: number;
  user_message: string | null;
  assistant_response: string | null;
  created_at: string;
  // The Supabase client returns an array for this relationship, so we'll type it as such.
  gpt_user: { email: string }[] | null;
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
      const { data, error } = await supabase
        .from('gpt_logs')
        .select('id, user_message, assistant_response, created_at, gpt_user:gpt_users(email)')
        .eq('gpt_id', gptId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) {
        setLogs(data as GptLog[]);
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

  if (loading) {
    return <p>Loading analytics...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation Logs</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500">No conversation logs found for this GPT yet.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>User Message</TableHead>
                  <TableHead>Assistant Response</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    {/* Access the first element of the array to get the user's email. */}
                    <TableCell>{log.gpt_user?.[0]?.email || 'Unknown'}</TableCell>
                    <TableCell className="max-w-xs truncate">{log.user_message}</TableCell>
                    <TableCell className="max-w-xs truncate">{log.assistant_response}</TableCell>
                    <TableCell>{isClient ? new Date(log.created_at).toLocaleString() : ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {logs.length >= 100 && <p className="text-sm text-gray-500 mt-4">Showing the last 100 log entries.</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}