"use client";

import { useEffect, useState } from 'react';
import { useSupabase } from './AuthProvider';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import CreateGptDialog from './CreateGptDialog';
import { PlusCircle } from 'lucide-react';

type Gpt = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export default function GptDashboard() {
  const { supabase, session } = useSupabase();
  const [gpts, setGpts] = useState<Gpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  const fetchGpts = async () => {
    if (!session) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('gpts')
      .select('id, name, description, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setGpts(data);
    }
    if (error) {
      console.error("Error fetching GPTs:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGpts();
  }, [session]);

  const handleGptCreated = () => {
    fetchGpts();
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Your GPTs</h1>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New GPT
            </Button>
          </div>
        </header>
        <main className="py-10">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            {loading ? (
              <p className="text-center">Loading your GPTs...</p>
            ) : gpts.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">No GPTs found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new GPT.</p>
                <div className="mt-6">
                   <Button onClick={() => setCreateDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create New GPT
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {gpts.map((gpt) => (
                  <Card key={gpt.id}>
                    <CardHeader>
                      <CardTitle>{gpt.name}</CardTitle>
                      <CardDescription>{gpt.description || 'No description'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(gpt.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Link href={`/dashboard/gpt/${gpt.id}`} passHref>
                        <Button>Manage</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <CreateGptDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onGptCreated={handleGptCreated}
      />
    </>
  );
}