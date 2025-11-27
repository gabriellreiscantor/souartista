import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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

    console.log('Iniciando sincronização de pagamentos Asaas...');

    // Buscar todas as subscriptions ativas ou pendentes
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*, profiles!inner(*)')
      .in('status', ['active', 'pending']);

    if (subsError) {
      console.error('Erro ao buscar subscriptions:', subsError);
      throw subsError;
    }

    console.log(`Encontradas ${subscriptions?.length || 0} subscriptions para verificar`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const subscription of subscriptions || []) {
      try {
        if (!subscription.asaas_subscription_id) {
          console.log(`Subscription ${subscription.id} sem asaas_subscription_id, pulando...`);
          continue;
        }

        // Buscar pagamentos da subscription no Asaas
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
          console.error(`Erro ao buscar pagamentos da subscription ${subscription.id}:`, asaasResponse.status);
          errorCount++;
          continue;
        }

        const asaasData = await asaasResponse.json();
        console.log(`Subscription ${subscription.id}: ${asaasData.data?.length || 0} pagamentos encontrados`);

        // Verificar se há algum pagamento confirmado
        const confirmedPayment = asaasData.data?.find((payment: any) => 
          payment.status === 'CONFIRMED' || payment.status === 'RECEIVED'
        );

        if (confirmedPayment) {
          console.log(`Pagamento confirmado encontrado para subscription ${subscription.id}`);

          // Atualizar subscription para ativo
          const { error: updateSubError } = await supabase
            .from('subscriptions')
            .update({ 
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.id);

          if (updateSubError) {
            console.error(`Erro ao atualizar subscription ${subscription.id}:`, updateSubError);
            errorCount++;
            continue;
          }

          // Atualizar profile para ativo
          const { error: updateProfileError } = await supabase
            .from('profiles')
            .update({ 
              status_plano: 'ativo',
              plan_purchased_at: confirmedPayment.paymentDate || new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.user_id);

          if (updateProfileError) {
            console.error(`Erro ao atualizar profile ${subscription.user_id}:`, updateProfileError);
            errorCount++;
            continue;
          }

          // Registrar no payment_history se ainda não existe
          const { data: existingPayment } = await supabase
            .from('payment_history')
            .select('id')
            .eq('asaas_payment_id', confirmedPayment.id)
            .single();

          if (!existingPayment) {
            await supabase
              .from('payment_history')
              .insert({
                user_id: subscription.user_id,
                subscription_id: subscription.id,
                asaas_payment_id: confirmedPayment.id,
                amount: confirmedPayment.value,
                status: confirmedPayment.status,
                payment_method: confirmedPayment.billingType,
                payment_date: confirmedPayment.paymentDate || new Date().toISOString(),
                due_date: confirmedPayment.dueDate,
              });
          }

          syncedCount++;
          console.log(`Subscription ${subscription.id} sincronizada com sucesso`);
        } else {
          console.log(`Nenhum pagamento confirmado para subscription ${subscription.id}`);
        }
      } catch (error) {
        console.error(`Erro ao processar subscription ${subscription.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Sincronização concluída: ${syncedCount} atualizadas, ${errorCount} erros`);

    return new Response(
      JSON.stringify({ 
        success: true,
        synced: syncedCount,
        errors: errorCount,
        total: subscriptions?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na sincronização:', error);
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
