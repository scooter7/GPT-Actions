import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@latest' // Using latest npm version

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // --- Detailed Debugging Logs ---
    console.log('SUPABASE_URL length:', Deno.env.get('SUPABASE_URL')?.length);
    console.log('SUPABASE_SERVICE_ROLE_KEY length:', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.length);
    console.log('Supabase client keys:', Object.keys(supabase));
    console.log('Supabase auth keys:', Object.keys(supabase.auth));
    console.log('Type of supabase.auth.admin:', typeof supabase.auth.admin);
    if (supabase.auth.admin) {
        console.log('Supabase auth admin keys:', Object.keys(supabase.auth.admin));
        console.log('Type of supabase.auth.admin.getUserByEmail:', typeof supabase.auth.admin.getUserByEmail);
    }
    // --- End Detailed Debugging Logs ---

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

    // Try to get the user by email, or create a new one if not found
    let user = null;
    const { data: existingUserData, error: getUserError } = await supabase.auth.admin.getUserByEmail(email);

    if (getUserError) {
      // If user not found, attempt to create a new user
      if (getUserError.status === 404) {
        console.log(`User with email ${email} not found, attempting to create.`);
        const { data: newUserData, error: createUserError } = await supabase.auth.admin.createUser({
          email: email,
          email_confirm: true, // Automatically confirm email for this flow
        });
        if (createUserError) {
          console.error('Error creating user:', createUserError);
          return new Response(JSON.stringify({ error: `Failed to create user: ${createUserError.message}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }
        user = newUserData.user;
      } else {
        // Log and return other errors encountered while trying to get the user
        console.error('Error getting user by email:', getUserError);
        return new Response(JSON.stringify({ error: `Failed to retrieve user: ${getUserError.message}` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
    } else {
      // User found, use the existing user data
      user = existingUserData.user;
      console.log(`User with email ${email} found.`);
    }

    // If user is still null after attempts, something went wrong
    if (!user) {
      console.error('User object is null after get/create attempts.');
      return new Response(JSON.stringify({ error: 'Could not find or create user' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // Code valid for 5 minutes

    // Store the code in the database
    const { error: insertError } = await supabase
      .from('oauth_auth_codes')
      .insert({
        code: code,
        user_id: user.id,
        client_id: gpt.id, // Use gpt.id as client_id for the oauth_auth_codes table
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error('Error inserting code:', insertError);
      return new Response(JSON.stringify({ error: `Failed to generate code: ${insertError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // In a real application, you would send this code via email here.
    // For this example, we'll just return it (for testing/debugging) or log it.
    console.log(`Generated code for ${email}: ${code}`);

    // Return a success response with the generated code (for testing)
    return new Response(JSON.stringify({ message: 'Verification code sent (simulated)', code: code }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // Catch any unhandled errors and return a generic internal error message
    console.error('Unhandled error in get-code:', error)
    return new Response(JSON.stringify({ error: 'An internal error occurred' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})