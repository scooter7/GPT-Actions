import React, { useState } from 'react';

function Instructions({ gpt }) {
  const [copied, setCopied] = useState({
    apiKey: false,
    schema: false,
    instructions: false
  });

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(prev => ({ ...prev, [field]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [field]: false })), 2000);
  };

  const simplifiedSchema = `{
  "openapi": "3.1.0",
  "info": {
    "title": "GPTAuth Tracking - ${gpt?.name || 'Your GPT'}",
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
        "summary": "Log user and assistant messages",
        "description": "You MUST call this action for every user message to log the conversation.",
        "operationId": "LogMessages",
        "x-openai-isConsequential": false,
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
          "200": { "description": "Log successful" }
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
    },
    "schemas": {}
  },
  "security": [
    {
      "bearerAuth": []
    }
  ]
}`;

  const simplifiedInstructions = `For EVERY message you receive from the user, you MUST perform the following steps in order:

1.  **IMMEDIATELY** call the \`LogMessages\` action.
2.  Use these exact parameters for the action:
    -   \`user_email\`: "user@example.com" (We can make this dynamic later)
    -   \`user_message\`: The user's full, unmodified message.
    -   \`assistant_response\`: Your *previous* response to the user. For the very first message of the conversation, use an empty string \`""\`.
3.  After the action is successful, you can then generate and provide your actual response to the user.

**DO NOT** respond to the user until the \`LogMessages\` action has been completed. This is a critical step.`;

  if (!gpt) {
    return <div className="text-center py-8">Select a GPT to view instructions</div>;
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Simplified Tracking Instructions</h3>
      <p className="text-gray-600 mb-6">Follow these steps exactly in a **new, clean** Custom GPT to ensure tracking works.</p>
      
      <div className="space-y-6">
        <div>
          <h4 className="font-semibold mb-2">1. Configure Authentication</h4>
          <p className="text-gray-600 mb-2">
            In the GPT editor, go to the "Configure" tab, scroll down to "Actions", and click "Authentication".
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 bg-gray-50 p-4 rounded-md">
            <li>Select Authentication Type: <strong className="text-black">API Key</strong></li>
            <li>Paste your API Key below into the "API Key" field.</li>
            <li>Set Auth Type: <strong className="text-black">Bearer</strong></li>
          </ul>
          <div className="flex mt-3">
            <input
              type="text"
              value={gpt.client_id || "No API Key available"}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50"
            />
            <button
              onClick={() => copyToClipboard(gpt.client_id, 'apiKey')}
              className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
            >
              {copied.apiKey ? 'Copied!' : 'Copy Key'}
            </button>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">2. Add the Action</h4>
          <p className="text-gray-600 mb-2">
            Click "Add Action" and paste this simplified OpenAPI Schema.
          </p>
          <div className="relative">
            <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto max-h-60">
              {simplifiedSchema}
            </pre>
            <button
              onClick={() => copyToClipboard(simplifiedSchema, 'schema')}
              className="absolute top-2 right-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              {copied.schema ? 'Copied!' : 'Copy Schema'}
            </button>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">3. Set the GPT's Instructions</h4>
          <p className="text-gray-600 mb-2">
            Clear out any existing instructions and paste these exact instructions into your GPT's configuration.
          </p>
          <div className="relative">
            <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto max-h-60 whitespace-pre-wrap">
              {simplifiedInstructions}
            </pre>
            <button
              onClick={() => copyToClipboard(simplifiedInstructions, 'instructions')}
              className="absolute top-2 right-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              {copied.instructions ? 'Copied!' : 'Copy Instructions'}
            </button>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">4. Test It</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Save your GPT and start a new chat with it.</li>
            <li>Send it a message like "hello".</li>
            <li>Go to the "Analytics" tab in this dashboard and check if your "hello" message was logged.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default Instructions;