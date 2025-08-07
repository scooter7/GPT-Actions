import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Get Supabase credentials from environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key to bypass RLS
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get API Key (client_id) from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const apiKey = authHeader.split(' ')[1]

    // Find the gpt_id associated with the API key
    const { data: gptData, error: gptError } = await supabaseAdmin
      .from('gpts')
      .select('id')
      .eq('client_id', apiKey)
      .single()

    if (gptError || !gptData) {
      console.error('Error finding GPT or GPT not found:', gptError?.message)
      return new Response(JSON.stringify({ error: 'Invalid API Key' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const gptId = gptData.id

    // Parse the conversation data from the request body
    const { user_message, assistant_response } = await req.json()
    if (!user_message || !assistant_response) {
        return new Response(JSON.stringify({ error: 'Missing user_message or assistant_response in body' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    // Insert the conversation log into the database
    const { error: logError } = await supabaseAdmin
      .from('gpt_logs')
      .insert({
        gpt_id: gptId,
        user_message: user_message,
        assistant_response: assistant_response,
      })

    if (logError) {
      console.error('Error inserting log:', logError.message)
      return new Response(JSON.stringify({ error: 'Failed to save log' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Return a success response
    return new Response(JSON.stringify({ message: 'Log saved successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e)
    console.error('Unhandled error in track function:', errorMessage)
    return new Response(JSON.stringify({ error: 'An internal error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})