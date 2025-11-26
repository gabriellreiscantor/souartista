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
      throw new Error('Autorização necessária');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    console.log('Checking payment status for user:', user.id);

    // Get user's subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError || !subscription) {
      throw new Error('Assinatura não encontrada');
    }

    if (!subscription.asaas_subscription_id) {
      throw new Error('ID da assinatura no Asaas não encontrado');
    }

    console.log('Checking Asaas subscription:', subscription.asaas_subscription_id);

    // Check payment status in Asaas
    const asaasResponse = await fetch(
      `https://api.asaas.com/v3/subscriptions/${subscription.asaas_subscription_id}/payments`,
      {
        headers: {
          'access_token': asaasApiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!asaasResponse.ok) {
      throw new Error('Erro ao consultar Asaas');
    }

    const asaasData = await asaasResponse.json();
    console.log('Asaas payments:', asaasData);

    // Check if there's any confirmed payment
    const confirmedPayment = asaasData.data?.find(
      (payment: any) => payment.status === 'CONFIRMED' || payment.status === 'RECEIVED'
    );

    if (confirmedPayment) {
      console.log('Found confirmed payment, updating subscription...');

      // Update subscription status
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          payment_method: confirmedPayment.billingType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      // Update user profile
      await supabase
        .from('profiles')
        .update({
          status_plano: 'ativo',
          plan_type: subscription.plan_type,
          plan_purchased_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      console.log('Subscription activated successfully');

      return new Response(
        JSON.stringify({ 
          success: true, 
          paid: true,
          message: 'Pagamento confirmado! Seu plano foi ativado.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('No confirmed payment found yet');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          paid: false,
          message: 'Pagamento ainda não confirmado. Tente novamente em alguns minutos.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in check-payment-status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
