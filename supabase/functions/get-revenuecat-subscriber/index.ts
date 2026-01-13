import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RevenueCatSubscription {
  expires_date: string | null
  purchase_date: string
  original_purchase_date: string
  product_identifier: string
  is_sandbox: boolean
  unsubscribe_detected_at: string | null
  billing_issues_detected_at: string | null
}

interface RevenueCatSubscriber {
  subscriber: {
    original_app_user_id: string
    first_seen: string
    last_seen: string
    entitlements: {
      [key: string]: {
        expires_date: string | null
        product_identifier: string
        purchase_date: string
      }
    }
    subscriptions: {
      [key: string]: RevenueCatSubscription
    }
    non_subscriptions: {
      [key: string]: any[]
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const REVENUECAT_API_KEY = Deno.env.get('REVENUECAT_API_KEY')
    if (!REVENUECAT_API_KEY) {
      throw new Error('REVENUECAT_API_KEY não configurada')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { userId, email, action, revenueCatId } = await req.json()

    // Action: Search directly by RevenueCat ID (including anonymous IDs)
    if (action === 'search-by-revenuecat-id') {
      if (!revenueCatId) {
        return new Response(
          JSON.stringify({ success: false, error: 'revenueCatId é obrigatório' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      console.log(`Searching RevenueCat directly for ID: ${revenueCatId}`)
      
      const revenueCatResponse = await fetch(
        `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(revenueCatId)}`,
        {
          headers: {
            'Authorization': `Bearer ${REVENUECAT_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!revenueCatResponse.ok) {
        if (revenueCatResponse.status === 404) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              found: false,
              error: 'ID não encontrado no RevenueCat' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          )
        }
        const errorText = await revenueCatResponse.text()
        throw new Error(`Erro RevenueCat: ${revenueCatResponse.status} - ${errorText}`)
      }

      const revenueCatData: RevenueCatSubscriber = await revenueCatResponse.json()
      
      // Parse the data
      let activeEntitlement = null
      let activeSubscription = null
      const subscriptionHistory: any[] = []

      if (revenueCatData?.subscriber) {
        const { entitlements, subscriptions } = revenueCatData.subscriber

        for (const [key, entitlement] of Object.entries(entitlements || {})) {
          const expiresDate = entitlement.expires_date ? new Date(entitlement.expires_date) : null
          if (!expiresDate || expiresDate > new Date()) {
            activeEntitlement = { key, ...entitlement }
            break
          }
        }

        for (const [productId, subscription] of Object.entries(subscriptions || {})) {
          const subData = {
            product_id: productId,
            expires_date: subscription.expires_date,
            purchase_date: subscription.purchase_date,
            original_purchase_date: subscription.original_purchase_date,
            is_sandbox: subscription.is_sandbox,
            unsubscribe_detected_at: subscription.unsubscribe_detected_at,
            billing_issues_detected_at: subscription.billing_issues_detected_at,
            is_active: subscription.expires_date ? new Date(subscription.expires_date) > new Date() : true
          }
          
          subscriptionHistory.push(subData)
          if (subData.is_active && !activeSubscription) {
            activeSubscription = subData
          }
        }

        subscriptionHistory.sort((a, b) => 
          new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime()
        )
      }

      // Try to find linked local user
      let localUser = null
      let localSubscription = null
      
      // Check if it's a UUID (could be a real user ID)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(revenueCatId)
      
      if (isUUID) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('id', revenueCatId)
          .maybeSingle()
        
        if (profile) {
          localUser = profile
          
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', revenueCatId)
            .maybeSingle()
          
          localSubscription = sub
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          found: true,
          searchedId: revenueCatId,
          isAnonymousId: revenueCatId.startsWith('$RCAnonymousID'),
          localUser,
          localSubscription,
          revenueCat: {
            original_app_user_id: revenueCatData.subscriber.original_app_user_id,
            first_seen: revenueCatData.subscriber.first_seen,
            last_seen: revenueCatData.subscriber.last_seen,
            active_entitlement: activeEntitlement,
            active_subscription: activeSubscription,
            subscription_history: subscriptionHistory,
            raw_entitlements: revenueCatData.subscriber.entitlements,
            raw_subscriptions: revenueCatData.subscriber.subscriptions
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Action: list all apple subscribers
    if (action === 'list-apple-subscribers') {
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          user_id,
          status,
          payment_platform,
          apple_product_id,
          next_due_date,
          amount,
          plan_type,
          created_at
        `)
        .eq('payment_platform', 'apple')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get profiles for all users
      const userIds = subscriptions?.map(s => s.user_id) || []
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds)

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

      const enrichedSubscriptions = subscriptions?.map(sub => ({
        ...sub,
        profile: profileMap.get(sub.user_id) || null
      })) || []

      return new Response(
        JSON.stringify({ 
          success: true, 
          subscribers: enrichedSubscriptions,
          count: enrichedSubscriptions.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find user by email/name if no userId provided
    let targetUserId = userId
    let userProfile = null

    if (!targetUserId && email) {
      // First try exact email match
      let { data: profile } = await supabase
        .from('profiles')
        .select('id, name, email')
        .ilike('email', email)
        .maybeSingle()

      // If not found, try searching by email containing the term
      if (!profile) {
        const { data: emailProfiles } = await supabase
          .from('profiles')
          .select('id, name, email')
          .ilike('email', `%${email}%`)
          .limit(1)

        if (emailProfiles && emailProfiles.length > 0) {
          profile = emailProfiles[0]
        }
      }

      // If still not found, try searching by name
      if (!profile) {
        const { data: nameProfiles } = await supabase
          .from('profiles')
          .select('id, name, email')
          .ilike('name', `%${email}%`)
          .limit(1)

        if (nameProfiles && nameProfiles.length > 0) {
          profile = nameProfiles[0]
        }
      }

      if (!profile) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            found: false,
            message: 'Usuário não encontrado no banco local. Use a busca por ID do RevenueCat para consultar IDs anônimos diretamente na API.' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      targetUserId = profile.id
      userProfile = profile
    }

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'userId ou email é obrigatório' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get profile if not already fetched
    if (!userProfile) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('id', targetUserId)
        .maybeSingle()
      
      userProfile = profile
    }

    // Get local subscription data
    const { data: localSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle()

    // Query RevenueCat API
    console.log(`Querying RevenueCat for user: ${targetUserId}`)
    
    const revenueCatResponse = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${targetUserId}`,
      {
        headers: {
          'Authorization': `Bearer ${REVENUECAT_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    let revenueCatData: RevenueCatSubscriber | null = null
    let revenueCatError: string | null = null

    if (revenueCatResponse.ok) {
      revenueCatData = await revenueCatResponse.json()
      console.log('RevenueCat data found:', JSON.stringify(revenueCatData, null, 2))
    } else if (revenueCatResponse.status === 404) {
      revenueCatError = 'Usuário não encontrado no RevenueCat'
      console.log('User not found in RevenueCat')
    } else {
      const errorText = await revenueCatResponse.text()
      revenueCatError = `Erro RevenueCat: ${revenueCatResponse.status} - ${errorText}`
      console.error('RevenueCat error:', errorText)
    }

    // Parse RevenueCat data
    let activeEntitlement = null
    let activeSubscription = null
    let subscriptionHistory: any[] = []

    if (revenueCatData?.subscriber) {
      const { entitlements, subscriptions } = revenueCatData.subscriber

      // Find active entitlement
      for (const [key, entitlement] of Object.entries(entitlements || {})) {
        const expiresDate = entitlement.expires_date ? new Date(entitlement.expires_date) : null
        if (!expiresDate || expiresDate > new Date()) {
          activeEntitlement = { key, ...entitlement }
          break
        }
      }

      // Get all subscriptions
      for (const [productId, subscription] of Object.entries(subscriptions || {})) {
        const subData = {
          product_id: productId,
          expires_date: subscription.expires_date,
          purchase_date: subscription.purchase_date,
          original_purchase_date: subscription.original_purchase_date,
          is_sandbox: subscription.is_sandbox,
          unsubscribe_detected_at: subscription.unsubscribe_detected_at,
          billing_issues_detected_at: subscription.billing_issues_detected_at,
          is_active: subscription.expires_date ? new Date(subscription.expires_date) > new Date() : true
        }
        
        subscriptionHistory.push(subData)

        // Check if this is the active subscription
        if (subData.is_active && !activeSubscription) {
          activeSubscription = subData
        }
      }

      // Sort by purchase date descending
      subscriptionHistory.sort((a, b) => 
        new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime()
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: targetUserId,
          name: userProfile?.name || 'N/A',
          email: userProfile?.email || 'N/A'
        },
        localSubscription: localSubscription || null,
        revenueCat: revenueCatData ? {
          original_app_user_id: revenueCatData.subscriber.original_app_user_id,
          first_seen: revenueCatData.subscriber.first_seen,
          last_seen: revenueCatData.subscriber.last_seen,
          active_entitlement: activeEntitlement,
          active_subscription: activeSubscription,
          subscription_history: subscriptionHistory,
          raw_entitlements: revenueCatData.subscriber.entitlements,
          raw_subscriptions: revenueCatData.subscriber.subscriptions
        } : null,
        revenueCatError
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})