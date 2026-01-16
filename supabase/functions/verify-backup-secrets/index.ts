import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SecretStatus {
  name: string
  configured: boolean
  format_valid: boolean
  description: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get authorization header to verify admin access
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the user is an admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id })
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check each secret
    const secrets: SecretStatus[] = []

    // 1. ASAAS_API_KEY
    const asaasKey = Deno.env.get('ASAAS_API_KEY')
    secrets.push({
      name: 'ASAAS_API_KEY',
      configured: !!asaasKey && asaasKey.length > 0,
      format_valid: !!asaasKey && asaasKey.startsWith('$aact_'),
      description: 'Gateway de pagamentos Asaas'
    })

    // 2. ASAAS_WEBHOOK_TOKEN
    const asaasWebhook = Deno.env.get('ASAAS_WEBHOOK_TOKEN')
    secrets.push({
      name: 'ASAAS_WEBHOOK_TOKEN',
      configured: !!asaasWebhook && asaasWebhook.length > 0,
      format_valid: !!asaasWebhook && asaasWebhook.length >= 8,
      description: 'Token de webhook do Asaas'
    })

    // 3. FIREBASE_SERVER_KEY
    const firebaseKey = Deno.env.get('FIREBASE_SERVER_KEY')
    secrets.push({
      name: 'FIREBASE_SERVER_KEY',
      configured: !!firebaseKey && firebaseKey.length > 0,
      format_valid: !!firebaseKey && firebaseKey.length > 100,
      description: 'Chave do servidor FCM (legado)'
    })

    // 4. FIREBASE_SERVICE_ACCOUNT
    const firebaseServiceAccount = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')
    let firebaseServiceAccountValid = false
    if (firebaseServiceAccount) {
      try {
        const parsed = JSON.parse(firebaseServiceAccount)
        firebaseServiceAccountValid = !!parsed.project_id && !!parsed.private_key
      } catch {
        firebaseServiceAccountValid = false
      }
    }
    secrets.push({
      name: 'FIREBASE_SERVICE_ACCOUNT',
      configured: !!firebaseServiceAccount && firebaseServiceAccount.length > 0,
      format_valid: firebaseServiceAccountValid,
      description: 'JSON da conta de serviço Firebase'
    })

    // 5. RESEND_API_KEY
    const resendKey = Deno.env.get('RESEND_API_KEY')
    secrets.push({
      name: 'RESEND_API_KEY',
      configured: !!resendKey && resendKey.length > 0,
      format_valid: !!resendKey && resendKey.startsWith('re_'),
      description: 'API de envio de emails Resend'
    })

    // 6. BREVO_API_KEY
    const brevoKey = Deno.env.get('BREVO_API_KEY')
    secrets.push({
      name: 'BREVO_API_KEY',
      configured: !!brevoKey && brevoKey.length > 0,
      format_valid: !!brevoKey && brevoKey.startsWith('xkeysib-'),
      description: 'API de emails transacionais Brevo'
    })

    // 7. REVENUECAT_API_KEY
    const revenuecatKey = Deno.env.get('REVENUECAT_API_KEY')
    secrets.push({
      name: 'REVENUECAT_API_KEY',
      configured: !!revenuecatKey && revenuecatKey.length > 0,
      format_valid: !!revenuecatKey && revenuecatKey.startsWith('sk_'),
      description: 'API de assinaturas RevenueCat'
    })

    // 8. REVENUECAT_WEBHOOK_AUTH_KEY
    const revenuecatWebhook = Deno.env.get('REVENUECAT_WEBHOOK_AUTH_KEY')
    secrets.push({
      name: 'REVENUECAT_WEBHOOK_AUTH_KEY',
      configured: !!revenuecatWebhook && revenuecatWebhook.length > 0,
      format_valid: !!revenuecatWebhook && revenuecatWebhook.length >= 8,
      description: 'Token de webhook RevenueCat'
    })

    // 9. BACKUP_SUPABASE_URL
    const backupUrl = Deno.env.get('BACKUP_SUPABASE_URL')
    secrets.push({
      name: 'BACKUP_SUPABASE_URL',
      configured: !!backupUrl && backupUrl.length > 0,
      format_valid: !!backupUrl && backupUrl.includes('.supabase.co'),
      description: 'URL do Supabase de backup'
    })

    // 10. BACKUP_SUPABASE_SERVICE_ROLE_KEY
    const backupKey = Deno.env.get('BACKUP_SUPABASE_SERVICE_ROLE_KEY')
    secrets.push({
      name: 'BACKUP_SUPABASE_SERVICE_ROLE_KEY',
      configured: !!backupKey && backupKey.length > 0,
      format_valid: !!backupKey && backupKey.startsWith('eyJ'),
      description: 'Service Role do Supabase de backup'
    })

    // Calculate summary
    const configuredCount = secrets.filter(s => s.configured).length
    const validCount = secrets.filter(s => s.format_valid).length
    const totalCount = secrets.length

    const summary = {
      total: totalCount,
      configured: configuredCount,
      valid_format: validCount,
      missing: totalCount - configuredCount,
      status: configuredCount === totalCount ? 'OK' : 'INCOMPLETE',
      message: configuredCount === totalCount 
        ? '✅ Todas as secrets estão configuradas!'
        : `⚠️ ${totalCount - configuredCount} secret(s) faltando`
    }

    return new Response(
      JSON.stringify({ 
        summary,
        secrets,
        checked_at: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error verifying secrets:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
