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

// --- DEBUGGING: Using a simplified schema and prompt to test basic connectivity ---
const trackingSchema = `{
  "openapi": "3.1.0",
  "info": {
    "title": "GPT Connection Test",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://qrhafhfqdjcrqsxnkaij.supabase.co/functions/v1"
    }
  ],
  "paths": {
    "/test-hit": {
      "post": {
        "summary": "Test API Connection",
        "description": "A simple test to confirm the GPT can call an action. Takes no parameters.",
        "operationId": "testConnection",
        "responses": {
          "200": {
            "description": "Test successful"
          }
        }
      }
    }
  },
  "components": {
    "securitySchemes": {
      "apiKey": {
        "type": "http",
        "scheme": "bearer"
      }
    }
  },
  "security": [
    {
      "apiKey": []
    }
  ]
}`;

const systemPromptInstruction = `CRITICAL INSTRUCTION: At the very beginning of our conversation, before your first response, you MUST call the 'testConnection' action. This is a required test.`;
// --- END DEBUGGING SECTION ---

export default function GptSettingsTab({ gpt }: GptSettingsTabProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(`Copied ${type} to clipboard!`);
    setTimeout(() => setCopied(null), 2000);
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
          <CardTitle>OAuth Configuration</CardTitle>
          <CardDescription>Use these details to configure OAuth for your custom GPT.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="client-id">Client ID</Label>
            <div className="flex items-center gap-2">
              <Input id="client-id" value={gpt.client_id} readOnly />
              <Button variant="outline" size="icon" onClick={() => handleCopyToClipboard(gpt.client_id, 'Client ID')}>
                {copied === 'Client ID' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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

      <Card>
        <CardHeader>
          <CardTitle>Tracking API (DEBUG MODE)</CardTitle>
          <CardDescription>This is currently configured to use a simple test action.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="api-key">API Key</Label>
            <div className="flex items-center gap-2">
              <Input id="api-key" value={gpt.client_id} readOnly />
              <Button variant="outline" size="icon" onClick={() => handleCopyToClipboard(gpt.client_id, 'API Key')}>
                {copied === 'API Key' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
             <p className="text-xs text-gray-500 mt-1">This key is used to authenticate requests to the tracking endpoint.</p>
          </div>
           <div>
            <Label>Endpoint URL</Label>
             <p className="text-sm font-mono bg-gray-100 p-2 rounded">
              {`https://qrhafhfqdjcrqsxnkaij.supabase.co/functions/v1/test-hit`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>Follow these steps to enable tracking for your custom GPT.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
            <p>1. In the GPT editor, go to the 'Configure' tab and click 'Add Action'.</p>
            <p>2. For 'Authentication', select 'API Key'. Paste the **API Key** from above into the 'API Key' field and select 'Bearer' for 'Auth Type'.</p>
            <p>3. Copy the **Tracking Schema** below and paste it into the 'Schema' field.</p>
            <p>4. Copy the **System Prompt Instruction** below and add it to your GPT's instructions.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>System Prompt Instruction</CardTitle>
                <CardDescription>Add this to your GPT's instructions.</CardDescription>
            </div>
            <Button variant="outline" onClick={() => handleCopyToClipboard(systemPromptInstruction, 'Instruction')}>
                {copied === 'Instruction' ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                Copy Instruction
            </Button>
        </CardHeader>
        <CardContent>
            <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-x-auto">
                <code>
                    {systemPromptInstruction}
                </code>
            </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Tracking Schema</CardTitle>
                <CardDescription>Copy this OpenAPI schema for your tracking action.</CardDescription>
            </div>
            <Button variant="outline" onClick={() => handleCopyToClipboard(trackingSchema, 'Schema')}>
                {copied === 'Schema' ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                Copy Schema
            </Button>
        </CardHeader>
        <CardContent>
            <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-x-auto">
                <code>
                    {trackingSchema}
                </code>
            </pre>
        </CardContent>
      </Card>
    </div>
  );
}