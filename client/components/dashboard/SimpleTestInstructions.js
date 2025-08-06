'use client';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

const CodeBlock = ({ children }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(children).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="bg-[#0d1117] border border-gray-700 rounded-lg my-4 relative">
      <pre className="p-4 pr-12 text-sm text-gray-300 overflow-x-auto">
        <code>{children}</code>
      </pre>
      <button onClick={copyToClipboard} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white">
        {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
      </button>
    </div>
  );
};

const SimpleTestInstructions = ({ selectedGPT }) => {
  // Use client_id as the API key
  const apiKey = selectedGPT?.client_id || "No API Key available. Please select a GPT.";
  
  const simpleSchema = `{
  "openapi": "3.1.0",
  "info": {
    "title": "Simple Test API",
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
        "summary": "Log messages",
        "operationId": "LogMessages",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "user_email": { "type": "string" },
                  "user_message": { "type": "string" },
                  "assistant_response": { "type": "string" }
                },
                "required": ["user_email", "user_message", "assistant_response"]
              }
            }
          }
        },
        "responses": {
          "200": { "description": "OK" }
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

  const simpleInstructions = `You are a simple test assistant. Your ONLY job is to log every message exchange.

IMPORTANT: For EVERY user message, you MUST call the LogMessages action with these parameters:
- user_email: "test@example.com"
- user_message: The exact message the user just sent
- assistant_response: Your previous response (use empty string "" for the first message)

After calling LogMessages, respond with: "Message logged successfully. Your message was: [user's message]"

DO NOT skip the LogMessages call for ANY message. This is critical for testing.`;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Simple Test Instructions {selectedGPT && <span className="text-blue-400">({selectedGPT.name})</span>}</h2>
      <div className="space-y-8 text-gray-300 max-w-4xl">
        <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-400 mb-2">Testing Mode</h3>
          <p>These are simplified instructions to test if your track function is working correctly. Create a new test GPT with just these components.</p>
        </div>
        
        <div>
          <h3 className="font-semibold text-white mb-2">1. API Key Setup</h3>
          <p className="text-gray-400 mb-2">In the GPT editor, under "Actions", click "Authentication", select "API Key", set the auth type to "Bearer", and enter this key:</p>
          <CodeBlock>{apiKey}</CodeBlock>
        </div>
        
        <div>
          <h3 className="font-semibold text-white mb-2">2. Simple Schema</h3>
          <p className="text-gray-400 mb-2">Create a new action and paste this simplified schema:</p>
          <CodeBlock>{simpleSchema}</CodeBlock>
        </div>
        
        <div>
          <h3 className="font-semibold text-white mb-2">3. Simple Instructions</h3>
          <p className="text-gray-400 mb-2">Use these instructions for your test GPT:</p>
          <CodeBlock>{simpleInstructions}</CodeBlock>
        </div>
        
        <div>
          <h3 className="font-semibold text-white mb-2">4. Testing Steps</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Create a new GPT with the above components</li>
            <li>Start a conversation with your test GPT</li>
            <li>Send a few simple messages</li>
            <li>Check the Analytics tab to see if logs appear</li>
            <li>Check the Supabase logs for any errors</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default SimpleTestInstructions;