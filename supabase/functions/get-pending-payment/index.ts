import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with Service Role for privileged access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔍 Fetching pending payment for user:', user.id);

    // Buscar subscription do usuário
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError || !subscription) {
      console.log('No subscription found for user');
      return new Response(JSON.stringify({ pendingPayment: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!subscription.asaas_subscription_id) {
      console.log('Subscription has no Asaas ID');
      return new Response(JSON.stringify({ pendingPayment: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar payments da subscription no Asaas
    console.log('🔍 Fetching payments from Asaas for subscription:', subscription.asaas_subscription_id);
    
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    const paymentsResponse = await fetch(
      `https://www.asaas.com/api/v3/subscriptions/${subscription.asaas_subscription_id}/payments`,
      {
        headers: {
          'access_token': asaasApiKey!,
        },
      }
    );

    if (!paymentsResponse.ok) {
      console.error('Error fetching payments from Asaas:', await paymentsResponse.text());
      return new Response(JSON.stringify({ error: 'Failed to fetch payments' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paymentsData = await paymentsResponse.json();
    console.log('📦 Asaas payments:', paymentsData);

    // Filtrar por status PENDING ou OVERDUE e método PIX
    const pendingPayments = paymentsData.data?.filter((payment: any) => 
      (payment.status === 'PENDING' || payment.status === 'OVERDUE') && 
      payment.billingType === 'PIX'
    );

    if (!pendingPayments || pendingPayments.length === 0) {
      console.log('No pending PIX payments found');
      return new Response(JSON.stringify({ pendingPayment: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Pegar o primeiro pagamento pendente
    const pendingPayment = pendingPayments[0];
    console.log('💰 Found pending payment:', pendingPayment.id);

    // Buscar o QR Code do PIX
    const qrCodeResponse = await fetch(
      `https://www.asaas.com/api/v3/payments/${pendingPayment.id}/pixQrCode`,
      {
        headers: {
          'access_token': asaasApiKey!,
        },
      }
    );

    if (!qrCodeResponse.ok) {
      console.error('Error fetching QR code from Asaas:', await qrCodeResponse.text());
      return new Response(JSON.stringify({ error: 'Failed to fetch QR code' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const qrCodeData = await qrCodeResponse.json();
    console.log('✅ QR Code fetched successfully');

    return new Response(
      JSON.stringify({
        pendingPayment: {
          id: pendingPayment.id,
          value: pendingPayment.value,
          dueDate: pendingPayment.dueDate,
          status: pendingPayment.status,
          qrCode: qrCodeData.payload,
          encodedImage: qrCodeData.encodedImage,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in get-pending-payment function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
