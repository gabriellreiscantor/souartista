import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      throw new Error('Subscription ID is required');
    }

    // Cancel subscription in Asaas
    const cancelResponse = await fetch(`https://api.asaas.com/v3/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
    });

    if (!cancelResponse.ok) {
      const errorData = await cancelResponse.text();
      console.error('Asaas cancellation error:', errorData);
      throw new Error('Failed to cancel subscription in Asaas');
    }

    const cancelData = await cancelResponse.json();
    console.log('Subscription canceled:', cancelData);

    // Update subscription status in database
    // NOTE: We only mark as 'canceled' but keep status_plano as 'ativo'
    // User will continue to have access until next_due_date
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('asaas_subscription_id', subscriptionId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error('Failed to update subscription status');
    }

    // DO NOT update profile status_plano yet - user keeps access until next_due_date
    // The status_plano will be updated to 'inactive' when next_due_date passes

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription canceled successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cancel-subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
