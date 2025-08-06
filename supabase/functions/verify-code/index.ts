import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2.43.0' // Changed to npm: specifier
import { SignJWT } from 'https://esm.sh/jose@5.6.3'

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

    const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }
    const userId = userData.user.id;

    // Verify the code
    const { data: authCode, error: authCodeError } = await supabase
      .from('oauth_auth_codes')
      .select('*')
      .eq('code', code)
      .eq('user_id', userId)
      .eq('client_id', gpt.id) // Match by gpt.id (client_id in oauth_auth_codes)
      .gte('expires_at', new Date().toISOString()) // Check if not expired
      .single();

    if (authCodeError || !authCode) {
      console.error('Auth code verification error:', authCodeError);
      return new Response(JSON.stringify({ error: 'Invalid or expired code' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Delete the used code
    const { error: deleteError } = await supabase
      .from('oauth_auth_codes')
      .delete()
      .eq('id', authCode.id);

    if (deleteError) {
      console.error('Error deleting used code:', deleteError);
      // Continue even if delete fails, as the main goal is to issue token
    }

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