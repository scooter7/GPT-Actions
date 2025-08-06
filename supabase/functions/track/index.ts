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
      return new Response(JSON.stringify({ error: 'Authorization header with Bearer token is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }
    const apiKey = authHeader.substring(7) // Extract token after "Bearer "

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Find the GPT associated with the API key (now using client_id)
    const { data: gpt, error: gptError } = await supabaseAdmin
      .from('gpts')
      .select('id')
      .eq('client_id', apiKey) 
      .single()

    if (gptError || !gpt) {
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // Get the conversation data from the request body
    const { user_email, user_message, assistant_response } = await req.json()

    // Ensure user_message and assistant_response are strings, defaulting to empty string if null/undefined
    const safeUserMessage = user_message === null || user_message === undefined ? '' : String(user_message);
    const safeAssistantResponse = assistant_response === null || assistant_response === undefined ? '' : String(assistant_response);

    if (!user_email || !safeUserMessage || !safeAssistantResponse) {
        return new Response(JSON.stringify({ error: 'Missing required fields: user_email, user_message, assistant_response' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }

    // Find an existing user or create a new one for this GPT
    const { data: gptUser, error: userError } = await supabaseAdmin
      .from('gpt_users')
      .upsert({ gpt_id: gpt.id, email: user_email }, { onConflict: 'gpt_id,email' })
      .select('id')
      .single()

    if (userError || !gptUser) {
      console.error('Error upserting user:', userError)
      return new Response(JSON.stringify({ error: 'Failed to process user' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // Insert the new conversation log into the database
    const { error: logError } = await supabaseAdmin.from('gpt_logs').insert({
      gpt_id: gpt.id,
      gpt_user_id: gptUser.id,
      user_message: safeUserMessage,
      assistant_response: safeAssistantResponse,
    })

    if (logError) {
      console.error('Error inserting log:', logError)
      return new Response(JSON.stringify({ error: 'Failed to save log' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // Return a success response
    return new Response(JSON.stringify({ message: 'Log recorded successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Unhandled error:', error)
    return new Response(JSON.stringify({ error: 'An internal error occurred' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})