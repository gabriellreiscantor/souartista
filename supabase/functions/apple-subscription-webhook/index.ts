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

    const payload = await req.json();

    console.log('🍎 Apple S2S Notification received:', JSON.stringify(payload, null, 2));

    // TODO: Implementar processamento de Server-to-Server Notifications da Apple
    // Esta função receberá notificações da Apple sobre mudanças nas assinaturas
    
    // Tipos de notificações importantes:
    // - DID_RENEW: Assinatura renovada com sucesso
    // - DID_CHANGE_RENEWAL_STATUS: Status de renovação mudou
    // - DID_FAIL_TO_RENEW: Falha na renovação
    // - CANCEL: Assinatura cancelada
    // - REFUND: Reembolso processado
    // - REVOKE: Acesso revogado
    
    // Exemplo de estrutura para processar notificações:
    /*
    const { notification_type, unified_receipt } = payload;
    const latestReceiptInfo = unified_receipt?.latest_receipt_info?.[0];
    
    if (!latestReceiptInfo) {
      throw new Error('No receipt info found');
    }
    
    const originalTransactionId = latestReceiptInfo.original_transaction_id;
    
    // Buscar subscription no banco
    const { data: subscription } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('apple_original_transaction_id', originalTransactionId)
      .single();
    
    if (!subscription) {
      console.error('Subscription not found:', originalTransactionId);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Processar baseado no tipo de notificação
    switch (notification_type) {
      case 'DID_RENEW':
        await supabaseClient
          .from('subscriptions')
          .update({
            status: 'active',
            next_due_date: new Date(parseInt(latestReceiptInfo.expires_date_ms)),
          })
          .eq('id', subscription.id);
        
        await supabaseClient
          .from('profiles')
          .update({ status_plano: 'ativo' })
          .eq('id', subscription.user_id);
        break;
      
      case 'DID_FAIL_TO_RENEW':
      case 'CANCEL':
        await supabaseClient
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('id', subscription.id);
        
        await supabaseClient
          .from('profiles')
          .update({ status_plano: 'inactive' })
          .eq('id', subscription.user_id);
        break;
      
      case 'REFUND':
      case 'REVOKE':
        await supabaseClient
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('id', subscription.id);
        
        await supabaseClient
          .from('profiles')
          .update({ status_plano: 'inactive' })
          .eq('id', subscription.user_id);
        break;
      
      default:
        console.log('Unhandled notification type:', notification_type);
    }
    */

    console.log('⚠️ Apple S2S Notification processing not fully configured yet');
    console.log('📝 To complete setup:');
    console.log('1. Configure Server-to-Server Notification URL in App Store Connect');
    console.log('2. Add this endpoint to your Apple configuration:');
    console.log('   URL: https://wjutvzmnvemrplpwbkyf.supabase.co/functions/v1/apple-subscription-webhook');
    console.log('3. Uncomment and configure the notification processing code above');

    return new Response(
      JSON.stringify({ 
        received: true,
        configured: false,
        message: 'Webhook endpoint is ready but notification processing is not configured yet'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error processing Apple notification:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
