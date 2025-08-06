"use client";

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

type Gpt = {
  id: string;
  name: string;
  description: string | null;
  client_id: string;
  created_at: string;
};

interface GptSettingsTabProps {
  gpt: Gpt;
}

export default function GptSettingsTab({ gpt }: GptSettingsTabProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>GPT Details</CardTitle>
          <CardDescription>Basic information about your GPT.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>GPT Name</Label>
            <p className="text-sm font-medium">{gpt.name}</p>
          </div>
          <div>
            <Label>Description</Label>
            <p className="text-sm text-gray-600">{gpt.description || 'No description provided.'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>Use these details to configure OAuth for your custom GPT.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="client-id">Client ID</Label>
            <div className="flex items-center gap-2">
              <Input id="client-id" value={gpt.client_id} readOnly />
              <Button variant="outline" size="icon" onClick={() => handleCopyToClipboard(gpt.client_id)}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div>
            <Label>Authentication URL</Label>
            <p className="text-sm font-mono bg-gray-100 p-2 rounded">
              {`https://qrhafhfqdjcrqsxnkaij.supabase.co/auth/v1/authorize`}
            </p>
            <p className="text-xs text-gray-500 mt-1">This is the authorization endpoint for your GPT.</p>
          </div>
          <div>
            <Label>Token URL</Label>
             <p className="text-sm font-mono bg-gray-100 p-2 rounded">
              {`https://qrhafhfqdjcrqsxnkaij.supabase.co/auth/v1/token`}
            </p>
             <p className="text-xs text-gray-500 mt-1">This is the token endpoint for your GPT.</p>
          </div>
           <div>
            <Label>Scope</Label>
             <p className="text-sm font-mono bg-gray-100 p-2 rounded">
              email
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}