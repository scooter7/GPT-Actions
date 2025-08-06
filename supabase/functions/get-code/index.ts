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

    // Get the email from the request body
    const { email } = await req.json()
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Use Supabase's signInWithOtp to send a 6-digit OTP
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (otpError) {
      console.error('Error sending OTP:', otpError);
      return new Response(JSON.stringify({ error: `Failed to send OTP: ${otpError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log(`Supabase OTP sent to ${email}.`);

    // Return a success response
    return new Response(JSON.stringify({ message: 'OTP sent successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Unhandled error in get-code:', error);
    return new Response(JSON.stringify({ error: 'An internal error occurred' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})