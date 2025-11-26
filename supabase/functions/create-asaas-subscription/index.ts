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

    const { planType, paymentMethod } = await req.json();

    if (!planType || !['monthly', 'annual'].includes(planType)) {
      throw new Error('Invalid plan type');
    }

    if (!paymentMethod || !['PIX', 'CREDIT_CARD'].includes(paymentMethod)) {
      throw new Error('Invalid payment method. Use PIX or CREDIT_CARD');
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    // Plan prices (TEST PRICES - remember to change back later!)
    const prices = {
      monthly: 1.00,
      annual: 2.00
    };

    const amount = prices[planType as keyof typeof prices];

    // Create or get customer in Asaas
    let customerId = '';
    
    // Check if customer already exists
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('asaas_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingSubscription?.asaas_customer_id) {
      customerId = existingSubscription.asaas_customer_id;
    } else {
      // Create new customer
      const customerResponse = await fetch('https://api.asaas.com/v3/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey,
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          cpfCnpj: profile.cpf,
          phone: profile.phone,
        }),
      });

      if (!customerResponse.ok) {
        const errorData = await customerResponse.text();
        console.error('Asaas customer creation error:', errorData);
        throw new Error('Failed to create customer in Asaas');
      }

      const customerData = await customerResponse.json();
      customerId = customerData.id;
    }

    // Create subscription in Asaas
    const billingType = paymentMethod; // PIX or CREDIT_CARD
    const cycle = planType === 'monthly' ? 'MONTHLY' : 'YEARLY';
    
    const subscriptionResponse = await fetch('https://api.asaas.com/v3/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
      body: JSON.stringify({
        customer: customerId,
        billingType,
        cycle,
        value: amount,
        description: `Plano ${planType === 'monthly' ? 'Mensal' : 'Anual'} - SouArtista`,
      }),
    });

    if (!subscriptionResponse.ok) {
      const errorData = await subscriptionResponse.text();
      console.error('Asaas subscription creation error:', errorData);
      throw new Error('Failed to create subscription in Asaas');
    }

    const subscriptionData = await subscriptionResponse.json();

    // Save subscription in database
    const { error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        asaas_customer_id: customerId,
        asaas_subscription_id: subscriptionData.id,
        plan_type: planType,
        status: 'pending',
        amount,
        payment_method: billingType,
        next_due_date: subscriptionData.nextDueDate,
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error('Failed to save subscription');
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId: subscriptionData.id,
        paymentUrl: subscriptionData.invoiceUrl,
        billingType,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-asaas-subscription:', error);
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
