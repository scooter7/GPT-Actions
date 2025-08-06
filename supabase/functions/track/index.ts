import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// Define CORS headers to allow requests from any origin
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("--- TRACK FUNCTION INVOCATION ---");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Method:", req.method);
    console.log("URL:", req.url);
    
    const headersObject = Object.fromEntries(req.headers.entries());
    console.log("Request Headers:", JSON.stringify(headersObject, null, 2));
    
    // Create a Supabase client with the service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Supabase environment variables are not set!");
        return new Response(JSON.stringify({ error: 'Server configuration error' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Authenticate the request using the API key from the Authorization header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error("Missing or invalid Authorization header. Header value:", authHeader);
      return new Response(JSON.stringify({ error: 'Authorization header with Bearer token is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }
    const apiKey = authHeader.substring(7) // Extract token after "Bearer "

    if (!apiKey) {
      console.error("API key is empty after extracting from Bearer token.");
      return new Response(JSON.stringify({ error: 'API key is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    console.log("API Key received (first 8 chars):", apiKey.substring(0, 8) + "...");

    // Find the GPT associated with the API key (client_id)
    const { data: gpt, error: gptError } = await supabaseAdmin
      .from('gpts')
      .select('id, name')
      .eq('client_id', apiKey) 
      .single()

    if (gptError || !gpt) {
      console.error("GPT lookup failed. Error:", gptError?.message || "No GPT found.");
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    console.log("Successfully found GPT:", gpt.name, "with ID:", gpt.id);

    // Get the conversation data from the request body
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log("Raw request body:", bodyText);
      requestBody = JSON.parse(bodyText);
    } catch (e) {
      console.error("Error parsing request body:", e);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    
    const { user_email, user_message, assistant_response } = requestBody;

    if (!user_email) {
      console.error("Missing user_email in request body.");
      return new Response(JSON.stringify({ error: 'Missing required field: user_email' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    console.log("Processing log for user:", user_email);

    // Find an existing user or create a new one for this GPT
    const { data: gptUser, error: userError } = await supabaseAdmin
      .from('gpt_users')
      .upsert({ gpt_id: gpt.id, email: user_email }, { onConflict: 'gpt_id,email' })
      .select('id')
      .single()

    if (userError) {
      console.error('Error upserting user:', userError.message);
      return new Response(JSON.stringify({ error: `Failed to process user: ${userError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    console.log("User found/created with ID:", gptUser.id);

    // Insert the new conversation log into the database
    const { data: insertedLog, error: logError } = await supabaseAdmin
      .from('gpt_logs')
      .insert({
        gpt_id: gpt.id,
        gpt_user_id: gptUser.id,
        user_message: user_message || '',
        assistant_response: assistant_response || '',
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Error inserting log:', logError.message);
      return new Response(JSON.stringify({ error: `Failed to save log: ${logError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    console.log("Log inserted successfully with ID:", insertedLog.id);
    console.log("--- TRACK FUNCTION END ---");

    // Return a success response
    return new Response(JSON.stringify({ 
      message: 'Log recorded successfully',
      log_id: insertedLog.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('--- UNHANDLED ERROR IN TRACK FUNCTION ---');
    console.error(error);
    return new Response(JSON.stringify({ error: `An internal error occurred: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})