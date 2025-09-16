/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { client_id, user_message, assistant_response, user_session_id } = await req.json()

    if (!client_id || !user_message || !assistant_response || !user_session_id) {
      return new Response(JSON.stringify({ error: "Missing 'client_id', 'user_message', 'assistant_response', or 'user_session_id'" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: gptData, error: gptError } = await supabaseAdmin
      .from('gpts')
      .select('id')
      .eq('client_id', client_id)
      .single()

    if (gptError || !gptData) {
      return new Response(JSON.stringify({ error: 'Invalid client_id' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Find the user record for this session
    let gptUserId = null;
    const { data: existingUser, error: userFindError } = await supabaseAdmin
      .from('gpt_users')
      .select('id')
      .eq('gpt_id', gptData.id)
      .eq('email', user_session_id) // Using email field to store session ID
      .single()

    if (existingUser) {
      gptUserId = existingUser.id;
    } else {
      // Create user record if it doesn't exist (fallback)
      const { data: newUser, error: userCreateError } = await supabaseAdmin
        .from('gpt_users')
        .insert({
          gpt_id: gptData.id,
          email: user_session_id,
        })
        .select('id')
        .single()

      if (userCreateError) {
        console.error('Error creating user record:', userCreateError);
      } else {
        gptUserId = newUser.id;
      }
    }

    const { error: logError } = await supabaseAdmin
      .from('gpt_logs')
      .insert({
        gpt_id: gptData.id,
        gpt_user_id: gptUserId,
        user_message: user_message,
        assistant_response: assistant_response,
      })

    if (logError) {
      return new Response(JSON.stringify({ error: 'Failed to save log' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ message: 'Log saved successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e)
    return new Response(JSON.stringify({ error: `An internal error occurred: ${errorMessage}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})