"use client";

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

const trackingSchema = `{
  "openapi": "3.1.0",
  "info": {
    "title": "GPT Conversation Tracker",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://qrhafhfqdjcrqsxnkaij.supabase.co/functions/v1"
    }
  ],
  "paths": {
    "/track": {
      "post": {
        "summary": "Track Conversation Turn",
        "description": "Records a user message and the assistant's response for analytics.",
        "operationId": "trackConversation",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "user_message": {
                    "type": "string",
                    "description": "The user's most recent message. Omit for the GPT's first message in a conversation."
                  },
                  "assistant_response": {
                    "type": "string",
                    "description": "The assistant's response to the user's message."
                  }
                },
                "required": ["assistant_response"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Tracking successful."
          }
        }
      }
    }
  },
  "components": {
    "schemas": {},
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

const systemPromptInstruction = `**Analytics Requirement:** To ensure all conversations are logged for analytics, you must call the \`trackConversation\` action at the end of every single one of your responses. This is a required final step for every turn you take.

- **First Response:** When you send your first message in a new chat, call the action with your \`assistant_response\`.
- **All Other Responses:** For every subsequent response, call the action with the user's last message as \`user_message\` and your new response as \`assistant_response\`.`;

export default function GptSettingsTab({ gpt }: GptSettingsTabProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${type} to clipboard!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const curlCommandMacOS = `curl -X POST 'https://qrhafhfqdjcrqsxnkaij.supabase.co/functions/v1/track' \\
  -H 'Authorization: Bearer ${gpt.client_id}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "assistant_response": "This is a test message from the debug tool."
  }'`;

  const curlCommandWindows = `curl.exe -X POST "https://qrhafhfqdjcrqsxnkaij.supabase.co/functions/v1/track" -H "Authorization: Bearer ${gpt.client_id}" -H "Content-Type: application/json" -d "{\\"assistant_response\\": \\"This is a test message from the debug tool.\\"}"`;

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
          <CardTitle>Tracking API</CardTitle>
          <CardDescription>Configure your GPT to send conversation data for analytics.</CardDescription>
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
             <p className="text-xs text-gray-500 mt-1">This key authenticates your GPT with the tracking service.</p>
          </div>
           <div>
            <Label>Endpoint URL</Label>
             <p className="text-sm font-mono bg-gray-100 p-2 rounded">
              {`https://qrhafhfqdjcrqsxnkaij.supabase.co/functions/v1/track`}
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
            <p>5. Add a **Privacy Policy URL** in the action editor. This is required for the confirmation dialog to appear. See the card below for details.</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy URL</CardTitle>
          <CardDescription>
            This is a required field in the GPT Editor for actions to work correctly. It gives users information about how their data is handled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-2">
            In the GPT Editor, under your Action settings, paste a URL into the "Privacy policy" field.
          </p>
          <p className="text-sm mb-4">
            For now, you can use the main URL of your deployed application. If you don't have a dedicated privacy page yet, the root URL is usually sufficient to get started.
          </p>
          <Label>Example URL</Label>
          <p className="text-sm font-mono bg-gray-100 p-2 rounded">
            https://your-app-name.vercel.app
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug Tracking</CardTitle>
          <CardDescription>
            If tracking isn't working, run this command in your terminal to test the endpoint directly. A successful test will create a log entry in the "Analytics" tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="macos" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="macos">macOS / Linux</TabsTrigger>
                <TabsTrigger value="windows">Windows</TabsTrigger>
              </TabsList>
              <TabsContent value="macos" className="mt-4">
                 <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-x-auto">
                    <code>
                      {curlCommandMacOS}
                    </code>
                  </pre>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => handleCopyToClipboard(curlCommandMacOS, 'cURL Command')}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Command
                  </Button>
              </TabsContent>
              <TabsContent value="windows" className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Run this command in <strong>PowerShell</strong>, not the old Command Prompt (cmd.exe).</p>
                 <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-x-auto">
                    <code>
                      {curlCommandWindows}
                    </code>
                  </pre>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => handleCopyToClipboard(curlCommandWindows, 'cURL Command')}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Command
                  </Button>
              </TabsContent>
            </Tabs>
        </CardContent>
      </Card>

      <Card className="border-red-500 border-2">
        <CardHeader>
          <CardTitle className="text-red-600">Troubleshooting: GPT isn't calling the action</CardTitle>
          <CardDescription>
            If your GPT responds with "I can't make API calls" or gives you code instead of calling the action, it means the action was not set up correctly in the GPT Editor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="font-bold">This is almost always caused by an error in the 'Schema' field.</p>
          <p>Please follow these steps exactly:</p>
          <ol className="list-decimal list-inside space-y-2 pl-4">
            <li>Go to the GPT Editor and open your action settings.</li>
            <li><strong>Delete everything</strong> from the 'Schema' text box. Make sure it is completely empty.</li>
            <li>Come back to this page and click the "Copy Schema" button again.</li>
            <li>Paste the new schema into the empty 'Schema' box.</li>
            <li>Click the "Save" button at the top right of the GPT Editor to save your changes.</li>
            <li>Start a <strong>new chat</strong> with your GPT to test it. Old conversations may not use the new settings.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}