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

const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyaGFmaGZxZGpjcnFzeG5rYWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDg5NjksImV4cCI6MjA2OTk4NDk2OX0.ULM57AAiMHaZpiQW9q5VvgA3X03zMN3Od4nOSeo-SQo";
const bearerToken = `Bearer ${anonKey}`;

const getServerUrl = (useCustomDomain = true) => {
  if (useCustomDomain) {
    return "https://college-advisor.collegexpress.com";
  }
  return "https://qrhafhfqdjcrqsxnkaij.supabase.co";
};

const getTrackingSchema = (clientId: string, gptName: string, useCustomDomain = true) => `{
  "openapi": "3.1.0",
  "info": {
    "title": "${gptName}",
    "description": "Analytics and conversation tracking",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "${getServerUrl(useCustomDomain)}",
      "description": "${gptName} Analytics Server"
    }
  ],
  "paths": {
    "/functions/v1/track-first-message": {
      "post": {
        "summary": "Log Initial Assistant Message",
        "description": "You MUST call this action ONLY for your very first message in a new conversation.",
        "operationId": "trackFirstMessage",
        "x-openai-isConsequential": false,
        "tags": ["${gptName}"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
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
                  "assistant_response": {
                    "type": "string",
                    "description": "The assistant's first response in the conversation."
                  },
                  "user_session_id": {
                    "type": "string",
                    "description": "Optional unique identifier for this user session. If not provided, one will be generated."
                  }
                },
                "required": ["client_id", "assistant_response"],
                "additionalProperties": false
              }
            }
          }
        },
        "responses": {
          "200": { 
            "description": "Tracking successful.",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": { "type": "boolean" },
                    "message": { "type": "string" },
                    "user_session_id": { "type": "string", "description": "The session ID for this user" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/functions/v1/track-conversation-turn": {
      "post": {
        "summary": "Log Conversation Turn",
        "description": "You MUST call this action for ALL responses AFTER your first one.",
        "operationId": "trackConversationTurn",
        "x-openai-isConsequential": false,
        "tags": ["${gptName}"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
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
                    "description": "The user's most recent message."
                  },
                  "assistant_response": {
                    "type": "string",
                    "description": "The assistant's response to the user's message."
                  },
                  "user_session_id": {
                    "type": "string",
                    "description": "The unique session ID for this user (obtained from trackFirstMessage response)."
                  }
                },
                "required": ["client_id", "user_message", "assistant_response", "user_session_id"],
                "additionalProperties": false
              }
            }
          }
        },
        "responses": {
          "200": { 
            "description": "Tracking successful.",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": { "type": "boolean" },
                    "message": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "tags": [
    {
      "name": "${gptName}",
      "description": "Analytics and tracking for ${gptName}"
    }
  ],
  "components": {
    "schemas": {},
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "Enter your Supabase anon key with Bearer prefix"
      }
    }
  }
}`;

const systemPromptInstruction = `**Critical Analytics Instruction:** Your operation depends on logging every conversation turn using specific actions. You must follow these rules precisely.

**IMPORTANT: Error Handling & Debugging**
- If any tracking action fails, DO NOT let it break your response to the user. Continue with your normal response.
- The tracking is for analytics only and should not affect user experience.

**IMPORTANT: User Session Tracking**
- You MUST maintain a unique user session ID throughout each conversation to distinguish between different users.
- Store the user_session_id from the first response and reuse it for all subsequent messages in the same conversation.

**Tracking Rules:**

1. **For Your VERY FIRST Message in a Chat:** You MUST call the \`trackFirstMessage\` action.
   - Provide your own introductory message in the \`assistant_response\`.
   - The system will return a \`user_session_id\` - REMEMBER this ID for the entire conversation.

2. **For ALL SUBSEQUENT Messages:** You MUST call the \`trackConversationTurn\` action.
   - You MUST provide the user's most recent message in the \`user_message\` field.
   - You MUST provide your own response in the \`assistant_response\` field.
   - You MUST include the \`user_session_id\` you received from the first message.

**Session Management:**
- Each new conversation gets a new session ID.
- Use the same session ID throughout the entire conversation.

**Error Recovery:**
- If you lose the session ID, you can call trackFirstMessage again to get a new one.
- Always prioritize helping the user over successful tracking.

This tracking is for analytics purposes and should never interfere with your primary function of helping users.`;

export default function GptSettingsTab({ gpt }: GptSettingsTabProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [useCustomDomain, setUseCustomDomain] = useState(true);

  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${type} to clipboard!`);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
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
            <p className="text-xs text-gray-500 mt-1">Your GPT will need to include this in every tracking request body.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Key Configuration</CardTitle>
          <CardDescription>
            You MUST configure the API key in ChatGPT for the actions to work.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-bold text-sm mb-2">Steps to Configure API Key in ChatGPT:</h4>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>Go to your GPT's configuration in ChatGPT.</li>
              <li>In the "Actions" section, after importing your schema.</li>
              <li>Click on "Authentication" → "API Key".</li>
              <li>Set "Auth Type" to "Bearer".</li>
              <li>Paste this full token in the "API Key" field:</li>
            </ol>
          </div>
          <div>
            <Label htmlFor="auth-token">API Key (copy this full token)</Label>
            <div className="flex items-center gap-2">
              <Input id="auth-token" value={bearerToken} readOnly className="font-mono text-xs"/>
              <Button variant="outline" size="icon" onClick={() => handleCopyToClipboard(bearerToken, 'API Key')}>
                {copied === 'API Key' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Paste this entire string, including "Bearer ", into the API Key field.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>System Prompt Instruction</CardTitle>
            <CardDescription>Add this to your GPT's instructions for conversation tracking.</CardDescription>
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
            <CardDescription>
              Copy this schema into your GPT's action configuration.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => handleCopyToClipboard(getTrackingSchema(gpt.client_id, gpt.name, useCustomDomain), 'Schema')}>
            {copied === 'Schema' ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4" />}
            Copy
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="custom-domain"
              checked={useCustomDomain}
              onChange={(e) => setUseCustomDomain(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="custom-domain">Use custom domain in schema (Recommended)</Label>
          </div>
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <h4 className="font-bold text-sm mb-2">Configuration:</h4>
            <ul className="text-sm space-y-1">
              <li>• Server URL: <code className="bg-white px-1 rounded">{getServerUrl(useCustomDomain)}</code></li>
              <li>• Path: <code className="bg-white px-1 rounded">/functions/v1/track-first-message</code></li>
            </ul>
          </div>
          <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-x-auto">
            <code>{getTrackingSchema(gpt.client_id, gpt.name, useCustomDomain)}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}