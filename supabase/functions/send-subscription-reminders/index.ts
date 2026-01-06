import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPushToUser } from '../_shared/fcm-sender.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔔 Checking for subscriptions approaching expiration...');

    // Buscar assinaturas canceladas que ainda não expiraram
    const { data: subscriptions, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('*, profiles!inner(id, name, email)')
      .eq('status', 'cancelled')
      .gt('next_due_date', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${subscriptions?.length || 0} cancelled subscriptions to check`);

    let remindersSent = 0;
    let errorCount = 0;

    for (const subscription of subscriptions || []) {
      try {
        const now = new Date();
        const nextDueDate = new Date(subscription.next_due_date);
        const daysUntilExpiration = Math.ceil((nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        console.log(`Subscription ${subscription.id}: ${daysUntilExpiration} days until expiration`);

        // Determinar qual lembrete enviar baseado nos dias restantes
        let reminderType: string | null = null;
        let title: string = '';
        let message: string = '';

        if (daysUntilExpiration === 7) {
          reminderType = '7_days';
          title = '⏳ Sua assinatura termina em 7 dias';
          message = 'Sua assinatura está chegando ao fim. Renove agora para continuar aproveitando todas as funcionalidades premium!';
        } else if (daysUntilExpiration === 5) {
          reminderType = '5_days';
          title = '⚠️ Restam apenas 5 dias de acesso';
          message = 'Não perca suas funcionalidades! Sua assinatura expira em breve. Renove já para manter tudo funcionando.';
        } else if (daysUntilExpiration === 3) {
          reminderType = '3_days';
          title = '🚨 Apenas 3 dias restantes!';
          message = 'Sua assinatura está quase expirando! Renove agora para não perder o acesso às suas apresentações e relatórios.';
        } else if (daysUntilExpiration === 1) {
          reminderType = '1_day';
          title = '🔴 ÚLTIMO DIA!';
          message = 'Sua assinatura expira amanhã! Não deixe para depois, renove agora mesmo para manter seu acesso.';
        }

        // Se não é um dos marcos de lembretes, pular
        if (!reminderType) {
          continue;
        }

        // Verificar se já enviamos este lembrete
        const { data: existingReminder } = await supabaseAdmin
          .from('subscription_reminder_logs')
          .select('id')
          .eq('subscription_id', subscription.id)
          .eq('reminder_type', reminderType)
          .maybeSingle();

        if (existingReminder) {
          console.log(`Reminder ${reminderType} already sent for subscription ${subscription.id}`);
          continue;
        }

        // Criar notificação no banco
        const { error: notificationError } = await supabaseAdmin
          .from('notifications')
          .insert({
            title,
            message,
            link: '/artist/subscription',
            user_id: subscription.user_id,
            created_by: subscription.user_id,
          });

        if (notificationError) {
          console.error(`Error creating notification for user ${subscription.user_id}:`, notificationError);
          errorCount++;
          continue;
        }

        // Enviar push notification diretamente via FCM (não via functions.invoke)
        try {
          const pushResult = await sendPushToUser({
            supabaseAdmin,
            userId: subscription.user_id,
            title,
            body: message,
            link: '/artist/subscription',
            data: { type: 'subscription_reminder' },
            source: 'subscription',
          });
          console.log(`📱 Push result for ${subscription.user_id}: sent=${pushResult.sent}, failed=${pushResult.failed}`);
        } catch (pushError) {
          console.error('Error sending push notification:', pushError);
          // Não falhar se push notification falhar
        }

        // Registrar lembrete enviado
        const { error: logError } = await supabaseAdmin
          .from('subscription_reminder_logs')
          .insert({
            subscription_id: subscription.id,
            user_id: subscription.user_id,
            reminder_type: reminderType,
          });

        if (logError) {
          console.error(`Error logging reminder for subscription ${subscription.id}:`, logError);
          errorCount++;
          continue;
        }

        console.log(`✅ Sent ${reminderType} reminder for subscription ${subscription.id}`);
        remindersSent++;

      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Sent ${remindersSent} reminders, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${remindersSent} subscription reminders`,
        errors: errorCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in send-subscription-reminders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
