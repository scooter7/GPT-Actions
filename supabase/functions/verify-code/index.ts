import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
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

    // Find the GPT associated with the API key (client_id)
    const { data: gpt, error: gptError } = await supabase
      .from('gpts')
      .select('id')
      .eq('client_id', apiKey) 
      .single()

    if (gptError || !gpt) {
      console.error('GPT lookup error:', gptError);
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // Get the email and code from the request body
    const { email, code } = await req.json()
    if (!email || !code) {
      return new Response(JSON.stringify({ error: 'Email and code are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Log the received email and code for debugging
    console.log('Received email for verification:', email);
    console.log('Received code for verification:', code);

    // Verify the OTP using Supabase's built-in method
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email: email,
      token: code,
      type: 'email',
    });

    if (verifyError) {
      console.error('OTP verification error:', verifyError);
      return new Response(JSON.stringify({ error: 'Invalid or expired code' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // If verification was successful, find or create a user for this GPT
    const { data: gptUser, error: userError } = await supabase
      .from('gpt_users')
      .upsert({ gpt_id: gpt.id, email: email }, { onConflict: 'gpt_id,email' })
      .select('id')
      .single()

    if (userError) {
      console.error('Error upserting user:', userError);
      return new Response(JSON.stringify({ error: 'Failed to process user' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Generate a simple access token (in a real app, you'd use JWT)
    const accessToken = crypto.randomUUID();

    return new Response(JSON.stringify({ 
      access_token: accessToken, 
      token_type: 'Bearer', 
      expires_in: 3600,
      user_id: gptUser.id,
      email: email
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Unhandled error in verify-code:', error);
    return new Response(JSON.stringify({ error: 'An internal error occurred' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})