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
    const { gpt_id } = await req.json()

    if (!gpt_id) {
      return new Response(JSON.stringify({ error: "Missing 'gpt_id'" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get GPT info
    const { data: gptData, error: gptError } = await supabaseAdmin
      .from('gpts')
      .select('*')
      .eq('id', gpt_id)
      .single()

    // Get users for this GPT
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from('gpt_users')
      .select('*')
      .eq('gpt_id', gpt_id)

    // Get logs for this GPT
    const { data: logsData, error: logsError } = await supabaseAdmin
      .from('gpt_logs')
      .select(`
        id, 
        user_message, 
        assistant_response, 
        created_at, 
        gpt_user_id,
        gpt_users(session_id, email)
      `)
      .eq('gpt_id', gpt_id)
      .order('created_at', { ascending: false })
      .limit(10)

    return new Response(JSON.stringify({ 
      gpt: gptData,
      gpt_error: gptError,
      users: usersData,
      users_error: usersError,
      logs: logsData,
      logs_error: logsError,
      debug_info: {
        gpt_id,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e)
    return new Response(JSON.stringify({ error: `Debug error: ${errorMessage}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})