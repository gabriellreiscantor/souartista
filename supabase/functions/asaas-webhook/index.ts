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

  // 🔒 SECURITY: Validate webhook token from Asaas
  const webhookToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN');
  const receivedToken = req.headers.get('asaas-access-token');
  
  if (!webhookToken) {
    console.error('❌ ASAAS_WEBHOOK_TOKEN not configured');
    return new Response(
      JSON.stringify({ error: 'Webhook not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  if (!receivedToken || receivedToken !== webhookToken) {
    console.error('❌ Invalid webhook token received');
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log('✅ Webhook token validated successfully');
  console.log('🔔 Processing webhook request...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    
    // Validação de payload
    if (!payload || !payload.event) {
      console.error('❌ Invalid payload: missing event');
      return new Response(
        JSON.stringify({ error: 'Invalid payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('🔔 Asaas webhook payload received:');
    console.log('🔔 Event:', payload.event);
    console.log('🔔 Subscription ID:', payload.subscription?.id || 'N/A');
    console.log('🔔 Payment ID:', payload.payment?.id || 'N/A');
    console.log('🔔 Payment Subscription Ref:', payload.payment?.subscription || 'N/A');

    const event = payload.event;
    const payment = payload.payment;
    const subscription = payload.subscription;
    
    // Log defensivo
    if (!payment && !subscription) {
      console.warn('⚠️ Payload without payment or subscription object for event:', event);
    }

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

            console.log('✅ Subscription activated:', subscriptionId);
          }
        }
        break;
      }

      case 'PAYMENT_OVERDUE': {
        // ⚠️ IMPORTANTE: NÃO desativar status_plano imediatamente!
        // O usuário mantém acesso até next_due_date
        // A função check-expired-subscriptions cuida da desativação
        const subscriptionId = payment?.subscription;
        console.log('🔔 PAYMENT_OVERDUE - Looking for subscription ID:', subscriptionId);
        
        if (subscriptionId) {
          const { data: existingSubscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('asaas_subscription_id', subscriptionId)
            .maybeSingle();

          if (existingSubscription) {
            // Apenas marca como overdue, NÃO desativa o acesso
            await supabase
              .from('subscriptions')
              .update({
                status: 'overdue',
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingSubscription.id);

            // NÃO atualizar status_plano aqui!
            // O usuário mantém acesso até next_due_date

            // Enviar notificação de lembrete
            const notificationData = payment.billingType === 'CREDIT_CARD' 
              ? {
                  title: '⚠️ Problema com cartão de crédito',
                  message: 'Houve um problema ao processar seu cartão. Verifique seus dados de pagamento.',
                  link: '/artist/subscription',
                  user_id: existingSubscription.user_id,
                  created_by: existingSubscription.user_id,
                }
              : {
                  title: '⚠️ Pagamento pendente',
                  message: 'Seu pagamento PIX está pendente. Realize o pagamento para manter seu acesso.',
                  link: '/artist/subscription',
                  user_id: existingSubscription.user_id,
                  created_by: existingSubscription.user_id,
                };

            await supabase
              .from('notifications')
              .insert(notificationData);

            console.log('⚠️ Subscription marked as overdue (user keeps access):', subscriptionId);
          }
        }
        break;
      }

      case 'PAYMENT_DELETED': {
        // ⚠️ IMPORTANTE: PAYMENT_DELETED geralmente indica recriação de cobrança
        // NÃO desativar o usuário aqui!
        const subscriptionId = payment?.subscription;
        console.log('🔔 PAYMENT_DELETED - Subscription ID:', subscriptionId);
        console.log('ℹ️ PAYMENT_DELETED geralmente indica recriação de cobrança, não desativando usuário');
        
        // Apenas logar, não fazer nada que afete o acesso do usuário
        // A desativação será feita pela função check-expired-subscriptions se necessário
        break;
      }

      case 'SUBSCRIPTION_CREATED': {
        // Don't update next_due_date here - it was already saved correctly by create-asaas-subscription
        // This prevents date format bugs from Asaas webhook overwriting correct data
        console.log('📋 SUBSCRIPTION_CREATED event received:', subscription?.id);
        console.log('📅 Asaas sent nextDueDate:', subscription?.nextDueDate, '- NOT updating (already saved correctly)');
        break;
      }

      case 'SUBSCRIPTION_UPDATED': {
        if (subscription?.id) {
          console.log('📋 SUBSCRIPTION_UPDATED event - updating subscription');
          console.log('📅 Received nextDueDate from Asaas:', subscription.nextDueDate);
          
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

            console.log('✅ Subscription updated:', subscription.id);
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
