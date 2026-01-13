import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Lista de todas as tabelas para backup
const TABLES_TO_BACKUP = [
  'profiles',
  'user_roles',
  'user_devices',
  'admin_users',
  'artists',
  'musicians',
  'venues',
  'musician_venues',
  'musician_instruments',
  'shows',
  'locomotion_expenses',
  'subscriptions',
  'payment_history',
  'referral_codes',
  'referrals',
  'referral_rewards',
  'notifications',
  'notification_reads',
  'notification_hidden',
  'system_announcements',
  'announcement_dismissed',
  'support_tickets',
  'support_responses',
  'user_feedback',
  'lgpd_requests',
  'deleted_users',
  'app_updates',
  'otp_codes',
  'fcm_token_history',
  'push_notification_logs',
  'engagement_tip_logs',
  'marketing_notification_logs',
  'show_notification_logs',
  'subscription_reminder_logs',
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Conectar ao Supabase de PRODUÇÃO (leitura)
    const prodUrl = Deno.env.get('SUPABASE_URL')!
    const prodKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const prodClient = createClient(prodUrl, prodKey)

    // Conectar ao Supabase de BACKUP (escrita)
    const backupUrl = Deno.env.get('BACKUP_SUPABASE_URL')!
    const backupKey = Deno.env.get('BACKUP_SUPABASE_SERVICE_ROLE_KEY')!
    const backupClient = createClient(backupUrl, backupKey)

    console.log('🚀 Iniciando backup do banco de dados...')
    console.log(`📅 Data/Hora: ${new Date().toISOString()}`)

    const results: { table: string; count: number; status: 'success' | 'error'; error?: string }[] = []
    let totalRecords = 0

    for (const table of TABLES_TO_BACKUP) {
      try {
        console.log(`📦 Copiando tabela: ${table}...`)

        // Buscar todos os registros da produção
        const { data: records, error: fetchError } = await prodClient
          .from(table)
          .select('*')

        if (fetchError) {
          console.error(`❌ Erro ao buscar ${table}:`, fetchError.message)
          results.push({ table, count: 0, status: 'error', error: fetchError.message })
          continue
        }

        if (!records || records.length === 0) {
          console.log(`⚪ Tabela ${table} está vazia`)
          results.push({ table, count: 0, status: 'success' })
          continue
        }

        // Inserir/Atualizar no backup usando upsert
        const { error: upsertError } = await backupClient
          .from(table)
          .upsert(records, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })

        if (upsertError) {
          console.error(`❌ Erro ao salvar ${table}:`, upsertError.message)
          results.push({ table, count: records.length, status: 'error', error: upsertError.message })
          continue
        }

        console.log(`✅ ${table}: ${records.length} registros copiados`)
        results.push({ table, count: records.length, status: 'success' })
        totalRecords += records.length

      } catch (tableError) {
        const errorMessage = tableError instanceof Error ? tableError.message : 'Erro desconhecido'
        console.error(`❌ Erro inesperado em ${table}:`, errorMessage)
        results.push({ table, count: 0, status: 'error', error: errorMessage })
      }
    }

    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length

    const summary = {
      timestamp: new Date().toISOString(),
      totalTables: TABLES_TO_BACKUP.length,
      successfulTables: successCount,
      failedTables: errorCount,
      totalRecords,
      details: results,
    }

    console.log('📊 Resumo do backup:')
    console.log(`   - Tabelas processadas: ${TABLES_TO_BACKUP.length}`)
    console.log(`   - Sucesso: ${successCount}`)
    console.log(`   - Erros: ${errorCount}`)
    console.log(`   - Total de registros: ${totalRecords}`)

    return new Response(
      JSON.stringify(summary),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: errorCount > 0 ? 207 : 200 // 207 = Multi-Status se houver erros parciais
      }
    )

  } catch (error) {
    console.error('💥 Erro fatal no backup:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro fatal no backup',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
