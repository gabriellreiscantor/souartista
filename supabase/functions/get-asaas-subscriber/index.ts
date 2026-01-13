import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY');
const ASAAS_BASE_URL = 'https://api.asaas.com/v3';

async function asaasRequest(endpoint: string) {
  const response = await fetch(`${ASAAS_BASE_URL}${endpoint}`, {
    headers: {
      'access_token': ASAAS_API_KEY!,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Asaas API error: ${response.status} - ${errorText}`);
    throw new Error(`Asaas API error: ${response.status}`);
  }
  
  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action, asaasId, userId, email } = body;

    // Action: List all Asaas subscribers from local database
    if (action === 'list-asaas-subscribers') {
      const { data: subscribers, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          user_id,
          status,
          payment_platform,
          payment_method,
          asaas_subscription_id,
          asaas_customer_id,
          next_due_date,
          amount,
          plan_type,
          created_at,
          profiles:user_id (
            id,
            name,
            email
          )
        `)
        .or('asaas_subscription_id.not.is.null,asaas_customer_id.not.is.null')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, subscribers }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Search directly by Asaas ID (subscription or customer)
    if (action === 'search-by-asaas-id') {
      if (!asaasId) {
        return new Response(
          JSON.stringify({ success: false, error: 'asaasId é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Searching Asaas by ID:', asaasId);

      let asaasData: any = null;
      let searchType: 'subscription' | 'customer' | null = null;

      // Try as subscription ID first (sub_xxx)
      if (asaasId.startsWith('sub_')) {
        try {
          const subscription = await asaasRequest(`/subscriptions/${asaasId}`);
          const customer = await asaasRequest(`/customers/${subscription.customer}`);
          const payments = await asaasRequest(`/subscriptions/${asaasId}/payments?limit=20`);
          
          asaasData = {
            subscription,
            customer,
            payments: payments.data || [],
          };
          searchType = 'subscription';
        } catch (e) {
          console.error('Error fetching subscription:', e);
        }
      }

      // Try as customer ID (cus_xxx)
      if (!asaasData && asaasId.startsWith('cus_')) {
        try {
          const customer = await asaasRequest(`/customers/${asaasId}`);
          const subscriptions = await asaasRequest(`/subscriptions?customer=${asaasId}&limit=10`);
          
          let payments: any[] = [];
          if (subscriptions.data && subscriptions.data.length > 0) {
            const subPayments = await asaasRequest(`/subscriptions/${subscriptions.data[0].id}/payments?limit=20`);
            payments = subPayments.data || [];
          }
          
          asaasData = {
            customer,
            subscription: subscriptions.data?.[0] || null,
            subscriptions: subscriptions.data || [],
            payments,
          };
          searchType = 'customer';
        } catch (e) {
          console.error('Error fetching customer:', e);
        }
      }

      if (!asaasData) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            found: false,
            error: 'ID não encontrado no Asaas. Verifique se o ID está correto (sub_xxx ou cus_xxx).' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Try to find local user by asaas_customer_id or asaas_subscription_id
      let localUser = null;
      let localSubscription = null;

      const customerId = asaasData.customer?.id;
      const subscriptionId = asaasData.subscription?.id;

      if (customerId || subscriptionId) {
        let query = supabase.from('subscriptions').select(`
          *,
          profiles:user_id (id, name, email)
        `);

        if (subscriptionId) {
          query = query.eq('asaas_subscription_id', subscriptionId);
        } else if (customerId) {
          query = query.eq('asaas_customer_id', customerId);
        }

        const { data: localData } = await query.maybeSingle();

        if (localData) {
          localSubscription = localData;
          localUser = localData.profiles;
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          found: true,
          searchedId: asaasId,
          searchType,
          localUser,
          localSubscription,
          asaas: asaasData,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search by user ID (from local database)
    if (userId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ success: true, found: false, message: 'Usuário não encontrado no banco local' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      let asaasData = null;
      if (subscription?.asaas_subscription_id || subscription?.asaas_customer_id) {
        try {
          if (subscription.asaas_subscription_id) {
            const sub = await asaasRequest(`/subscriptions/${subscription.asaas_subscription_id}`);
            const customer = await asaasRequest(`/customers/${sub.customer}`);
            const payments = await asaasRequest(`/subscriptions/${subscription.asaas_subscription_id}/payments?limit=20`);
            asaasData = { subscription: sub, customer, payments: payments.data || [] };
          } else if (subscription.asaas_customer_id) {
            const customer = await asaasRequest(`/customers/${subscription.asaas_customer_id}`);
            const subs = await asaasRequest(`/subscriptions?customer=${subscription.asaas_customer_id}&limit=10`);
            let payments: any[] = [];
            if (subs.data?.[0]) {
              const subPayments = await asaasRequest(`/subscriptions/${subs.data[0].id}/payments?limit=20`);
              payments = subPayments.data || [];
            }
            asaasData = { customer, subscription: subs.data?.[0], payments };
          }
        } catch (e) {
          console.error('Error fetching Asaas data:', e);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          user: profile,
          localSubscription: subscription,
          asaas: asaasData,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search by email or name
    if (email) {
      const searchTerm = email.trim().toLowerCase();
      
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .or(`email.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
        .limit(1);

      if (profileError || !profiles || profiles.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            found: false, 
            message: `Usuário não encontrado com "${email}". Use a busca por ID Asaas se tiver o sub_xxx ou cus_xxx.` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const profile = profiles[0];

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

      let asaasData = null;
      if (subscription?.asaas_subscription_id || subscription?.asaas_customer_id) {
        try {
          if (subscription.asaas_subscription_id) {
            const sub = await asaasRequest(`/subscriptions/${subscription.asaas_subscription_id}`);
            const customer = await asaasRequest(`/customers/${sub.customer}`);
            const payments = await asaasRequest(`/subscriptions/${subscription.asaas_subscription_id}/payments?limit=20`);
            asaasData = { subscription: sub, customer, payments: payments.data || [] };
          } else if (subscription.asaas_customer_id) {
            const customer = await asaasRequest(`/customers/${subscription.asaas_customer_id}`);
            const subs = await asaasRequest(`/subscriptions?customer=${subscription.asaas_customer_id}&limit=10`);
            let payments: any[] = [];
            if (subs.data?.[0]) {
              const subPayments = await asaasRequest(`/subscriptions/${subs.data[0].id}/payments?limit=20`);
              payments = subPayments.data || [];
            }
            asaasData = { customer, subscription: subs.data?.[0], payments };
          }
        } catch (e) {
          console.error('Error fetching Asaas data:', e);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          user: profile,
          localSubscription: subscription,
          asaas: asaasData,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Parâmetro inválido. Use action, userId ou email.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in get-asaas-subscriber:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
