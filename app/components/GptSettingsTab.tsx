"use client";

import { useEffect, useState } from 'react';
import { useSupabase } from '@/app/components/AuthProvider';
import { Copy, Check, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
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

type EndpointResult = {
  status?: number;
  statusText?: string;
  success: boolean;
  data?: string;
  error?: string;
};

type DiagnosticsResults = {
  customDomain: Record<string, EndpointResult>;
  supabase: Record<string, EndpointResult>;
  dnsInfo: Record<string, any>;
  recommendations: string[];
};

const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyaGFmaGZxZGpjcnFzeG5rYWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDg5NjksImV4cCI6MjA2OTk4NDk2OX0.ULM57AAiMHaZpiQW9q5VvgA3X03zMN3Od4nOSeo-SQo";
const bearerToken = `Bearer ${anonKey}`;

// FIXED: Custom domain now includes the correct /functions/v1 path
const getApiUrl = (useCustomDomain = true) => {
  if (useCustomDomain) {
    return "https://college-advisor.collegexpress.com/functions/v1";
  }
  return "https://qrhafhfqdjcrqsxnkaij.supabase.co/functions/v1";
};

const getTestSchema = (gptName: string, useCustomDomain = true) => `{
  "openapi": "3.1.0",
  "info": {
    "title": "${gptName} Analytics",
    "description": "Test if the tracking system is working",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "${getApiUrl(useCustomDomain)}"
    }
  ],
  "paths": {
    "/test-custom-domain": {
      "post": {
        "summary": "Test Custom Domain",
        "description": "Simple test to verify the custom domain is working",
        "operationId": "testCustomDomain",
        "x-openai-isConsequential": false,
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "test_message": {
                    "type": "string",
                    "description": "A test message"
                  }
                },
                "additionalProperties": false
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Test successful" }
        }
      }
    }
  },
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer"
      }
    }
  },
  "security": [
    {
      "bearerAuth": []
    }
  ]
}`;

const getTrackingSchema = (clientId: string, gptName: string, useCustomDomain = true) => `{
  "openapi": "3.1.0",
  "info": {
    "title": "${gptName}",
    "description": "Analytics and conversation tracking",
    "version": "1.0.0",
    "x-logo": {
      "url": "https://example.com/logo.png"
    }
  },
  "servers": [
    {
      "url": "${getApiUrl(useCustomDomain)}",
      "description": "${gptName}"
    }
  ],
  "x-origin": [
    {
      "url": "${gptName}",
      "format": "openapi",
      "version": "3.1.0"
    }
  ],
  "paths": {
    "/track-first-message": {
      "post": {
        "summary": "Log Initial Assistant Message",
        "description": "You MUST call this action ONLY for your very first message in a new conversation.",
        "operationId": "trackFirstMessage",
        "x-openai-isConsequential": false,
        "tags": ["${gptName}"],
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
    "/track-conversation-turn": {
      "post": {
        "summary": "Log Conversation Turn",
        "description": "You MUST call this action for ALL responses AFTER your first one.",
        "operationId": "trackConversationTurn",
        "x-openai-isConsequential": false,
        "tags": ["${gptName}"],
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
        "scheme": "bearer"
      }
    }
  },
  "security": [
    {
      "bearerAuth": []
    }
  ]
}`;

const systemPromptInstruction = `**Critical Analytics Instruction:** Your operation depends on logging every conversation turn using specific actions. You must follow these rules precisely.

**IMPORTANT: Error Handling & Debugging**
- If any tracking action fails, DO NOT let it break your response to the user
- Continue with your normal response even if tracking fails
- If you get an error, try to include the error details in your response for debugging
- The tracking is for analytics only and should not affect user experience

**IMPORTANT: User Session Tracking**
- You MUST maintain a unique user session ID throughout each conversation to distinguish between different users
- Store the user_session_id from the first response and reuse it for all subsequent messages in the same conversation

**Tracking Rules:**

1. **For Your VERY FIRST Message in a Chat:** You MUST call the \`trackFirstMessage\` action.
   - Provide your own introductory message in the \`assistant_response\`
   - The system will return a \`user_session_id\` - REMEMBER this ID for the entire conversation
   - If this action fails, continue with your response normally but mention "Debug: First message tracking failed"

2. **For ALL SUBSEQUENT Messages:** You MUST call the \`trackConversationTurn\` action.
   - You MUST provide the user's most recent message in the \`user_message\` field
   - You MUST provide your own response in the \`assistant_response\` field
   - You MUST include the \`user_session_id\` you received from the first message
   - If this action fails, continue with your response normally but mention "Debug: Conversation tracking failed"

**Session Management:**
- Each new conversation gets a new session ID
- Use the same session ID throughout the entire conversation
- This allows tracking of individual users even when multiple people use the GPT simultaneously

**Error Recovery:**
- If you lose the session ID, you can call trackFirstMessage again to get a new one
- Always prioritize helping the user over successful tracking
- If tracking consistently fails, include error details in your response for debugging

**Debug Mode:**
- If tracking fails, briefly mention it at the end of your response like: "Debug: Tracking error - [error details]"
- This helps identify issues without disrupting the user experience

This tracking is for analytics purposes and should never interfere with your primary function of helping users.`;

export default function GptSettingsTab({ gpt }: GptSettingsTabProps) {
  const { supabase } = useSupabase();
  const [copied, setCopied] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [debugResult, setDebugResult] = useState<any>(null);
  const [isDebugging, setIsDebugging] = useState(false);
  const [manualTestResult, setManualTestResult] = useState<any>(null);
  const [isManualTesting, setIsManualTesting] = useState(false);
  const [useCustomDomain, setUseCustomDomain] = useState(true);
  const [customDomainTest, setCustomDomainTest] = useState<any>(null);
  const [isTestingCustomDomain, setIsTestingCustomDomain] = useState(false);
  const [domainDiagnostics, setDomainDiagnostics] = useState<DiagnosticsResults | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Track reachability of custom domain
  const [customDomainOk, setCustomDomainOk] = useState<boolean | null>(null);

  const trackingSchema = getTrackingSchema(gpt.client_id, gpt.name, useCustomDomain);
  const testSchema = getTestSchema(gpt.name, useCustomDomain);

  useEffect(() => {
    // Probe the custom domain once when the settings tab loads - FIXED URL
    const probe = async () => {
      try {
        const res = await fetch("https://college-advisor.collegexpress.com/functions/v1/test-custom-domain", {
          method: 'POST',
          headers: {
            'Authorization': bearerToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ probe: true })
        });
        setCustomDomainOk(res.ok);
        if (res.ok) setUseCustomDomain(true);
      } catch {
        setCustomDomainOk(false);
      }
    };
    probe();
  }, []);

  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${type} to clipboard!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleTestCustomDomain = async () => {
    setIsTestingCustomDomain(true);
    setCustomDomainTest(null);

    try {
      // FIXED URLs - both now include /functions/v1
      const customDomainUrl = "https://college-advisor.collegexpress.com/functions/v1/track-first-message";
      const supabaseUrl = "https://qrhafhfqdjcrqsxnkaij.supabase.co/functions/v1/track-first-message";
      
      const testPayload = {
        client_id: gpt.client_id,
        assistant_response: "Test message from dashboard",
        user_session_id: "dashboard_test_" + Date.now()
      };

      // Test custom domain
      let customDomainResult: any;
      try {
        const customResponse = await fetch(customDomainUrl, {
          method: 'POST',
          headers: {
            'Authorization': bearerToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testPayload)
        });
        
        const customData = await customResponse.text();
        customDomainResult = {
          status: customResponse.status,
          statusText: customResponse.statusText,
          data: customData,
          success: customResponse.ok
        };
        setCustomDomainOk(customResponse.ok);
        toast[customResponse.ok ? 'success' : 'error'](
          customResponse.ok ? 'Custom domain is working perfectly!' : 'Custom domain test failed'
        );
      } catch (e) {
        customDomainResult = {
          error: e instanceof Error ? e.message : String(e),
          success: false
        };
        setCustomDomainOk(false);
        toast.error('Custom domain test failed');
      }

      // Test Supabase URL
      let supabaseResult: any;
      try {
        const supabaseResponse = await fetch(supabaseUrl, {
          method: 'POST',
          headers: {
            'Authorization': bearerToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testPayload)
        });
        
        const supabaseData = await supabaseResponse.text();
        supabaseResult = {
          status: supabaseResponse.status,
          statusText: supabaseResponse.statusText,
          data: supabaseData,
          success: supabaseResponse.ok
        };
      } catch (e) {
        supabaseResult = {
          error: e instanceof Error ? e.message : String(e),
          success: false
        };
      }

      setCustomDomainTest({
        customDomain: customDomainResult,
        supabase: supabaseResult,
        timestamp: new Date().toISOString()
      });

    } catch (e) {
      setCustomDomainTest({
        error: e instanceof Error ? e.message : String(e),
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsTestingCustomDomain(false);
    }
  };

  const handleDomainDiagnostics = async () => {
    setIsDiagnosing(true);
    setDomainDiagnostics(null);

    try {
      const customDomain = "college-advisor.collegexpress.com";
      const supabaseDomain = "qrhafhfqdjcrqsxnkaij.supabase.co";
      
      // Function names to test
      const functionNames = ['test-custom-domain', 'track-first-message', 'test-tracking'];

      const results: DiagnosticsResults = {
        customDomain: {},
        supabase: {},
        dnsInfo: {},
        recommendations: []
      };

      // Test each function on both domains with correct paths
      for (const fn of functionNames) {
        // FIXED: Both URLs now use /functions/v1
        const customUrl = `https://${customDomain}/functions/v1/${fn}`;
        const supabaseUrl = `https://${supabaseDomain}/functions/v1/${fn}`;
        
        // Test custom domain
        try {
          const customResponse = await fetch(customUrl, {
            method: 'POST',
            headers: {
              'Authorization': bearerToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ test: true })
          });
          
          results.customDomain[`/functions/v1/${fn}`] = {
            status: customResponse.status,
            statusText: customResponse.statusText,
            success: customResponse.ok,
            data: await customResponse.text()
          };
        } catch (e) {
          results.customDomain[`/functions/v1/${fn}`] = {
            error: e instanceof Error ? e.message : String(e),
            success: false
          };
        }

        // Test supabase domain
        try {
          const supabaseResponse = await fetch(supabaseUrl, {
            method: 'POST',
            headers: {
              'Authorization': bearerToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ test: true })
          });
          
          results.supabase[`/functions/v1/${fn}`] = {
            status: supabaseResponse.status,
            statusText: supabaseResponse.statusText,
            success: supabaseResponse.ok,
            data: await supabaseResponse.text()
          };
        } catch (e) {
          results.supabase[`/functions/v1/${fn}`] = {
            error: e instanceof Error ? e.message : String(e),
            success: false
          };
        }
      }

      // Recommendations
      const customDomainWorking = Object.values(results.customDomain).some((r) => r.success);
      const supabaseWorking = Object.values(results.supabase).some((r) => r.success);

      if (customDomainWorking) setCustomDomainOk(true);

      if (customDomainWorking && supabaseWorking) {
        results.recommendations.push("🎉 Both custom domain and Supabase URL are working perfectly!");
        results.recommendations.push("✅ You can now use your custom domain in your GPT schemas");
      } else if (!customDomainWorking && supabaseWorking) {
        results.recommendations.push("❌ Custom domain is not properly proxying to Supabase functions");
        results.recommendations.push("✅ Direct Supabase URL works perfectly");
        results.recommendations.push("🔧 Ensure your custom domain is configured for Edge Functions and reachable over HTTPS");
      } else if (customDomainWorking && !supabaseWorking) {
        results.recommendations.push("✅ Custom domain is working");
        results.recommendations.push("❌ Direct Supabase URL has issues (unusual)");
      }

      setDomainDiagnostics(results);

    } catch (e) {
      setDomainDiagnostics({
        customDomain: {},
        supabase: {},
        dnsInfo: {},
        recommendations: [],
        error: e instanceof Error ? e.message : String(e),
        timestamp: new Date().toISOString()
      } as any);
    } finally {
      setIsDiagnosing(false);
    }
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
        } catch {
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

  const handleManualTrackingTest = async () => {
    setIsManualTesting(true);
    setManualTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('track-first-message', {
        body: { 
          client_id: gpt.client_id,
          assistant_response: "This is a test first message from the dashboard",
          user_session_id: "dashboard_test_" + Date.now()
        }
      });

      if (error) {
        setManualTestResult({ success: false, error: error.message, data: null });
      } else {
        setManualTestResult({ success: true, error: null, data });
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setManualTestResult({ success: false, error: errorMessage, data: null });
    } finally {
      setIsManualTesting(false);
    }
  };

  const handleDebugData = async () => {
    setIsDebugging(true);
    setDebugResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('debug-gpt-data', {
        body: { gpt_id: gpt.id }
      });

      if (error) {
        setDebugResult({ error: error.message });
      } else {
        setDebugResult(data);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setDebugResult({ error: `Debug failed: ${errorMessage}` });
    } finally {
      setIsDebugging(false);
    }
  };

  const getCurlCommand = (platform: 'macos' | 'windows') => {
    const apiUrl = getApiUrl(useCustomDomain);
    const body = JSON.stringify({
      client_id: gpt.client_id,
      user_message: "This is a test user message.",
      assistant_response: "This is a test assistant response.",
      user_session_id: "user_test_session_123"
    });

    if (platform === 'windows') {
      const escapedBody = body.replace(/"/g, '`"');
      return `curl.exe -X POST "${apiUrl}/track-conversation-turn" -H "Authorization: ${bearerToken}" -H "Content-Type: application/json" -d "${escapedBody}"`;
    }

    return `curl -X POST '${apiUrl}/track-conversation-turn' \\
  -H 'Authorization: ${bearerToken}' \\
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
            <p className="text-xs text-gray-500 mt-1">Your GPT will need to include this in every tracking request body.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-500 border-2">
        <CardHeader>
          <CardTitle className="text-green-700 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Custom Domain Ready to Test
          </CardTitle>
          <CardDescription>
            Your domain is active in Supabase. Let's test the Edge Functions path.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={handleTestCustomDomain} disabled={isTestingCustomDomain}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {isTestingCustomDomain ? 'Testing Edge Functions...' : 'Test Custom Domain'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {customDomainTest && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="text-blue-600">Domain Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-sm">Custom Domain (college-advisor.collegexpress.com/functions/v1):</h4>
                <div className={`p-3 rounded-md text-xs ${customDomainTest.customDomain?.success ? 'bg-green-100' : 'bg-red-100'}`}>
                  <pre>{JSON.stringify(customDomainTest.customDomain, null, 2)}</pre>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-sm">Direct Supabase URL (for comparison):</h4>
                <div className={`p-3 rounded-md text-xs ${customDomainTest.supabase?.success ? 'bg-green-100' : 'bg-red-100'}`}>
                  <pre>{JSON.stringify(customDomainTest.supabase, null, 2)}</pre>
                </div>
              </div>
              
              {customDomainTest.customDomain?.success && (
                <div className="bg-green-100 p-3 rounded-md text-green-800">
                  <p className="font-bold">🎉 Success! Your custom domain with Edge Functions is working perfectly!</p>
                  <p className="text-sm mt-1">You can now use your custom domain in your GPT schemas.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Authorization Token</CardTitle>
          <CardDescription>This token authenticates your requests to the tracking service.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="auth-token">Token (includes "Bearer " prefix)</Label>
            <div className="flex items-center gap-2">
              <Input id="auth-token" value={bearerToken} readOnly className="font-mono text-xs"/>
              <Button variant="outline" size="icon" onClick={() => handleCopyToClipboard(bearerToken, 'Authorization Token')}>
                {copied === 'Authorization Token' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
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
              {useCustomDomain 
                ? 'Using your custom domain with the correct /functions/v1 path.'
                : 'Using the direct Supabase URL as a fallback.'
              }
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
            <Label htmlFor="custom-domain">Use custom domain in schema</Label>
          </div>
          <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-x-auto">
            <code>{getTrackingSchema(gpt.client_id, gpt.name, useCustomDomain)}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}