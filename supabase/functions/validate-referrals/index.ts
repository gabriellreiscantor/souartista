import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge Function: validate-referrals
 * 
 * Esta função deve ser executada periodicamente (cron job diário) para:
 * 1. Validar indicações que passaram o período de quarentena (15 dias)
 * 2. Verificar se a assinatura do indicado ainda está ativa
 * 3. Conceder recompensas quando o indicador atinge 5 indicações validadas
 */

serve(async (req) => {
  console.log('🔄 VALIDATE-REFERRALS - Starting validation process');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    console.log('📅 Current time:', now.toISOString());

    // 1. Buscar indicações em awaiting_validation que passaram o período de quarentena
    const { data: pendingReferrals, error: fetchError } = await supabase
      .from('referrals')
      .select('*')
      .eq('status', 'awaiting_validation')
      .lt('validation_deadline', now.toISOString());

    if (fetchError) {
      console.error('❌ Error fetching pending referrals:', fetchError);
      throw fetchError;
    }

    console.log(`📋 Found ${pendingReferrals?.length || 0} referrals to validate`);

    const referrersToCheck = new Set<string>();

    // 2. Processar cada indicação
    for (const referral of pendingReferrals || []) {
      console.log(`\n🔍 Processing referral ${referral.id} for user ${referral.referred_id}`);

      // Verificar se a assinatura do indicado ainda está ativa
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', referral.referred_id)
        .maybeSingle();

      if (subError) {
        console.error(`❌ Error checking subscription for ${referral.referred_id}:`, subError);
        continue;
      }

      const isActive = subscription?.status === 'active';
      console.log(`📊 Subscription status: ${subscription?.status || 'not found'}, isActive: ${isActive}`);

      if (isActive) {
        // Marcar como validated
        const { error: updateError } = await supabase
          .from('referrals')
          .update({
            status: 'validated',
            validated_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('id', referral.id);

        if (updateError) {
          console.error(`❌ Error validating referral ${referral.id}:`, updateError);
        } else {
          console.log(`✅ Referral ${referral.id} validated successfully`);
          referrersToCheck.add(referral.referrer_id);
        }
      } else {
        // Marcar como cancelled (assinatura foi cancelada/expirou)
        const { error: cancelError } = await supabase
          .from('referrals')
          .update({
            status: 'cancelled',
            updated_at: now.toISOString(),
          })
          .eq('id', referral.id);

        if (cancelError) {
          console.error(`❌ Error cancelling referral ${referral.id}:`, cancelError);
        } else {
          console.log(`❌ Referral ${referral.id} cancelled (subscription not active)`);
        }
      }
    }

    // 3. Verificar e conceder recompensas para cada referrer que teve indicações validadas
    console.log(`\n🎁 Checking rewards for ${referrersToCheck.size} referrers`);

    for (const referrerId of referrersToCheck) {
      await checkAndGrantReward(supabase, referrerId);
    }

    console.log('\n✅ VALIDATE-REFERRALS - Process completed');

    return new Response(
      JSON.stringify({
        success: true,
        processed: pendingReferrals?.length || 0,
        referrersChecked: referrersToCheck.size,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in validate-referrals:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Verifica se o usuário tem 5 indicações validadas e concede a recompensa
 */
async function checkAndGrantReward(supabase: any, referrerId: string) {
  console.log(`\n🔍 Checking reward for referrer ${referrerId}`);

  // Contar APENAS indicações validated (não rewarded ainda)
  const { count, error: countError } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', referrerId)
    .eq('status', 'validated');

  if (countError) {
    console.error(`❌ Error counting validated referrals for ${referrerId}:`, countError);
    return;
  }

  console.log(`📊 Validated referrals count: ${count}`);

  if (!count || count < 5) {
    console.log(`⏳ Not enough validated referrals yet (${count}/5)`);
    return;
  }

  // Verificar se já ganhou esta recompensa
  const { data: existingReward, error: rewardCheckError } = await supabase
    .from('referral_rewards')
    .select('id')
    .eq('user_id', referrerId)
    .eq('referrals_count', 5)
    .maybeSingle();

  if (rewardCheckError) {
    console.error(`❌ Error checking existing reward for ${referrerId}:`, rewardCheckError);
    return;
  }

  if (existingReward) {
    console.log(`ℹ️ Reward already granted for ${referrerId}`);
    return;
  }

  // Buscar assinatura ativa do usuário
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', referrerId)
    .in('status', ['active', 'overdue'])
    .maybeSingle();

  if (subError) {
    console.error(`❌ Error fetching subscription for ${referrerId}:`, subError);
    return;
  }

  if (!subscription) {
    console.log(`⚠️ No active subscription found for ${referrerId} - cannot grant reward`);
    return;
  }

  // CÁLCULO SEGURO: Adicionar 30 dias à data atual ou next_due_date (o que for maior)
  const currentNextDue = subscription.next_due_date 
    ? new Date(subscription.next_due_date)
    : new Date();
  
  const baseDate = new Date(Math.max(currentNextDue.getTime(), Date.now()));
  const newNextDue = new Date(baseDate);
  newNextDue.setDate(newNextDue.getDate() + 30);

  console.log(`📅 Original next_due_date: ${subscription.next_due_date}`);
  console.log(`📅 New next_due_date: ${newNextDue.toISOString()}`);

  // Atualizar assinatura com nova data
  const { error: updateSubError } = await supabase
    .from('subscriptions')
    .update({
      next_due_date: newNextDue.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id);

  if (updateSubError) {
    console.error(`❌ Error updating subscription next_due_date for ${referrerId}:`, updateSubError);
    return;
  }

  // Registrar recompensa
  const { error: insertRewardError } = await supabase
    .from('referral_rewards')
    .insert({
      user_id: referrerId,
      referrals_count: 5,
      reward_type: 'free_month',
      days_added: 30,
      original_next_due_date: subscription.next_due_date,
    });

  if (insertRewardError) {
    console.error(`❌ Error inserting reward record for ${referrerId}:`, insertRewardError);
    return;
  }

  // Marcar as 5 indicações validadas como rewarded
  const { error: updateRefsError } = await supabase
    .from('referrals')
    .update({ status: 'rewarded', updated_at: new Date().toISOString() })
    .eq('referrer_id', referrerId)
    .eq('status', 'validated')
    .limit(5);

  if (updateRefsError) {
    console.error(`❌ Error updating referrals to rewarded for ${referrerId}:`, updateRefsError);
  }

  // Notificar o usuário
  const { error: notifError } = await supabase
    .from('notifications')
    .insert({
      user_id: referrerId,
      title: '🎉 Parabéns! Você ganhou 1 mês grátis!',
      message: 'Suas 5 indicações foram validadas. Seu próximo pagamento foi adiado em 30 dias!',
      link: '/artist/subscription',
      created_by: referrerId,
    });

  if (notifError) {
    console.error(`❌ Error creating notification for ${referrerId}:`, notifError);
  }

  console.log(`🎁 REWARD GRANTED to ${referrerId}! Next due date extended by 30 days.`);
}
