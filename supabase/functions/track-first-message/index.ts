/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

// Generate a unique user session ID
function generateUserSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `user_${timestamp}_${randomPart}`;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { client_id, assistant_response, user_session_id } = await req.json()

    if (!client_id || !assistant_response) {
      return new Response(JSON.stringify({ error: "Missing 'client_id' or 'assistant_response'" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate user session ID if not provided
    const sessionId = user_session_id || generateUserSessionId();

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

    // First, try to find or create a gpt_user record for this session
    let gptUserId = null;
    
    // Check if we already have a user record for this session
    const { data: existingUser, error: userFindError } = await supabaseAdmin
      .from('gpt_users')
      .select('id')
      .eq('gpt_id', gptData.id)
      .eq('email', sessionId) // Using email field to store session ID for now
      .single()

    if (existingUser) {
      gptUserId = existingUser.id;
    } else {
      // Create new user record with session ID
      const { data: newUser, error: userCreateError } = await supabaseAdmin
        .from('gpt_users')
        .insert({
          gpt_id: gptData.id,
          email: sessionId, // Store session ID in email field temporarily
        })
        .select('id')
        .single()

      if (userCreateError) {
        console.error('Error creating user record:', userCreateError);
        // Continue without user tracking if this fails
      } else {
        gptUserId = newUser.id;
      }
    }

    const { error: logError } = await supabaseAdmin
      .from('gpt_logs')
      .insert({
        gpt_id: gptData.id,
        gpt_user_id: gptUserId,
        user_message: null,
        assistant_response: assistant_response,
      })

    if (logError) {
      return new Response(JSON.stringify({ error: 'Failed to save log' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ 
      message: 'Log saved successfully',
      user_session_id: sessionId 
    }), {
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