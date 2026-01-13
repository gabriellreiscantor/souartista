import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge function para sincronizar assinaturas Apple com RevenueCat
 * Consulta a API do RevenueCat para cada assinante e atualiza next_due_date correto
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const revenueCatApiKey = Deno.env.get('REVENUECAT_API_KEY');
    
    if (!revenueCatApiKey) {
      console.error('❌ REVENUECAT_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'RevenueCat API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔄 Starting RevenueCat sync...');

    // Buscar todas as assinaturas Apple ativas
    const { data: appleSubscriptions, error: subError } = await supabaseClient
      .from('subscriptions')
      .select(`
        id,
        user_id,
        status,
        next_due_date,
        plan_type,
        created_at,
        profiles!inner(id, email)
      `)
      .eq('payment_platform', 'apple')
      .in('status', ['active', 'pending']);

    if (subError) {
      console.error('❌ Error fetching subscriptions:', subError);
      throw subError;
    }

    console.log(`📊 Found ${appleSubscriptions?.length || 0} Apple subscriptions to sync`);

    const results = {
      synced: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[],
    };

    for (const subscription of appleSubscriptions || []) {
      const userId = subscription.user_id;
      const email = subscription.profiles?.email;

      try {
        console.log(`🔍 Syncing user: ${userId} (${email})`);

        // Consultar RevenueCat API
        const rcResponse = await fetch(
          `https://api.revenuecat.com/v1/subscribers/${userId}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${revenueCatApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!rcResponse.ok) {
          if (rcResponse.status === 404) {
            console.log(`⚠️ User ${userId} not found in RevenueCat - skipping`);
            results.skipped++;
            results.details.push({
              userId,
              email,
              status: 'not_found_in_revenuecat',
            });
            continue;
          }
          throw new Error(`RevenueCat API error: ${rcResponse.status}`);
        }

        const rcData = await rcResponse.json();
        const subscriber = rcData.subscriber;

        if (!subscriber) {
          console.log(`⚠️ No subscriber data for ${userId}`);
          results.skipped++;
          continue;
        }

        // Buscar a subscription ativa mais recente
        const subscriptions = subscriber.subscriptions || {};
        let latestExpiration: Date | null = null;
        let activeProductId: string | null = null;
        let subscriptionStatus: string | null = null;

        for (const [productId, subData] of Object.entries(subscriptions) as [string, any][]) {
          const expiresDate = subData.expires_date ? new Date(subData.expires_date) : null;
          const unsubscribeDetectedAt = subData.unsubscribe_detected_at;
          const billingIssuesDetectedAt = subData.billing_issues_detected_at;

          // Verificar se está ativo (expires_date no futuro)
          if (expiresDate && expiresDate > new Date()) {
            if (!latestExpiration || expiresDate > latestExpiration) {
              latestExpiration = expiresDate;
              activeProductId = productId;
              
              // Determinar status
              if (billingIssuesDetectedAt) {
                subscriptionStatus = 'billing_issue';
              } else if (unsubscribeDetectedAt) {
                subscriptionStatus = 'active'; // Ainda ativo mas não vai renovar
              } else {
                subscriptionStatus = 'active';
              }
            }
          }
        }

        if (latestExpiration && activeProductId) {
          console.log(`✅ Found active subscription: ${activeProductId}, expires: ${latestExpiration.toISOString()}`);

          // Determinar plan_type
          const planType = activeProductId.includes('annual') || activeProductId.includes('yearly') 
            ? 'annual' 
            : 'monthly';

          // Atualizar subscription no banco
          const { error: updateError } = await supabaseClient
            .from('subscriptions')
            .update({
              next_due_date: latestExpiration.toISOString(),
              status: subscriptionStatus || 'active',
              apple_product_id: activeProductId,
              plan_type: planType,
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscription.id);

          if (updateError) {
            console.error(`❌ Error updating subscription ${subscription.id}:`, updateError);
            results.failed++;
          } else {
            results.synced++;
            results.details.push({
              userId,
              email,
              status: 'synced',
              expiresDate: latestExpiration.toISOString(),
              productId: activeProductId,
            });
          }
        } else {
          // Não tem subscription ativa no RevenueCat
          console.log(`⚠️ No active subscription found for ${userId} in RevenueCat`);
          
          // Verificar se tem indicação para calcular trial correto
          const { data: referral } = await supabaseClient
            .from('referrals')
            .select('id')
            .eq('referred_id', userId)
            .maybeSingle();

          const hasReferral = !!referral;
          const trialDays = hasReferral ? 14 : 7;
          
          // Calcular próxima cobrança baseado na data de criação + trial
          const createdAt = new Date(subscription.created_at);
          const firstPaymentDate = new Date(createdAt);
          firstPaymentDate.setDate(firstPaymentDate.getDate() + trialDays);
          
          // Se já passou o trial, calcular próxima cobrança
          const now = new Date();
          let calculatedNextDue: Date;
          
          if (firstPaymentDate > now) {
            // Ainda no trial
            calculatedNextDue = firstPaymentDate;
          } else {
            // Já passou o trial - próxima seria 30 dias após primeira cobrança
            calculatedNextDue = new Date(firstPaymentDate);
            calculatedNextDue.setDate(calculatedNextDue.getDate() + 30);
          }

          // Atualizar com data calculada (fallback)
          const { error: updateError } = await supabaseClient
            .from('subscriptions')
            .update({
              next_due_date: calculatedNextDue.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscription.id);

          if (updateError) {
            results.failed++;
          } else {
            results.skipped++;
            results.details.push({
              userId,
              email,
              status: 'calculated_fallback',
              calculatedNextDue: calculatedNextDue.toISOString(),
              hasReferral,
              trialDays,
            });
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (userError) {
        console.error(`❌ Error syncing user ${userId}:`, userError);
        results.failed++;
        results.details.push({
          userId,
          email,
          status: 'error',
          error: String(userError),
        });
      }
    }

    console.log(`✅ Sync completed: ${results.synced} synced, ${results.failed} failed, ${results.skipped} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sync completed`,
        ...results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in sync function:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
