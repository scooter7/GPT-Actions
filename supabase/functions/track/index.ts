import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Get Supabase credentials from environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key to bypass RLS
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Parse the data from the request body
    const { client_id, user_message, assistant_response } = await req.json()

    if (!client_id) {
      return new Response(JSON.stringify({ error: "Missing 'client_id' in request body" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    if (!assistant_response) {
        return new Response(JSON.stringify({ error: 'Missing assistant_response in body' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    // Find the gpt_id associated with the client_id
    const { data: gptData, error: gptError } = await supabaseAdmin
      .from('gpts')
      .select('id')
      .eq('client_id', client_id)
      .single()

    if (gptError || !gptData) {
      console.error('Error finding GPT or GPT not found for client_id:', client_id, gptError?.message)
      return new Response(JSON.stringify({ error: 'Invalid client_id' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const gptId = gptData.id

    // Insert the conversation log into the database
    const { error: logError } = await supabaseAdmin
      .from('gpt_logs')
      .insert({
        gpt_id: gptId,
        user_message: user_message || null,
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