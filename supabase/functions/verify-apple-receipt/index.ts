import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REVENUECAT_API_KEY = Deno.env.get('REVENUECAT_API_KEY');
const REVENUECAT_API_URL = 'https://api.revenuecat.com/v1';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obter o usuário autenticado
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { appUserId, restore } = await req.json();
    const userId = appUserId || user.id;

    console.log('🍎 Verify Apple Receipt via RevenueCat - User:', userId, 'Restore:', restore);

    if (!REVENUECAT_API_KEY) {
      throw new Error('REVENUECAT_API_KEY not configured');
    }

    // Consultar RevenueCat API v1 para pegar status do subscriber
    const revenueCatResponse = await fetch(`${REVENUECAT_API_URL}/subscribers/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${REVENUECAT_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!revenueCatResponse.ok) {
      const errorText = await revenueCatResponse.text();
      console.error('❌ RevenueCat API error:', revenueCatResponse.status, errorText);
      throw new Error(`RevenueCat API error: ${revenueCatResponse.status}`);
    }

    const revenueCatData = await revenueCatResponse.json();
    console.log('📱 RevenueCat response:', JSON.stringify(revenueCatData, null, 2));

    const subscriber = revenueCatData.subscriber;
    
    if (!subscriber) {
      console.log('⚠️ No subscriber data found');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No subscription found',
          configured: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Verificar se tem algum entitlement ativo
    const entitlements = subscriber.entitlements || {};
    const hasActiveEntitlement = Object.values(entitlements).some(
      (entitlement: any) => entitlement.expires_date === null || new Date(entitlement.expires_date) > new Date()
    );

    console.log('🎫 Has active entitlement:', hasActiveEntitlement);

    if (!hasActiveEntitlement) {
      console.log('⚠️ No active entitlements found');
      
      // Atualizar status como expirado
      await supabaseClient
        .from('profiles')
        .update({
          status_plano: 'inactive',
        })
        .eq('id', user.id);

      return new Response(
        JSON.stringify({
          success: false,
          message: 'No active subscription',
          configured: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Pegar primeira assinatura ativa
    const subscriptions = subscriber.subscriptions || {};
    const activeSubscription = Object.entries(subscriptions).find(
      ([_, sub]: [string, any]) => sub.expires_date === null || new Date(sub.expires_date) > new Date()
    );

    if (!activeSubscription) {
      console.log('⚠️ No active subscription found in subscriptions list');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No active subscription details',
          configured: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const [productId, subscriptionDetails] = activeSubscription as [string, any];
    const expiresDate = subscriptionDetails.expires_date ? new Date(subscriptionDetails.expires_date) : null;
    const originalTransactionId = subscriptionDetails.original_purchase_date || subscriptionDetails.purchase_date;
    
    // Determinar tipo de plano baseado no product ID
    const planType = productId.toLowerCase().includes('annual') ? 'annual' : 'monthly';
    const amount = planType === 'annual' ? 319.00 : 29.90;

    console.log('💳 Subscription details:', {
      productId,
      planType,
      expiresDate: expiresDate?.toISOString(),
      originalTransactionId,
    });

    // Atualizar/criar subscription no banco
    const { error: subError } = await supabaseClient
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        apple_product_id: productId,
        apple_original_transaction_id: originalTransactionId,
        payment_platform: 'apple',
        status: 'active',
        next_due_date: expiresDate?.toISOString(),
        plan_type: planType,
        amount: amount,
      }, {
        onConflict: 'user_id',
      });

    if (subError) {
      console.error('❌ Error upserting subscription:', subError);
      throw new Error(`Database error: ${subError.message}`);
    }

    // Atualizar profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        status_plano: 'ativo',
        plan_type: planType,
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('❌ Error updating profile:', profileError);
      throw new Error(`Database error: ${profileError.message}`);
    }

    console.log('✅ Apple subscription verified and saved successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription verified successfully',
        configured: true,
        subscription: {
          productId,
          planType,
          expiresDate: expiresDate?.toISOString(),
          status: 'active',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error verifying Apple receipt:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error),
        success: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
