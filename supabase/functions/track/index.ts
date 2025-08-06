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
    console.log("Track function called with method:", req.method);
    console.log("Request headers:", JSON.stringify(Object.fromEntries(req.headers.entries())));
    
    // Create a Supabase client with the service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log("Supabase URL available:", !!supabaseUrl);
    console.log("Supabase Service Key available:", !!supabaseServiceKey);
    
    const supabaseAdmin = createClient(
      supabaseUrl!,
      supabaseServiceKey!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Authenticate the request using the API key from the Authorization header
    const authHeader = req.headers.get('Authorization');
    console.log("Authorization header:", authHeader ? `${authHeader.substring(0, 15)}...` : "null");
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error("Missing or invalid Authorization header");
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

    // Find the GPT associated with the API key (client_id)
    console.log("Looking up GPT with client_id:", apiKey.substring(0, 8) + "...");
    const { data: gpt, error: gptError } = await supabaseAdmin
      .from('gpts')
      .select('id, name')
      .eq('client_id', apiKey) 
      .single()

    if (gptError) {
      console.error("GPT lookup error:", gptError.message);
      return new Response(JSON.stringify({ error: `Invalid API key: ${gptError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    if (!gpt) {
      console.error("No GPT found with the provided API key");
      return new Response(JSON.stringify({ error: 'No GPT found with the provided API key' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    console.log("Found GPT:", gpt.name, "with ID:", gpt.id);

    // Get the conversation data from the request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request body:", JSON.stringify(requestBody));
    } catch (e) {
      console.error("Error parsing request body:", e);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    
    const { user_email, user_message, assistant_response } = requestBody;

    console.log("Extracted fields from request:");
    console.log("- user_email:", user_email);
    console.log("- user_message:", user_message ? (user_message.length > 50 ? user_message.substring(0, 50) + "..." : user_message) : null);
    console.log("- assistant_response:", assistant_response ? (assistant_response.length > 50 ? assistant_response.substring(0, 50) + "..." : assistant_response) : null);

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
    console.log("Looking up or creating user for GPT:", gpt.id, "and email:", user_email);
    const { data: gptUser, error: userError } = await supabaseAdmin
      .from('gpt_users')
      .upsert({ gpt_id: gpt.id, email: user_email }, { onConflict: 'gpt_id,email' })
      .select('id')
      .single()

    if (userError) {
      console.error('Error upserting user:', userError.message, userError.details);
      return new Response(JSON.stringify({ error: `Failed to process user: ${userError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    if (!gptUser) {
      console.error('No user returned after upsert');
      return new Response(JSON.stringify({ error: 'Failed to process user: No user returned' }), {
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
    
    console.log("Inserting log data:", JSON.stringify({
      gpt_id: logData.gpt_id,
      gpt_user_id: logData.gpt_user_id,
      user_message: logData.user_message.length > 50 ? logData.user_message.substring(0, 50) + "..." : logData.user_message,
      assistant_response: logData.assistant_response.length > 50 ? logData.assistant_response.substring(0, 50) + "..." : logData.assistant_response,
    }));

    // Insert the new conversation log into the database
    const { data: insertedLog, error: logError } = await supabaseAdmin
      .from('gpt_logs')
      .insert(logData)
      .select()
      .single();

    if (logError) {
      console.error('Error inserting log:', logError.message, logError.details);
      return new Response(JSON.stringify({ error: `Failed to save log: ${logError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    if (!insertedLog) {
      console.error('No log returned after insert');
      return new Response(JSON.stringify({ error: 'Failed to save log: No log returned' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    console.log("Log inserted successfully with ID:", insertedLog.id);

    // Return a success response
    return new Response(JSON.stringify({ 
      message: 'Log recorded successfully',
      log_id: insertedLog.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Unhandled error in track function:', error);
    return new Response(JSON.stringify({ error: `An internal error occurred: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})