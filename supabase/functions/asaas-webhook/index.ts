import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🔔 ASAAS WEBHOOK CALLED - Method:', req.method, 'URL:', req.url);
  
  if (req.method === 'OPTIONS') {
    console.log('🔔 Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔔 Processing webhook request...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    console.log('🔔 Asaas webhook payload received:');
    console.log('🔔 Event:', payload.event);
    console.log('🔔 Subscription ID:', payload.subscription?.id);
    console.log('🔔 Payment ID:', payload.payment?.id);
    console.log('🔔 Full payload:', JSON.stringify(payload, null, 2));

    const event = payload.event;
    const payment = payload.payment;
    const subscription = payload.subscription;

    // Handle different webhook events
    switch (event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED': {
        // CORREÇÃO: Para eventos de pagamento, o ID da assinatura está em payment.subscription (string)
        const subscriptionId = payment?.subscription;
        console.log('🔔 Looking for subscription ID:', subscriptionId);
        
        if (subscriptionId) {
          const { data: existingSubscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('asaas_subscription_id', subscriptionId)
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

            // Create success notification (USER-SPECIFIC)
            await supabase
              .from('notifications')
              .insert({
                title: '✅ Pagamento confirmado!',
                message: 'Seu pagamento foi confirmado com sucesso. Obrigado por manter sua assinatura ativa!',
                link: '/artist/subscription',
                user_id: existingSubscription.user_id,
                created_by: existingSubscription.user_id,
              });

            console.log('Subscription activated:', subscription.id);
          }
        }
        break;
      }

      case 'PAYMENT_OVERDUE':
      case 'PAYMENT_DELETED': {
        // CORREÇÃO: Para eventos de pagamento, o ID da assinatura está em payment.subscription (string)
        const subscriptionId = payment?.subscription;
        console.log('🔔 Looking for subscription ID:', subscriptionId);
        
        if (subscriptionId) {
          const { data: existingSubscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('asaas_subscription_id', subscriptionId)
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

            // Create notification (USER-SPECIFIC - different for credit card vs PIX)
            const notificationData = payment.billingType === 'CREDIT_CARD' 
              ? {
                  title: '❌ Cartão de crédito recusado',
                  message: 'Não conseguimos processar seu cartão de crédito. Atualize seus dados de pagamento para não perder o acesso.',
                  link: '/artist/subscription',
                  user_id: existingSubscription.user_id,
                  created_by: existingSubscription.user_id,
                }
              : {
                  title: '❌ Pagamento vencido',
                  message: 'Seu pagamento PIX está vencido. Realize o pagamento para manter seu acesso.',
                  link: '/artist/subscription',
                  user_id: existingSubscription.user_id,
                  created_by: existingSubscription.user_id,
                };

            await supabase
              .from('notifications')
              .insert(notificationData);

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
          // Only update subscription status to 'cancelled'
          // DO NOT update status_plano immediately - user keeps access until next_due_date
          await supabase
            .from('subscriptions')
            .update({
              status: 'cancelled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingSubscription.id);

            // Notify user about cancellation (USER-SPECIFIC)
            const nextDueDate = existingSubscription.next_due_date 
              ? new Date(existingSubscription.next_due_date).toLocaleDateString('pt-BR')
              : 'a data de renovação';

            await supabase
              .from('notifications')
              .insert({
                title: 'ℹ️ Assinatura cancelada',
                message: `Sua assinatura foi cancelada. Você manterá acesso às funcionalidades premium até ${nextDueDate}.`,
                link: '/artist/subscription',
                user_id: existingSubscription.user_id,
                created_by: existingSubscription.user_id,
              });

            console.log('Subscription marked as canceled:', subscription.id);
            console.log('User will maintain access until next_due_date:', existingSubscription.next_due_date);
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
