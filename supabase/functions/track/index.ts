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
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("Track function called");
    
    // Create a Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Authenticate the request using the API key from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error("Missing or invalid Authorization header:", authHeader);
      return new Response(JSON.stringify({ error: 'Authorization header with Bearer token is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }
    const apiKey = authHeader.substring(7) // Extract token after "Bearer "

    if (!apiKey) {
      console.error("Empty API key");
      return new Response(JSON.stringify({ error: 'API key is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    console.log("API Key received:", apiKey.substring(0, 8) + "...");

    // Find the GPT associated with the API key (now using client_id)
    const { data: gpt, error: gptError } = await supabaseAdmin
      .from('gpts')
      .select('id')
      .eq('client_id', apiKey) 
      .single()

    if (gptError || !gpt) {
      console.error("GPT lookup error:", gptError);
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    console.log("Found GPT with ID:", gpt.id);

    // Get the conversation data from the request body
    const requestBody = await req.json();
    console.log("Request body:", JSON.stringify(requestBody));
    
    const { user_email, user_message, assistant_response } = requestBody;

    // Ensure user_message and assistant_response are strings, defaulting to empty string if null/undefined
    const safeUserMessage = user_message === null || user_message === undefined ? '' : String(user_message);
    const safeAssistantResponse = assistant_response === null || assistant_response === undefined ? '' : String(assistant_response);

    if (!user_email) {
      console.error("Missing user_email in request");
      return new Response(JSON.stringify({ error: 'Missing required field: user_email' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    console.log("Processing log for user email:", user_email);

    // Find an existing user or create a new one for this GPT
    const { data: gptUser, error: userError } = await supabaseAdmin
      .from('gpt_users')
      .upsert({ gpt_id: gpt.id, email: user_email }, { onConflict: 'gpt_id,email' })
      .select('id')
      .single()

    if (userError || !gptUser) {
      console.error('Error upserting user:', userError);
      return new Response(JSON.stringify({ error: 'Failed to process user' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    console.log("User found/created with ID:", gptUser.id);

    // Prepare log data
    const logData = {
      gpt_id: gpt.id,
      gpt_user_id: gptUser.id,
      user_message: safeUserMessage,
      assistant_response: safeAssistantResponse,
    };
    
    console.log("Inserting log data:", JSON.stringify(logData));

    // Insert the new conversation log into the database
    const { data: insertedLog, error: logError } = await supabaseAdmin
      .from('gpt_logs')
      .insert(logData)
      .select()
      .single();

    if (logError) {
      console.error('Error inserting log:', logError);
      return new Response(JSON.stringify({ error: 'Failed to save log' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    console.log("Log inserted successfully with ID:", insertedLog?.id);

    // Return a success response
    return new Response(JSON.stringify({ 
      message: 'Log recorded successfully',
      log_id: insertedLog?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Unhandled error in track function:', error);
    return new Response(JSON.stringify({ error: 'An internal error occurred' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})