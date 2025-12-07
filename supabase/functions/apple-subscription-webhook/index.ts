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
    // Validate Authorization header
    const authHeader = req.headers.get('authorization');
    const expectedAuth = Deno.env.get('REVENUECAT_WEBHOOK_AUTH_KEY');
    
    if (!expectedAuth) {
      console.error('❌ REVENUECAT_WEBHOOK_AUTH_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook auth not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (authHeader !== expectedAuth) {
      console.error('❌ Invalid authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();
    
    console.log('🍎 RevenueCat Webhook received:', JSON.stringify(payload, null, 2));

    // RevenueCat webhook payload structure
    const { event } = payload;
    
    if (!event) {
      console.log('⚠️ No event in payload');
      return new Response(
        JSON.stringify({ received: true, message: 'No event to process' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const eventType = event.type;
    const appUserId = event.app_user_id;
    const productId = event.product_id;
    const expirationAtMs = event.expiration_at_ms;
    const purchasedAtMs = event.purchased_at_ms;
    
    console.log(`📋 Event Type: ${eventType}`);
    console.log(`👤 App User ID: ${appUserId}`);
    console.log(`📦 Product ID: ${productId}`);
    
    if (!appUserId) {
      console.log('⚠️ No app_user_id in event');
      return new Response(
        JSON.stringify({ received: true, message: 'No user ID' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine plan type from product ID
    let planType = 'monthly';
    if (productId?.includes('annual') || productId?.includes('yearly')) {
      planType = 'annual';
    }

    // Calculate expiration date
    let nextDueDate = null;
    if (expirationAtMs) {
      nextDueDate = new Date(expirationAtMs).toISOString();
    }

    // Get amount based on plan type
    const amount = planType === 'annual' ? 300.00 : 29.90;

    // Process based on event type
    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'PRODUCT_CHANGE':
      case 'UNCANCELLATION':
        console.log(`✅ Processing ${eventType} - Activating subscription`);
        
        // Update or create subscription
        const { data: existingSub } = await supabaseClient
          .from('subscriptions')
          .select('id')
          .eq('user_id', appUserId)
          .maybeSingle();

        if (existingSub) {
          // Update existing subscription
          const { error: updateSubError } = await supabaseClient
            .from('subscriptions')
            .update({
              status: 'active',
              plan_type: planType,
              amount: amount,
              apple_product_id: productId,
              next_due_date: nextDueDate,
              payment_platform: 'apple',
              payment_method: 'APPLE_IAP',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', appUserId);

          if (updateSubError) {
            console.error('❌ Error updating subscription:', updateSubError);
          } else {
            console.log('✅ Subscription updated');
          }
        } else {
          // Create new subscription
          const { error: insertSubError } = await supabaseClient
            .from('subscriptions')
            .insert({
              user_id: appUserId,
              status: 'active',
              plan_type: planType,
              amount: amount,
              apple_product_id: productId,
              next_due_date: nextDueDate,
              payment_platform: 'apple',
              payment_method: 'APPLE_IAP',
            });

          if (insertSubError) {
            console.error('❌ Error creating subscription:', insertSubError);
          } else {
            console.log('✅ Subscription created');
          }
        }

        // Update profile to active
        const { error: profileActiveError } = await supabaseClient
          .from('profiles')
          .update({
            status_plano: 'ativo',
            plan_type: planType,
            plan_purchased_at: purchasedAtMs ? new Date(purchasedAtMs).toISOString() : new Date().toISOString(),
          })
          .eq('id', appUserId);

        if (profileActiveError) {
          console.error('❌ Error updating profile:', profileActiveError);
        } else {
          console.log('✅ Profile activated');
        }
        break;

      case 'CANCELLATION':
      case 'EXPIRATION':
        console.log(`⚠️ Processing ${eventType} - Deactivating subscription`);
        
        // Update subscription status
        const { error: cancelSubError } = await supabaseClient
          .from('subscriptions')
          .update({
            status: eventType === 'CANCELLATION' ? 'cancelled' : 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', appUserId);

        if (cancelSubError) {
          console.error('❌ Error updating subscription:', cancelSubError);
        } else {
          console.log('✅ Subscription status updated');
        }

        // Deactivate profile
        const { error: profileInactiveError } = await supabaseClient
          .from('profiles')
          .update({ status_plano: 'inactive' })
          .eq('id', appUserId);

        if (profileInactiveError) {
          console.error('❌ Error updating profile:', profileInactiveError);
        } else {
          console.log('✅ Profile deactivated');
        }
        break;

      case 'BILLING_ISSUE':
        console.log('💳 Billing issue detected');
        
        // Update subscription to pending/billing_issue
        const { error: billingSubError } = await supabaseClient
          .from('subscriptions')
          .update({
            status: 'billing_issue',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', appUserId);

        if (billingSubError) {
          console.error('❌ Error updating subscription:', billingSubError);
        }
        
        // Optionally create a notification for the user
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: appUserId,
            title: '⚠️ Problema com pagamento',
            message: 'Detectamos um problema com o pagamento da sua assinatura. Por favor, verifique seu método de pagamento na App Store.',
            link: '/artist/subscription',
          });
        
        console.log('✅ User notified about billing issue');
        break;

      case 'SUBSCRIBER_ALIAS':
        console.log('🔗 Subscriber alias event - no action needed');
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${eventType}`);
    }

    return new Response(
      JSON.stringify({ 
        received: true,
        event_type: eventType,
        user_id: appUserId,
        processed: true,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error processing RevenueCat webhook:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
