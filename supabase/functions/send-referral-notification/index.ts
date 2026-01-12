import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPushToUser } from "../_shared/fcm-sender.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReferralNotificationRequest {
  type: 'new_signup' | 'validated' | 'reward';
  referrerId: string;
  referredName?: string;
  currentProgress?: number;
  cycleNumber?: number;
}

serve(async (req) => {
  console.log('🔔 SEND-REFERRAL-NOTIFICATION - Starting');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, referrerId, referredName, currentProgress, cycleNumber } = await req.json() as ReferralNotificationRequest;

    console.log(`📋 Notification type: ${type}, referrerId: ${referrerId}`);

    let title = '';
    let body = '';
    let link = '/artist/subscription';

    switch (type) {
      case 'new_signup':
        title = '🎉 Nova indicação!';
        body = referredName 
          ? `${referredName} se cadastrou usando seu código!`
          : 'Alguém se cadastrou usando seu código de indicação!';
        break;

      case 'validated':
        if (currentProgress !== undefined) {
          const remaining = 5 - currentProgress;
          if (remaining > 0) {
            title = '✅ Indicação validada!';
            body = remaining === 1
              ? 'Falta apenas 1 indicação para ganhar 1 mês grátis!'
              : `Faltam ${remaining} indicações para ganhar 1 mês grátis!`;
          } else {
            title = '🎁 Você atingiu a meta!';
            body = 'Aguarde a recompensa ser processada!';
          }
        }
        break;

      case 'reward':
        title = '🎁 Parabéns! Você ganhou 1 mês grátis!';
        body = cycleNumber
          ? `Este é seu ${cycleNumber}º mês grátis por indicações! Seu próximo pagamento foi adiado em 30 dias.`
          : 'Suas indicações foram validadas. Seu próximo pagamento foi adiado em 30 dias!';
        break;

      default:
        console.error('❌ Unknown notification type:', type);
        return new Response(
          JSON.stringify({ error: 'Unknown notification type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Send push notification
    const result = await sendPushToUser({
      supabaseAdmin: supabase,
      userId: referrerId,
      title,
      body,
      link,
      source: 'referral' as any,
    });

    console.log(`✅ Push notification sent: ${result.sent} sent, ${result.failed} failed`);

    // Also create in-app notification for new_signup
    if (type === 'new_signup') {
      await supabase
        .from('notifications')
        .insert({
          user_id: referrerId,
          title,
          message: body,
          link,
          created_by: referrerId,
        });
      console.log('✅ In-app notification created');
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in send-referral-notification:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
