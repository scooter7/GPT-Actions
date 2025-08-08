"use client";

import { useEffect, useState } from 'react';
import { useSupabase } from './AuthProvider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type GptUser = {
  id: string;
  email: string;
  created_at: string;
};

interface GptUsersTabProps {
  gptId: string;
}

export default function GptUsersTab({ gptId }: GptUsersTabProps) {
  const { supabase } = useSupabase();
  const [users, setUsers] = useState<GptUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('gpt_users')
        .select('id, email, created_at')
        .eq('gpt_id', gptId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) {
        setUsers(data);
      }
      if (error) {
        console.error("Error fetching GPT users:", error);
      }
      setLoading(false);
    };

    if (gptId) {
      fetchUsers();
    }
  }, [gptId, supabase]);

  if (loading) {
    return <p>Loading users...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authenticated Users</CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-sm text-gray-500">No users have authenticated with this GPT yet.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Authenticated On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{isClient ? new Date(user.created_at).toLocaleString() : ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {users.length >= 100 && <p className="text-sm text-gray-500 mt-4">Showing the last 100 users.</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}