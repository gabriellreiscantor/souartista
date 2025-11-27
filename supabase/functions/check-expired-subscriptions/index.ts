import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔍 Checking for expired subscriptions...');

    // Find all cancelled subscriptions that have passed their next_due_date
    const { data: expiredSubscriptions, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('*, profiles!inner(id, name, email)')
      .eq('status', 'cancelled')
      .lt('next_due_date', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching expired subscriptions:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredSubscriptions?.length || 0} expired subscriptions`);

    let processedCount = 0;
    let errorCount = 0;

    for (const subscription of expiredSubscriptions || []) {
      try {
        // Update user profile to inactive
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ status_plano: 'inactive' })
          .eq('id', subscription.user_id);

        if (profileError) {
          console.error(`Error updating profile for user ${subscription.user_id}:`, profileError);
          errorCount++;
          continue;
        }

        // Create notification
        const { error: notificationError } = await supabaseAdmin
          .from('notifications')
          .insert({
            title: '⏰ Assinatura expirada',
            message: 'Sua assinatura expirou. Renove agora para continuar usando as funcionalidades premium.',
            link: '/artist/subscription',
            user_id: subscription.user_id,
            created_by: subscription.user_id,
          });

        if (notificationError) {
          console.error(`Error creating notification for user ${subscription.user_id}:`, notificationError);
          errorCount++;
          continue;
        }

        console.log(`✅ Processed expired subscription for user ${subscription.user_id}`);
        processedCount++;

      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Processed ${processedCount} expired subscriptions, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processedCount} expired subscriptions`,
        errors: errorCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in check-expired-subscriptions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
