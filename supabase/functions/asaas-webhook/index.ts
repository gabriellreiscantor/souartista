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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    console.log('Asaas webhook received:', JSON.stringify(payload, null, 2));

    const event = payload.event;
    const payment = payload.payment;
    const subscription = payload.subscription;

    // Handle different webhook events
    switch (event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED': {
        // Update subscription status to active
        if (subscription?.id) {
          const { data: existingSubscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('asaas_subscription_id', subscription.id)
            .maybeSingle();

          if (existingSubscription) {
            await supabase
              .from('subscriptions')
              .update({
                status: 'active',
                payment_method: payment.billingType,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingSubscription.id);

            // Update user profile
            await supabase
              .from('profiles')
              .update({
                status_plano: 'ativo',
                plan_type: existingSubscription.plan_type,
                plan_purchased_at: new Date().toISOString(),
              })
              .eq('id', existingSubscription.user_id);

            console.log('Subscription activated:', subscription.id);
          }
        }
        break;
      }

      case 'PAYMENT_OVERDUE':
      case 'PAYMENT_DELETED': {
        // Update subscription status
        if (subscription?.id) {
          const { data: existingSubscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('asaas_subscription_id', subscription.id)
            .maybeSingle();

          if (existingSubscription) {
            await supabase
              .from('subscriptions')
              .update({
                status: 'expired',
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingSubscription.id);

            // Update user profile
            await supabase
              .from('profiles')
              .update({
                status_plano: 'inactive',
              })
              .eq('id', existingSubscription.user_id);

            console.log('Subscription expired:', subscription.id);
          }
        }
        break;
      }

      case 'SUBSCRIPTION_CREATED':
      case 'SUBSCRIPTION_UPDATED': {
        if (subscription?.id) {
          const { data: existingSubscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('asaas_subscription_id', subscription.id)
            .maybeSingle();

          if (existingSubscription) {
            await supabase
              .from('subscriptions')
              .update({
                next_due_date: subscription.nextDueDate,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingSubscription.id);

            console.log('Subscription updated:', subscription.id);
          }
        }
        break;
      }

      case 'SUBSCRIPTION_DELETED':
      case 'SUBSCRIPTION_INACTIVATED': {
        if (subscription?.id) {
          const { data: existingSubscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('asaas_subscription_id', subscription.id)
            .maybeSingle();

          if (existingSubscription) {
            await supabase
              .from('subscriptions')
              .update({
                status: 'cancelled',
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingSubscription.id);

            // Update user profile
            await supabase
              .from('profiles')
              .update({
                status_plano: 'inactive',
              })
              .eq('id', existingSubscription.user_id);

            console.log('Subscription cancelled:', subscription.id);
          }
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in asaas-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
