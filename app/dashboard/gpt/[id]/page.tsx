"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSupabase } from '@/app/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GptSettingsTab from '@/app/components/GptSettingsTab';
import GptUsersTab from '@/app/components/GptUsersTab';
import GptAnalyticsTab from '@/app/components/GptAnalyticsTab';
import { ArrowLeft } from 'lucide-react';

type Gpt = {
  id: string;
  name: string;
  description: string | null;
  client_id: string;
  created_at: string;
};

export default function GptDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { supabase } = useSupabase();
  const [gpt, setGpt] = useState<Gpt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGptDetails = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('gpts')
        .select('id, name, description, client_id, created_at')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error fetching GPT details:", error);
        setError("Failed to load GPT details. It might not exist or you may not have permission to view it.");
        setGpt(null);
      } else {
        setGpt(data);
        setError(null);
      }
      setLoading(false);
    };

    fetchGptDetails();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading GPT details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <p className="text-red-500">{error}</p>
        <Button variant="outline" onClick={() => router.push('/dashboard')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  if (!gpt) {
    return (
       <div className="max-w-4xl mx-auto p-8 text-center">
        <p>GPT not found.</p>
        <Button variant="outline" onClick={() => router.push('/dashboard')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
       <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push('/dashboard')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{gpt.name}</h1>
                    <p className="text-sm text-gray-500">Manage your GPT settings, users, and analytics.</p>
                </div>
            </div>
          </div>
        </header>

        <main className="py-10">
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <Tabs defaultValue="settings">
                    <TabsList>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                        <TabsTrigger value="users">Users</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    </TabsList>
                    <TabsContent value="settings">
                        <GptSettingsTab gpt={gpt} />
                    </TabsContent>
                    <TabsContent value="users">
                        <GptUsersTab gptId={gpt.id} />
                    </TabsContent>
                    <TabsContent value="analytics">
                        <GptAnalyticsTab gptId={gpt.id} />
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    </div>
  );
}