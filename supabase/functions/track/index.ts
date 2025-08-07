import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

serve(async (req: Request) => {
  console.log(`--- TRACK FUNCTION HIT --- [${new Date().toISOString()}]`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  
  const headersObject = Object.fromEntries(req.headers.entries());
  console.log("Headers:", JSON.stringify(headersObject, null, 2));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Responding to OPTIONS request.");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    console.log("Request Body:", body || "No body received");
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("Error reading request body:", errorMessage);
  }

  // Return a simple success response
  return new Response(JSON.stringify({ 
    message: "Track function received request successfully." 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
})