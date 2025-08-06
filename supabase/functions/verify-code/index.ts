import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@latest'
import { SignJWT } from 'npm:jose@5.6.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

serve(async (req) => {
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

    const { data: gpt, error: gptError } = await supabase
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

    const { email, code } = await req.json()
    if (!email || !code) {
      return new Response(JSON.stringify({ error: 'Email and code are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Verify the OTP using Supabase's built-in method
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email: email,
      token: code,
      type: 'email_otp', // Specify the type as 'email_otp'
    });

    if (verifyError || !verifyData.user) {
      console.error('OTP verification error:', verifyError);
      return new Response(JSON.stringify({ error: 'Invalid or expired code' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const userId = verifyData.user.id;

    // Generate JWT token
    const JWT_SECRET = new TextEncoder().encode(Deno.env.get('JWT_SECRET_FOR_OAUTH'));
    const token = await new SignJWT({ 
        sub: userId, 
        email: email,
        gpt_id: gpt.id,
        aud: 'authenticated', // Audience for Supabase
        iss: 'supabase', // Issuer for Supabase
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiry
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setJti(crypto.randomUUID()) // Unique JWT ID
      .sign(JWT_SECRET);

    return new Response(JSON.stringify({ access_token: token, token_type: 'Bearer', expires_in: 3600 }), {
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