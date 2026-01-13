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

    console.log('Starting cleanup of deleted users...')

    // Find users that should be permanently deleted (30 days passed)
    const { data: expiredUsers, error: fetchError } = await supabaseClient
      .from('deleted_users')
      .select('id, name, email, original_user_id, scheduled_permanent_delete_at')
      .eq('status', 'pending_deletion')
      .lte('scheduled_permanent_delete_at', new Date().toISOString())

    if (fetchError) {
      console.error('Error fetching expired users:', fetchError)
      throw fetchError
    }

    if (!expiredUsers || expiredUsers.length === 0) {
      console.log('No expired users to clean up')
      return new Response(
        JSON.stringify({ 
          message: 'No expired users to clean up',
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${expiredUsers.length} users to permanently delete`)

    let successCount = 0
    let errorCount = 0

    for (const user of expiredUsers) {
      try {
        // Mark as permanently deleted
        const { error: updateError } = await supabaseClient
          .from('deleted_users')
          .update({
            status: 'permanently_deleted',
            permanently_deleted_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (updateError) {
          console.error(`Error marking user ${user.id} as permanently deleted:`, updateError)
          errorCount++
        } else {
          console.log(`User ${user.email} (${user.id}) permanently deleted`)
          successCount++
        }
      } catch (err) {
        console.error(`Error processing user ${user.id}:`, err)
        errorCount++
      }
    }

    // Optional: Clean up very old records (90 days after permanent deletion)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { error: cleanupError } = await supabaseClient
      .from('deleted_users')
      .delete()
      .eq('status', 'permanently_deleted')
      .lte('permanently_deleted_at', ninetyDaysAgo.toISOString())

    if (cleanupError) {
      console.error('Error cleaning up old records:', cleanupError)
    }

    console.log(`Cleanup completed: ${successCount} success, ${errorCount} errors`)

    return new Response(
      JSON.stringify({ 
        message: 'Cleanup completed',
        processed: expiredUsers.length,
        success: successCount,
        errors: errorCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in cleanup:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
