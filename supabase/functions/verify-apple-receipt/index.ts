import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { productId, transactionId, restore } = await req.json();

    console.log('🍎 Verify Apple Receipt - User:', user.id, 'Product:', productId);

    // TODO: Implementar validação real com Apple App Store Server API
    // Por enquanto, este é um placeholder que será implementado quando
    // você configurar os certificados e secrets da Apple
    
    // Para implementar validação real:
    // 1. Obter o receipt da Apple
    // 2. Validar com Apple's App Store Server API
    // 3. Verificar se o receipt é válido e ativo
    // 4. Atualizar banco de dados com status da assinatura

    // Exemplo de estrutura para validação real:
    /*
    const appleSharedSecret = Deno.env.get('APPLE_SHARED_SECRET');
    const verifyUrl = 'https://buy.itunes.apple.com/verifyReceipt'; // Sandbox
    // const verifyUrl = 'https://buy.itunes.apple.com/verifyReceipt'; // Production
    
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'receipt-data': receiptData,
        'password': appleSharedSecret,
      }),
    });
    
    const verifyResult = await verifyResponse.json();
    
    if (verifyResult.status === 0) {
      // Receipt válido
      const latestReceiptInfo = verifyResult.latest_receipt_info[0];
      const expiresDate = new Date(parseInt(latestReceiptInfo.expires_date_ms));
      
      // Atualizar subscription no banco
      await supabaseClient
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          apple_product_id: productId,
          apple_original_transaction_id: transactionId,
          payment_platform: 'apple',
          status: 'active',
          next_due_date: expiresDate,
          plan_type: productId.includes('annual') ? 'annual' : 'monthly',
          amount: productId.includes('annual') ? 11.99 : 5.99,
        });
      
      // Atualizar profile
      await supabaseClient
        .from('profiles')
        .update({
          status_plano: 'ativo',
          plan_type: productId.includes('annual') ? 'annual' : 'monthly',
        })
        .eq('id', user.id);
    }
    */

    console.log('⚠️ Apple IAP validation not fully configured yet');
    console.log('📝 To complete setup:');
    console.log('1. Configure Apple Developer Account and create products');
    console.log('2. Add APPLE_SHARED_SECRET to Supabase secrets');
    console.log('3. Uncomment and configure the validation code above');

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Apple In-App Purchase validation is not configured yet. Please configure Apple Developer Account and RevenueCat first.',
        configured: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error verifying Apple receipt:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
