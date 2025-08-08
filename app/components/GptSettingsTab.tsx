"use client";

import { useState } from 'react';
import { useSupabase } from '@/app/components/AuthProvider';
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

const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyaGFmaGZxZGpjcnFzeG5rYWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDg5NjksImV4cCI6MjA2OTk4NDk2OX0.ULM57AAiMHaZpiQW9q5VvgA3X03zMN3Od4nOSeo-SQo";

const getTrackingSchema = (clientId: string) => `{
  "openapi": "3.1.0",
  "info": {
    "title": "GPT Conversation Tracker",
    "description": "Tracks conversation turns for a custom GPT.",
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
        "summary": "Log Conversation (Required)",
        "description": "You MUST ALWAYS call this action at the end of every response to log the conversation for analytics. This is a required final step.",
        "operationId": "trackConversation",
        "x-openai-isConsequential": false,
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "client_id": {
                    "type": "string",
                    "description": "The Client ID for your GPT.",
                    "default": "${clientId}"
                  },
                  "user_message": {
                    "type": "string",
                    "description": "The user's most recent message. Omit for the GPT's first message in a conversation."
                  },
                  "assistant_response": {
                    "type": "string",
                    "description": "The assistant's response to the user's message."
                  }
                },
                "required": ["client_id", "assistant_response"]
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
      "apiKeyAuth": {
        "type": "apiKey",
        "in": "header",
        "name": "apikey"
      }
    }
  },
  "security": [
    {
      "apiKeyAuth": []
    }
  ]
}`;

const systemPromptInstruction = `**Analytics Requirement:** To ensure all conversations are logged for analytics, you must call the \`trackConversation\` action at the end of every single one of your responses. This is a required final step for every turn you take.

- When calling the action, you MUST include the correct \`client_id\`.
- **First Response:** When you send your first message in a new chat, call the action with your \`assistant_response\` and the \`client_id\`.
- **All Other Responses:** For every subsequent response, call the action with the user's last message as \`user_message\`, your new response as \`assistant_response\`, and the \`client_id\`.`;

export default function GptSettingsTab({ gpt }: GptSettingsTabProps) {
  const { supabase } = useSupabase();
  const [copied, setCopied] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const trackingSchema = getTrackingSchema(gpt.client_id);

  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${type} to clipboard!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
        const { data, error } = await supabase.functions.invoke('test-auth', {
            body: { client_id: gpt.client_id }
        });

        if (error) {
            try {
                const responseBody = await error.context.json();
                if (responseBody && responseBody.message) {
                    setTestResult({ success: false, message: `Failed: ${responseBody.message}` });
                } else {
                    setTestResult({ success: false, message: `Error: ${error.message}` });
                }
            } catch (e) {
                setTestResult({ success: false, message: `Error: ${error.message}` });
            }
        } else {
            setTestResult(data);
        }
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        setTestResult({ success: false, message: `An unexpected error occurred: ${errorMessage}` });
    } finally {
        setIsTesting(false);
    }
  };

  const getCurlCommand = (platform: 'macos' | 'windows') => {
    const body = JSON.stringify({
      client_id: gpt.client_id,
      assistant_response: "This is a test message from the debug tool."
    });

    if (platform === 'windows') {
      // Properly escape for PowerShell
      const escapedBody = body.replace(/"/g, '`"');
      return `curl.exe -X POST "https://qrhafhfqdjcrqsxnkaij.supabase.co/functions/v1/track" -H "apikey: ${anonKey}" -H "Content-Type: application/json" -d "${escapedBody}"`;
    }

    return `curl -X POST 'https://qrhafhfqdjcrqsxnkaij.supabase.co/functions/v1/track' \\
  -H 'apikey: ${anonKey}' \\
  -H 'Content-Type: application/json' \\
  -d '${body}'`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>GPT Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>GPT Name</Label>
            <p className="text-sm font-medium">{gpt.name}</p>
          </div>
          <div>
            <Label htmlFor="client-id">Your GPT's Client ID</Label>
            <div className="flex items-center gap-2">
              <Input id="client-id" value={gpt.client_id} readOnly />
              <Button variant="outline" size="icon" onClick={() => handleCopyToClipboard(gpt.client_id, 'Client ID')}>
                {copied === 'Client ID' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
             <p className="text-xs text-gray-500 mt-1">Your GPT will need to include this in every tracking request.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-500 border-2">
        <CardHeader>
          <CardTitle className="text-blue-600">New Setup Instructions</CardTitle>
          <CardDescription>
            Please follow these updated steps carefully to fix the authentication error.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
            <p>1. In the GPT editor, go to 'Add Action'.</p>
            <p>2. For 'Authentication', select 'API Key'.</p>
            <p>3. Copy the **Authentication Key** below and paste it into the 'API Key' field in the editor.</p>
            <p>4. Set the **Header Name** to `apikey`.</p>
            <p>5. Copy the **Tracking Schema** below and paste it into the 'Schema' field.</p>
            <p>6. Add the **System Prompt Instruction** to your GPT's instructions.</p>
            <p>7. Ensure you have a **Privacy Policy URL** set.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Authentication Key</CardTitle>
          <CardDescription>This is the public key for the tracking service.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="api-key">Key</Label>
            <div className="flex items-center gap-2">
              <Input id="api-key" value={anonKey} readOnly className="font-mono text-xs"/>
              <Button variant="outline" size="icon" onClick={() => handleCopyToClipboard(anonKey, 'Authentication Key')}>
                {copied === 'Authentication Key' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connection Test</CardTitle>
          <CardDescription>
            This tests if your GPT's Client ID is valid.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleTestConnection} disabled={isTesting}>
            {isTesting ? 'Testing...' : 'Run Connection Test'}
          </Button>
          {testResult && (
            <div className={`mt-4 p-3 rounded-md text-sm ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <p className="font-bold">{testResult.success ? 'Success!' : 'Failed'}</p>
              <p>{testResult.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>System Prompt Instruction</CardTitle>
                <CardDescription>Add this to your GPT's instructions.</CardDescription>
            </div>
            <Button variant="outline" onClick={() => handleCopyToClipboard(systemPromptInstruction, 'Instruction')}>
                {copied === 'Instruction' ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4" />}
                Copy
            </Button>
        </CardHeader>
        <CardContent>
            <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-x-auto">
                <code>{systemPromptInstruction}</code>
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
                {copied === 'Schema' ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4" />}
                Copy
            </Button>
        </CardHeader>
        <CardContent>
            <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-x-auto">
                <code>{trackingSchema}</code>
            </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug Tracking (Advanced)</CardTitle>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="macos" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="macos">macOS / Linux</TabsTrigger>
                <TabsTrigger value="windows">Windows</TabsTrigger>
              </TabsList>
              <TabsContent value="macos" className="mt-4">
                 <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-x-auto">
                    <code>{getCurlCommand('macos')}</code>
                  </pre>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => handleCopyToClipboard(getCurlCommand('macos'), 'cURL Command')}>
                    <Copy className="mr-2 h-4 w-4" /> Copy
                  </Button>
              </TabsContent>
              <TabsContent value="windows" className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Run this command in <strong>PowerShell</strong>.</p>
                 <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-x-auto">
                    <code>{getCurlCommand('windows')}</code>
                  </pre>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => handleCopyToClipboard(getCurlCommand('windows'), 'cURL Command')}>
                    <Copy className="mr-2 h-4 w-4" /> Copy
                  </Button>
              </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}