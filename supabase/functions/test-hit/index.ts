import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("--- ✅✅✅ TEST-HIT FUNCTION WAS CALLED SUCCESSFULLY ✅✅✅ ---");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  const headersObject = Object.fromEntries(req.headers.entries());
  console.log("Request Headers:", JSON.stringify(headersObject, null, 2));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request for test-hit");
    return new Response(null, { headers: corsHeaders })
  }

  // Return a simple success response
  return new Response(JSON.stringify({ 
    message: 'SUCCESS: The test-hit function was reached!',
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
})