'use client';

const CodeBlock = ({ children }) => {
  return (
    <div className="bg-[#0d1117] border border-gray-700 rounded-lg my-4 relative">
      <pre className="p-4 pr-12 text-sm text-gray-300 overflow-x-auto">
        <code>{children}</code>
      </pre>
    </div>
  );
};

const ConnectivityTest = () => {
  const schema = `{
  "openapi": "3.1.0",
  "info": {
    "title": "Connectivity Test API",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://qrhafhfqdjcrqsxnkaij.supabase.co/functions/v1"
    }
  ],
  "paths": {
    "/test-hit": {
      "get": {
        "summary": "Test API Connectivity",
        "operationId": "testConnectivity",
        "responses": {
          "200": { "description": "OK" }
        }
      }
    }
  }
}`;

  const instructions = `Your only job is to test connectivity. When the user says anything, you MUST call the 'testConnectivity' action.

After calling it, tell the user "Action called." Do not say anything else.`;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Connectivity Test</h2>
      <div className="space-y-8 text-gray-300 max-w-4xl">
        <div className="bg-red-900/30 border border-red-700 p-4 rounded-lg">
          <h3 className="font-semibold text-red-400 mb-2">IMPORTANT DEBUGGING STEP</h3>
          <p>This test is designed to see if your GPT can reach your Supabase functions at all. Please follow these steps exactly.</p>
        </div>
        
        <div>
          <h3 className="font-semibold text-white mb-2">1. Create a NEW Test GPT</h3>
          <p className="text-gray-400 mb-2">Go to chat.openai.com and create a brand new, blank GPT for this test.</p>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-2">2. Add this OpenAPI Schema</h3>
          <p className="text-gray-400 mb-2">In your new test GPT, create a new action and paste this schema. **Do NOT add any authentication.**</p>
          <CodeBlock>{schema}</CodeBlock>
        </div>
        
        <div>
          <h3 className="font-semibold text-white mb-2">3. Use these Instructions</h3>
          <p className="text-gray-400 mb-2">Paste these exact instructions into your test GPT's configuration.</p>
          <CodeBlock>{instructions}</CodeBlock>
        </div>
        
        <div>
          <h3 className="font-semibold text-white mb-2">4. Run the Test</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Save your test GPT.</li>
            <li>Send it any message, like "ping".</li>
            <li>The GPT should respond with "Action called."</li>
            <li>Check the logs for the `test-hit` function in your Supabase dashboard.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ConnectivityTest;