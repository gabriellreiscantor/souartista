import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ========================================
// CONFIGURAÇÃO DO NEGÓCIO - ALTERAR AQUI
// ========================================
const BUSINESS_CONFIG = {
  name: 'SouArtista',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Schema de validação para dados do cartão de crédito
const creditCardSchema = z.object({
  holderName: z.string()
    .min(3, "Nome do titular muito curto")
    .max(100, "Nome do titular muito longo")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras"),
  number: z.string()
    .transform(val => val.replace(/\s/g, ''))
    .refine(val => /^\d{13,19}$/.test(val), "Número do cartão inválido"),
  expiryMonth: z.string()
    .regex(/^(0[1-9]|1[0-2])$/, "Mês de validade inválido"),
  expiryYear: z.string()
    .regex(/^20\d{2}$/, "Ano de validade inválido"),
  ccv: z.string()
    .regex(/^\d{3,4}$/, "CVV inválido"),
  holderCpf: z.string()
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => /^\d{11}$/.test(val), "CPF inválido"),
  postalCode: z.string()
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => /^\d{8}$/.test(val), "CEP inválido"),
});

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

    const { planType, paymentMethod, creditCardData } = await req.json();

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

    // Plan prices (Production prices - same as iOS/UI)
    const prices = {
      monthly: 29.90,
      annual: 300.00
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
      // Clean CPF - remove all non-digit characters
      const cleanCpf = profile.cpf ? profile.cpf.replace(/\D/g, '') : '';
      
      if (!cleanCpf || cleanCpf.length !== 11) {
        console.error('Invalid CPF format:', profile.cpf, '-> cleaned:', cleanCpf);
        throw new Error('CPF inválido. Por favor, atualize seu perfil com um CPF válido.');
      }

      console.log('Creating Asaas customer with cleaned CPF:', cleanCpf.substring(0, 3) + '***');
      
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
          cpfCnpj: cleanCpf,
          phone: profile.phone ? profile.phone.replace(/\D/g, '') : undefined,
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
    
    // Verificar se usuário foi indicado (para trial estendido)
    const { data: referralData } = await supabase
      .from('referrals')
      .select('id, extended_trial_granted')
      .eq('referred_id', user.id)
      .maybeSingle();

    const wasReferred = !!referralData && !referralData.extended_trial_granted;
    const trialDays = wasReferred ? 14 : 7; // 14 dias para indicados, 7 padrão
    console.log(`🎁 User trial: ${trialDays} days (was referred: ${wasReferred})`);
    
    // Calculate next due date - trial para cartão, imediato para PIX
    const today = new Date();
    let nextDueDate: string;

    if (billingType === 'CREDIT_CARD') {
      // Trial dinâmico baseado em indicação
      const trialEndDate = new Date(today);
      trialEndDate.setDate(trialEndDate.getDate() + trialDays);
      nextDueDate = trialEndDate.toISOString().split('T')[0];
    } else {
      // PIX: cobrança imediata (hoje)
      nextDueDate = today.toISOString().split('T')[0];
    }
    
    const subscriptionPayload: any = {
      customer: customerId,
      billingType,
      cycle,
      value: amount,
      nextDueDate,
      description: `Plano ${planType === 'monthly' ? 'Mensal' : 'Anual'} - ${BUSINESS_CONFIG.name}`,
    };

    // Para cartão de crédito, validar e adicionar dados do cartão
    if (billingType === 'CREDIT_CARD') {
      if (!creditCardData) {
        throw new Error('Dados do cartão de crédito são obrigatórios');
      }

      // Validação Zod dos dados do cartão
      const validation = creditCardSchema.safeParse(creditCardData);
      if (!validation.success) {
        const errorMessage = validation.error.errors[0]?.message || 'Dados do cartão inválidos';
        console.error('Credit card validation failed:', validation.error.errors);
        throw new Error(errorMessage);
      }

      const validatedCard = validation.data;

      subscriptionPayload.creditCard = {
        holderName: validatedCard.holderName,
        number: validatedCard.number,
        expiryMonth: validatedCard.expiryMonth,
        expiryYear: validatedCard.expiryYear,
        ccv: validatedCard.ccv,
      };
      
      subscriptionPayload.creditCardHolderInfo = {
        name: validatedCard.holderName,
        email: profile.email,
        phone: profile.phone,
        cpfCnpj: validatedCard.holderCpf,
        postalCode: validatedCard.postalCode,
        addressNumber: '0',
      };

      console.log('✅ Credit card data validated successfully');
    }
    
    const subscriptionResponse = await fetch('https://api.asaas.com/v3/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
      body: JSON.stringify(subscriptionPayload),
    });

    if (!subscriptionResponse.ok) {
      const errorData = await subscriptionResponse.text();
      console.error('Asaas subscription creation error:', errorData);
      throw new Error('Failed to create subscription in Asaas');
    }

    const subscriptionData = await subscriptionResponse.json();
    console.log('Subscription created:', subscriptionData);

    // Get payments for this subscription
    const paymentsResponse = await fetch(`https://api.asaas.com/v3/subscriptions/${subscriptionData.id}/payments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
    });

    if (!paymentsResponse.ok) {
      const errorData = await paymentsResponse.text();
      console.error('Failed to fetch payments:', errorData);
      throw new Error('Failed to fetch subscription payments');
    }

    const paymentsData = await paymentsResponse.json();
    console.log('Payments data:', paymentsData);

    const firstPayment = paymentsData.data?.[0];
    if (!firstPayment) {
      console.error('No payment found for subscription');
      throw new Error('No payment found for subscription');
    }

    let paymentInfo: any = {
      paymentId: firstPayment.id,
      billingType,
    };

    // For PIX, get QR Code
    if (billingType === 'PIX') {
      const pixResponse = await fetch(`https://api.asaas.com/v3/payments/${firstPayment.id}/pixQrCode`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey,
        },
      });

      if (!pixResponse.ok) {
        const errorData = await pixResponse.text();
        console.error('Failed to fetch PIX QR Code:', errorData);
        throw new Error('Failed to fetch PIX QR Code');
      }

      const pixData = await pixResponse.json();
      console.log('PIX QR Code obtained successfully');
      
      paymentInfo.pixQrCode = pixData.payload;
      paymentInfo.pixQrCodeImage = pixData.encodedImage;
    } else {
      // For credit card, use invoice URL
      paymentInfo.invoiceUrl = firstPayment.invoiceUrl;
    }

    // Save subscription in database
    // Calculate next_due_date to save in database
    let nextDueDateToSave: string;
    if (billingType === 'CREDIT_CARD') {
      // Trial dinâmico baseado em indicação
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + trialDays);
      // Formato YYYY-MM-DD manual para evitar problemas de timezone
      const year = trialEnd.getFullYear();
      const month = String(trialEnd.getMonth() + 1).padStart(2, '0');
      const day = String(trialEnd.getDate()).padStart(2, '0');
      nextDueDateToSave = `${year}-${month}-${day}`;
    } else {
      // PIX: usar a data retornada pelo Asaas
      nextDueDateToSave = subscriptionData.nextDueDate;
    }

    // Marcar trial estendido como concedido para o indicado
    if (wasReferred && referralData && billingType === 'CREDIT_CARD') {
      const { error: updateRefError } = await supabase
        .from('referrals')
        .update({ extended_trial_granted: true })
        .eq('id', referralData.id);

      if (updateRefError) {
        console.error('⚠️ Error marking extended trial as granted:', updateRefError);
      } else {
        console.log('✅ Extended trial (14 days) granted to referred user');
      }
    }

    // Use upsert to handle existing subscriptions (user may be renewing)
    const { error: upsertError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        asaas_customer_id: customerId,
        asaas_subscription_id: subscriptionData.id,
        plan_type: planType,
        status: billingType === 'CREDIT_CARD' ? 'active' : 'pending',
        amount,
        payment_method: billingType,
        payment_platform: 'asaas',
        next_due_date: nextDueDateToSave,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (upsertError) {
      console.error('Database upsert error:', upsertError);
      throw new Error('Failed to save subscription');
    }
    
    console.log('✅ Subscription saved/updated in database');

    // For credit card, grant immediate access (trial period)
    if (billingType === 'CREDIT_CARD') {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          status_plano: 'ativo',
          plan_type: planType,
          plan_purchased_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile for trial access:', profileError);
      } else {
        console.log('✅ Trial access granted immediately for credit card user');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId: subscriptionData.id,
        nextDueDate: billingType === 'CREDIT_CARD' ? nextDueDateToSave : subscriptionData.nextDueDate,
        ...paymentInfo,
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
