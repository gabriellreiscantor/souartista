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
  'backup_logs',
]

// Buckets de Storage para backup
const STORAGE_BUCKETS = ['profile-photos', 'support-attachments']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  let logId: string | null = null

  // Conectar ao Supabase de PRODUÇÃO (leitura)
  const prodUrl = Deno.env.get('SUPABASE_URL')!
  const prodKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const prodClient = createClient(prodUrl, prodKey)

  // Conectar ao Supabase de BACKUP (escrita)
  const backupUrl = Deno.env.get('BACKUP_SUPABASE_URL')!
  const backupKey = Deno.env.get('BACKUP_SUPABASE_SERVICE_ROLE_KEY')!
  const backupClient = createClient(backupUrl, backupKey)

  try {
    // Criar registro de log inicial
    const { data: logData, error: logError } = await prodClient
      .from('backup_logs')
      .insert({
        status: 'running',
        details: { started_at: new Date().toISOString() }
      })
      .select('id')
      .single()

    if (logData) {
      logId = logData.id
    }

    console.log('🚀 Iniciando backup completo do banco de dados...')
    console.log(`📅 Data/Hora: ${new Date().toISOString()}`)

    const tableResults: { table: string; count: number; status: 'success' | 'error'; error?: string }[] = []
    let totalRecords = 0

    // ===== FASE 1: BACKUP DE TABELAS =====
    console.log('\n📦 FASE 1: Backup de tabelas...')

    for (const table of TABLES_TO_BACKUP) {
      try {
        console.log(`  📦 Copiando tabela: ${table}...`)

        // Buscar todos os registros da produção
        const { data: records, error: fetchError } = await prodClient
          .from(table)
          .select('*')

        if (fetchError) {
          console.error(`  ❌ Erro ao buscar ${table}:`, fetchError.message)
          tableResults.push({ table, count: 0, status: 'error', error: fetchError.message })
          continue
        }

        if (!records || records.length === 0) {
          console.log(`  ⚪ Tabela ${table} está vazia`)
          tableResults.push({ table, count: 0, status: 'success' })
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
          console.error(`  ❌ Erro ao salvar ${table}:`, upsertError.message)
          tableResults.push({ table, count: records.length, status: 'error', error: upsertError.message })
          continue
        }

        console.log(`  ✅ ${table}: ${records.length} registros copiados`)
        tableResults.push({ table, count: records.length, status: 'success' })
        totalRecords += records.length

      } catch (tableError) {
        const errorMessage = tableError instanceof Error ? tableError.message : 'Erro desconhecido'
        console.error(`  ❌ Erro inesperado em ${table}:`, errorMessage)
        tableResults.push({ table, count: 0, status: 'error', error: errorMessage })
      }
    }

    // ===== FASE 2: BACKUP DE STORAGE =====
    console.log('\n📁 FASE 2: Backup de arquivos do Storage...')

    const fileResults: { bucket: string; file: string; status: 'success' | 'error'; error?: string }[] = []
    let totalFiles = 0

    for (const bucket of STORAGE_BUCKETS) {
      try {
        console.log(`  📁 Processando bucket: ${bucket}...`)

        // Listar arquivos do bucket
        const { data: files, error: listError } = await prodClient
          .storage
          .from(bucket)
          .list('', { limit: 1000 })

        if (listError) {
          console.error(`  ❌ Erro ao listar ${bucket}:`, listError.message)
          fileResults.push({ bucket, file: '*', status: 'error', error: listError.message })
          continue
        }

        if (!files || files.length === 0) {
          console.log(`  ⚪ Bucket ${bucket} está vazio`)
          continue
        }

        // Processar cada arquivo
        for (const file of files) {
          // Pular pastas
          if (!file.name || file.id === null) continue

          try {
            // Download do arquivo da produção
            const { data: fileData, error: downloadError } = await prodClient
              .storage
              .from(bucket)
              .download(file.name)

            if (downloadError) {
              console.error(`    ❌ Erro ao baixar ${file.name}:`, downloadError.message)
              fileResults.push({ bucket, file: file.name, status: 'error', error: downloadError.message })
              continue
            }

            // Upload para o backup (sobrescreve se existir)
            const { error: uploadError } = await backupClient
              .storage
              .from(bucket)
              .upload(file.name, fileData, { 
                upsert: true,
                contentType: file.metadata?.mimetype || 'application/octet-stream'
              })

            if (uploadError) {
              console.error(`    ❌ Erro ao enviar ${file.name}:`, uploadError.message)
              fileResults.push({ bucket, file: file.name, status: 'error', error: uploadError.message })
              continue
            }

            console.log(`    ✅ ${bucket}/${file.name} copiado`)
            fileResults.push({ bucket, file: file.name, status: 'success' })
            totalFiles++

          } catch (fileError) {
            const errorMessage = fileError instanceof Error ? fileError.message : 'Erro desconhecido'
            console.error(`    ❌ Erro em ${file.name}:`, errorMessage)
            fileResults.push({ bucket, file: file.name, status: 'error', error: errorMessage })
          }
        }

      } catch (bucketError) {
        const errorMessage = bucketError instanceof Error ? bucketError.message : 'Erro desconhecido'
        console.error(`  ❌ Erro no bucket ${bucket}:`, errorMessage)
        fileResults.push({ bucket, file: '*', status: 'error', error: errorMessage })
      }
    }

    // ===== FASE 3: RESUMO E LOG =====
    const endTime = Date.now()
    const durationSeconds = (endTime - startTime) / 1000

    const tableSuccessCount = tableResults.filter(r => r.status === 'success').length
    const tableErrorCount = tableResults.filter(r => r.status === 'error').length
    const fileSuccessCount = fileResults.filter(r => r.status === 'success').length
    const fileErrorCount = fileResults.filter(r => r.status === 'error').length

    const hasErrors = tableErrorCount > 0 || fileErrorCount > 0
    const finalStatus = hasErrors ? 'partial' : 'success'

    const summary = {
      timestamp: new Date().toISOString(),
      duration_seconds: durationSeconds,
      tables: {
        total: TABLES_TO_BACKUP.length,
        success: tableSuccessCount,
        errors: tableErrorCount,
        records_copied: totalRecords,
      },
      storage: {
        buckets: STORAGE_BUCKETS.length,
        files_copied: totalFiles,
        errors: fileErrorCount,
      },
      status: finalStatus,
      table_details: tableResults,
      file_details: fileResults,
    }

    console.log('\n📊 RESUMO DO BACKUP:')
    console.log(`   - Tabelas: ${tableSuccessCount}/${TABLES_TO_BACKUP.length} com sucesso`)
    console.log(`   - Registros copiados: ${totalRecords}`)
    console.log(`   - Arquivos copiados: ${totalFiles}`)
    console.log(`   - Duração: ${durationSeconds.toFixed(2)}s`)
    console.log(`   - Status: ${finalStatus}`)

    // Atualizar log de backup
    if (logId) {
      await prodClient
        .from('backup_logs')
        .update({
          tables_copied: tableSuccessCount,
          records_copied: totalRecords,
          files_copied: totalFiles,
          status: finalStatus,
          duration_seconds: durationSeconds,
          details: summary,
          error_message: hasErrors ? `${tableErrorCount} erros em tabelas, ${fileErrorCount} erros em arquivos` : null,
        })
        .eq('id', logId)
    }

    // Se houver erros, notificar admins
    if (hasErrors) {
      console.log('\n⚠️ Enviando notificação de erro para admins...')
      
      try {
        // Buscar admins
        const { data: admins } = await prodClient
          .from('admin_users')
          .select('user_id')

        if (admins && admins.length > 0) {
          // Criar notificação para cada admin
          for (const admin of admins) {
            await prodClient
              .from('notifications')
              .insert({
                user_id: admin.user_id,
                title: '⚠️ Backup com erros',
                message: `O backup automático teve ${tableErrorCount + fileErrorCount} erros. Verifique os logs.`,
                link: '/admin',
                created_by: admin.user_id,
              })
          }
          console.log('✅ Notificações enviadas para admins')
        }
      } catch (notifyError) {
        console.error('❌ Erro ao notificar admins:', notifyError)
      }
    }

    return new Response(
      JSON.stringify(summary),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: hasErrors ? 207 : 200
      }
    )

  } catch (error) {
    const endTime = Date.now()
    const durationSeconds = (endTime - startTime) / 1000
    
    console.error('💥 Erro fatal no backup:', error)

    // Atualizar log com erro
    if (logId) {
      await prodClient
        .from('backup_logs')
        .update({
          status: 'error',
          duration_seconds: durationSeconds,
          error_message: error instanceof Error ? error.message : 'Erro desconhecido',
          details: { error: error instanceof Error ? error.stack : 'Erro desconhecido' },
        })
        .eq('id', logId)
    }

    // Notificar admins sobre erro fatal
    try {
      const { data: admins } = await prodClient
        .from('admin_users')
        .select('user_id')

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          await prodClient
            .from('notifications')
            .insert({
              user_id: admin.user_id,
              title: '🚨 Backup falhou!',
              message: `O backup automático falhou completamente. Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`,
              link: '/admin',
              created_by: admin.user_id,
            })
        }
      }
    } catch (notifyError) {
      console.error('❌ Erro ao notificar admins:', notifyError)
    }

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
