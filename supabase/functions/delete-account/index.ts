import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    console.log('Deleting account for user:', user.id)

    // Delete all user data in order (respecting foreign keys)
    // Delete locomotion expenses
    await supabaseClient
      .from('locomotion_expenses')
      .delete()
      .eq('uid', user.id)

    // Delete shows
    await supabaseClient
      .from('shows')
      .delete()
      .eq('uid', user.id)

    // Delete musicians
    await supabaseClient
      .from('musicians')
      .delete()
      .eq('owner_uid', user.id)

    // Delete artists
    await supabaseClient
      .from('artists')
      .delete()
      .eq('owner_uid', user.id)

    // Delete venues
    await supabaseClient
      .from('venues')
      .delete()
      .eq('owner_uid', user.id)

    // Delete support responses
    await supabaseClient
      .from('support_responses')
      .delete()
      .eq('user_id', user.id)

    // Delete support tickets
    await supabaseClient
      .from('support_tickets')
      .delete()
      .eq('user_id', user.id)

    // Delete user roles
    await supabaseClient
      .from('user_roles')
      .delete()
      .eq('user_id', user.id)

    // Delete profile
    await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', user.id)

    // Delete auth user (this must be last)
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(user.id)

    if (deleteError) {
      throw deleteError
    }

    console.log('Account deleted successfully for user:', user.id)

    return new Response(
      JSON.stringify({ message: 'Account deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error deleting account:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
