import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Definição completa das tabelas com seus schemas
const TABLE_SCHEMAS: Record<string, string> = {
  profiles: `
    CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      cpf TEXT,
      phone TEXT,
      birth_date TEXT,
      photo_url TEXT,
      status_plano TEXT DEFAULT 'inactive',
      plan_type TEXT,
      fcm_token TEXT,
      timezone TEXT DEFAULT 'America/Sao_Paulo',
      gender TEXT,
      is_verified BOOLEAN DEFAULT false,
      last_seen_at TIMESTAMPTZ DEFAULT now(),
      plan_purchased_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  user_roles: `
    CREATE TABLE IF NOT EXISTS public.user_roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      role TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `,
  user_devices: `
    CREATE TABLE IF NOT EXISTS public.user_devices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      device_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      device_name TEXT,
      fcm_token TEXT,
      timezone TEXT DEFAULT 'America/Sao_Paulo',
      last_used_at TIMESTAMPTZ DEFAULT now(),
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `,
  admin_users: `
    CREATE TABLE IF NOT EXISTS public.admin_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  artists: `
    CREATE TABLE IF NOT EXISTS public.artists (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_uid UUID NOT NULL,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  musicians: `
    CREATE TABLE IF NOT EXISTS public.musicians (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_uid UUID NOT NULL,
      name TEXT NOT NULL,
      instrument TEXT NOT NULL,
      default_fee NUMERIC NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  venues: `
    CREATE TABLE IF NOT EXISTS public.venues (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_uid UUID NOT NULL,
      name TEXT NOT NULL,
      address TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  musician_venues: `
    CREATE TABLE IF NOT EXISTS public.musician_venues (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_uid UUID NOT NULL,
      name TEXT NOT NULL,
      address TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  musician_instruments: `
    CREATE TABLE IF NOT EXISTS public.musician_instruments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_uid UUID NOT NULL,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  shows: `
    CREATE TABLE IF NOT EXISTS public.shows (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      uid UUID NOT NULL,
      venue_name TEXT NOT NULL,
      date_local DATE NOT NULL,
      time_local TEXT NOT NULL,
      fee NUMERIC NOT NULL DEFAULT 0,
      duration_hours NUMERIC DEFAULT 3,
      is_private_event BOOLEAN DEFAULT false,
      team_musician_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
      expenses_team JSONB DEFAULT '[]'::jsonb,
      expenses_other JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  locomotion_expenses: `
    CREATE TABLE IF NOT EXISTS public.locomotion_expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      uid UUID NOT NULL,
      show_id UUID,
      type TEXT NOT NULL,
      cost NUMERIC NOT NULL DEFAULT 0,
      distance_km NUMERIC,
      price_per_liter NUMERIC,
      vehicle_consumption NUMERIC,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  subscriptions: `
    CREATE TABLE IF NOT EXISTS public.subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE,
      plan_type TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_method TEXT,
      payment_platform TEXT DEFAULT 'asaas',
      asaas_customer_id TEXT,
      asaas_subscription_id TEXT,
      apple_product_id TEXT,
      apple_original_transaction_id TEXT,
      next_due_date TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  payment_history: `
    CREATE TABLE IF NOT EXISTS public.payment_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subscription_id UUID NOT NULL,
      user_id UUID NOT NULL,
      amount NUMERIC NOT NULL,
      status TEXT NOT NULL,
      payment_method TEXT,
      asaas_payment_id TEXT,
      payment_date TIMESTAMPTZ NOT NULL,
      due_date TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  referral_codes: `
    CREATE TABLE IF NOT EXISTS public.referral_codes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  referrals: `
    CREATE TABLE IF NOT EXISTS public.referrals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      referrer_id UUID NOT NULL,
      referred_id UUID NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_platform TEXT,
      first_payment_id TEXT,
      referred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      paid_at TIMESTAMPTZ,
      validation_deadline TIMESTAMPTZ,
      validated_at TIMESTAMPTZ,
      extended_trial_granted BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    -- Adicionar coluna se não existir (para bancos já criados)
    ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS extended_trial_granted BOOLEAN DEFAULT false;
  `,
  referral_rewards: `
    CREATE TABLE IF NOT EXISTS public.referral_rewards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      reward_type TEXT NOT NULL DEFAULT 'free_month',
      referrals_count INTEGER NOT NULL DEFAULT 5,
      days_added INTEGER NOT NULL DEFAULT 30,
      original_next_due_date TIMESTAMPTZ,
      granted_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  notifications: `
    CREATE TABLE IF NOT EXISTS public.notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      created_by UUID,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      target_role TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  notification_reads: `
    CREATE TABLE IF NOT EXISTS public.notification_reads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      notification_id UUID NOT NULL,
      user_id UUID NOT NULL,
      read_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  notification_hidden: `
    CREATE TABLE IF NOT EXISTS public.notification_hidden (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      notification_id UUID NOT NULL,
      hidden_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  system_announcements: `
    CREATE TABLE IF NOT EXISTS public.system_announcements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      is_active BOOLEAN NOT NULL DEFAULT true,
      target_role TEXT,
      expires_at TIMESTAMPTZ,
      created_by UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  announcement_dismissed: `
    CREATE TABLE IF NOT EXISTS public.announcement_dismissed (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      announcement_id UUID NOT NULL,
      user_id UUID NOT NULL,
      dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  support_tickets: `
    CREATE TABLE IF NOT EXISTS public.support_tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'medium',
      attachment_url TEXT,
      escalated_to_admin BOOLEAN DEFAULT false,
      escalated_at TIMESTAMPTZ,
      escalated_by UUID,
      escalation_reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  support_responses: `
    CREATE TABLE IF NOT EXISTS public.support_responses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_id UUID NOT NULL,
      user_id UUID NOT NULL,
      message TEXT NOT NULL,
      is_admin BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  user_feedback: `
    CREATE TABLE IF NOT EXISTS public.user_feedback (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      admin_response TEXT,
      reviewed_at TIMESTAMPTZ,
      reviewed_by UUID,
      responded_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  lgpd_requests: `
    CREATE TABLE IF NOT EXISTS public.lgpd_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      user_email TEXT NOT NULL,
      user_name TEXT NOT NULL,
      request_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      description TEXT,
      admin_notes TEXT,
      handled_by UUID,
      handled_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  deleted_users: `
    CREATE TABLE IF NOT EXISTS public.deleted_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      original_user_id UUID NOT NULL,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      cpf TEXT,
      birth_date TEXT,
      photo_url TEXT,
      plan_type TEXT,
      status_plano TEXT,
      timezone TEXT,
      gender TEXT,
      fcm_token TEXT,
      status TEXT NOT NULL DEFAULT 'pending_deletion',
      deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      deleted_by UUID NOT NULL,
      scheduled_permanent_delete_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
      restored_at TIMESTAMPTZ,
      restored_by UUID,
      permanently_deleted_at TIMESTAMPTZ,
      user_roles JSONB DEFAULT '[]'::jsonb,
      artists JSONB DEFAULT '[]'::jsonb,
      musicians JSONB DEFAULT '[]'::jsonb,
      venues JSONB DEFAULT '[]'::jsonb,
      musician_venues JSONB DEFAULT '[]'::jsonb,
      musician_instruments JSONB DEFAULT '[]'::jsonb,
      shows JSONB DEFAULT '[]'::jsonb,
      locomotion_expenses JSONB DEFAULT '[]'::jsonb,
      subscriptions JSONB DEFAULT '[]'::jsonb,
      referral_codes JSONB DEFAULT '[]'::jsonb,
      referrals_as_referrer JSONB DEFAULT '[]'::jsonb,
      referrals_as_referred JSONB DEFAULT '[]'::jsonb,
      support_tickets JSONB DEFAULT '[]'::jsonb,
      support_responses JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  app_updates: `
    CREATE TABLE IF NOT EXISTS public.app_updates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      version TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      is_published BOOLEAN NOT NULL DEFAULT true,
      release_date TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_by UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  otp_codes: `
    CREATE TABLE IF NOT EXISTS public.otp_codes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  fcm_token_history: `
    CREATE TABLE IF NOT EXISTS public.fcm_token_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      device_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      device_name TEXT,
      fcm_token TEXT NOT NULL,
      action TEXT NOT NULL,
      old_token TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `,
  push_notification_logs: `
    CREATE TABLE IF NOT EXISTS public.push_notification_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      notification_id UUID,
      user_id UUID NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL,
      error_message TEXT,
      error_code TEXT,
      device_id TEXT,
      platform TEXT,
      fcm_token_preview TEXT,
      response_data JSONB,
      source TEXT DEFAULT 'manual',
      sent_at TIMESTAMPTZ DEFAULT now()
    );
  `,
  engagement_tip_logs: `
    CREATE TABLE IF NOT EXISTS public.engagement_tip_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      tip_id TEXT NOT NULL,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  marketing_notification_logs: `
    CREATE TABLE IF NOT EXISTS public.marketing_notification_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      notification_type TEXT NOT NULL,
      message_id TEXT NOT NULL,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  show_notification_logs: `
    CREATE TABLE IF NOT EXISTS public.show_notification_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      show_id UUID NOT NULL,
      user_id UUID NOT NULL,
      notification_type TEXT NOT NULL,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  subscription_reminder_logs: `
    CREATE TABLE IF NOT EXISTS public.subscription_reminder_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subscription_id UUID NOT NULL,
      user_id UUID NOT NULL,
      reminder_type TEXT NOT NULL,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
  backup_logs: `
    CREATE TABLE IF NOT EXISTS public.backup_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      tables_copied INTEGER NOT NULL DEFAULT 0,
      records_copied INTEGER NOT NULL DEFAULT 0,
      files_copied INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      duration_seconds NUMERIC,
      error_message TEXT,
      details JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `,
}

// Lista de tabelas em ordem de dependência (sem foreign keys problemáticas)
const TABLES_TO_BACKUP = Object.keys(TABLE_SCHEMAS)

// Buckets de Storage para backup
const STORAGE_BUCKETS = ['profile-photos', 'support-attachments']

// Função para executar SQL raw via REST API do Supabase
async function executeSQL(supabaseUrl: string, serviceRoleKey: string, sql: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({ sql_query: sql }),
    })

    if (!response.ok) {
      // Se a função não existir, tentar via query direta
      const directResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Prefer': 'return=minimal',
        },
        body: sql,
      })
      
      if (!directResponse.ok) {
        return { success: false, error: `HTTP ${response.status}` }
      }
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Função para verificar se tabela existe
async function ensureTableExists(
  backupClient: any,
  tableName: string
): Promise<{ exists: boolean; created: boolean; error?: string }> {
  try {
    // Tentar fazer um select para ver se a tabela existe
    const { error: selectError } = await backupClient
      .from(tableName)
      .select('id')
      .limit(1)

    if (!selectError) {
      return { exists: true, created: false }
    }

    // Se o erro for "relation does not exist", a tabela não existe
    if (selectError.message.includes('does not exist') || 
        selectError.message.includes('schema cache') ||
        selectError.code === '42P01') {
      return { exists: false, created: false, error: selectError.message }
    }

    // Outro tipo de erro
    return { exists: true, created: false }
  } catch (error) {
    return { exists: false, created: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

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

    const tableResults: { table: string; count: number; status: 'success' | 'error' | 'skipped'; error?: string }[] = []
    const schemaResults: { table: string; status: 'exists' | 'created' | 'error'; error?: string }[] = []
    let totalRecords = 0
    const missingTables: string[] = []

    // ===== FASE 0: VERIFICAR E CRIAR TABELAS =====
    console.log('\n🔧 FASE 0: Verificando estrutura das tabelas no backup...')

    for (const table of TABLES_TO_BACKUP) {
      const result = await ensureTableExists(backupClient, table)
      
      if (result.exists) {
        console.log(`  ✅ Tabela ${table} existe`)
        schemaResults.push({ table, status: 'exists' })
      } else {
        console.log(`  ⚠️ Tabela ${table} NÃO existe no backup`)
        missingTables.push(table)
        schemaResults.push({ table, status: 'error', error: result.error })
      }
    }

    // Se houver tabelas faltando, informar e gerar SQL
    if (missingTables.length > 0) {
      console.log(`\n⚠️ ${missingTables.length} tabelas precisam ser criadas no Supabase de backup!`)
      console.log('📋 Execute o seguinte SQL no projeto de backup:\n')
      
      const createSQL = missingTables.map(t => TABLE_SCHEMAS[t]).join('\n')
      console.log(createSQL)
      
      // Continuar com as tabelas que existem
    }

    // ===== FASE 1: BACKUP DE TABELAS =====
    console.log('\n📦 FASE 1: Backup de tabelas...')

    for (const table of TABLES_TO_BACKUP) {
      try {
        // Verificar se a tabela existe no backup
        const tableExistsResult = await ensureTableExists(backupClient, table)
        
        if (!tableExistsResult.exists) {
          console.log(`  ⏭️ Pulando ${table} (não existe no backup)`)
          tableResults.push({ table, count: 0, status: 'skipped', error: 'Tabela não existe no backup' })
          continue
        }

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

    // ===== FASE 3: BACKUP DE USUÁRIOS AUTH =====
    console.log('\n🔐 FASE 3: Backup de usuários auth...')
    
    let authUsersCount = 0
    let authBackupStatus: 'success' | 'error' | 'skipped' = 'skipped'
    let authBackupError: string | null = null

    try {
      // Verificar se a tabela auth_users_backup existe
      const { data: authTableCheck, error: authTableError } = await backupClient
        .from('auth_users_backup')
        .select('id')
        .limit(1)

      if (authTableError && authTableError.code === '42P01') {
        console.log('  ⚠️ Tabela auth_users_backup não existe no backup')
        console.log('  📋 Execute o SQL do backup-schema.sql para criar a tabela')
        authBackupStatus = 'skipped'
        authBackupError = 'Tabela auth_users_backup não existe'
      } else {
        // Usar Admin API para listar todos os usuários
        console.log('  🔍 Buscando usuários do auth.users...')
        
        const allUsers: any[] = []
        let page = 1
        const perPage = 1000
        let hasMore = true

        while (hasMore) {
          const { data: { users }, error } = await prodClient.auth.admin.listUsers({
            page,
            perPage,
          })

          if (error) {
            throw new Error(`Erro ao listar usuários: ${error.message}`)
          }

          if (users && users.length > 0) {
            allUsers.push(...users)
            page++
            hasMore = users.length === perPage
          } else {
            hasMore = false
          }
        }

        console.log(`  📊 Encontrados ${allUsers.length} usuários`)

        if (allUsers.length > 0) {
          // Preparar usuários para backup
          const usersToBackup = allUsers.map((user) => ({
            id: user.id,
            email: user.email,
            encrypted_password: user.encrypted_password || null,
            email_confirmed_at: user.email_confirmed_at || null,
            created_at: user.created_at,
            updated_at: user.updated_at || null,
            raw_app_meta_data: user.app_metadata || null,
            raw_user_meta_data: user.user_metadata || null,
            phone: user.phone || null,
            phone_confirmed_at: user.phone_confirmed_at || null,
            last_sign_in_at: user.last_sign_in_at || null,
            backed_up_at: new Date().toISOString(),
          }))

          // Upsert usuários no backup
          const { error: upsertError } = await backupClient
            .from('auth_users_backup')
            .upsert(usersToBackup, { onConflict: 'id' })

          if (upsertError) {
            throw new Error(`Erro ao salvar usuários: ${upsertError.message}`)
          }

          authUsersCount = usersToBackup.length
          authBackupStatus = 'success'
          console.log(`  ✅ ${authUsersCount} usuários auth salvos no backup`)
        } else {
          authBackupStatus = 'success'
          console.log('  ⚪ Nenhum usuário para backup')
        }
      }
    } catch (authError) {
      const errorMessage = authError instanceof Error ? authError.message : 'Erro desconhecido'
      console.error('  ❌ Erro no backup de auth:', errorMessage)
      authBackupStatus = 'error'
      authBackupError = errorMessage
    }

    // ===== FASE 4: RESUMO E LOG =====
    const endTime = Date.now()
    const durationSeconds = (endTime - startTime) / 1000

    const tableSuccessCount = tableResults.filter(r => r.status === 'success').length
    const tableErrorCount = tableResults.filter(r => r.status === 'error').length
    const tableSkippedCount = tableResults.filter(r => r.status === 'skipped').length
    const fileSuccessCount = fileResults.filter(r => r.status === 'success').length
    const fileErrorCount = fileResults.filter(r => r.status === 'error').length

    const hasErrors = tableErrorCount > 0 || fileErrorCount > 0 || authBackupStatus === 'error'
    const hasMissingTables = missingTables.length > 0
    const finalStatus = hasErrors || hasMissingTables ? 'partial' : 'success'

    const summary = {
      timestamp: new Date().toISOString(),
      duration_seconds: durationSeconds,
      tables: {
        total: TABLES_TO_BACKUP.length,
        success: tableSuccessCount,
        errors: tableErrorCount,
        skipped: tableSkippedCount,
        records_copied: totalRecords,
      },
      storage: {
        buckets: STORAGE_BUCKETS.length,
        files_copied: totalFiles,
        errors: fileErrorCount,
      },
      auth_users: {
        count: authUsersCount,
        status: authBackupStatus,
        error: authBackupError,
      },
      missing_tables: missingTables,
      missing_tables_sql: missingTables.length > 0 
        ? missingTables.map(t => TABLE_SCHEMAS[t]).join('\n')
        : null,
      status: finalStatus,
      table_details: tableResults,
      file_details: fileResults,
      schema_check: schemaResults,
    }

    console.log('\n📊 RESUMO DO BACKUP:')
    console.log(`   - Tabelas: ${tableSuccessCount}/${TABLES_TO_BACKUP.length} com sucesso`)
    console.log(`   - Tabelas puladas: ${tableSkippedCount}`)
    console.log(`   - Registros copiados: ${totalRecords}`)
    console.log(`   - Arquivos copiados: ${totalFiles}`)
    console.log(`   - Usuários auth: ${authUsersCount} (${authBackupStatus})`)
    console.log(`   - Duração: ${durationSeconds.toFixed(2)}s`)
    console.log(`   - Status: ${finalStatus}`)

    if (missingTables.length > 0) {
      console.log(`\n⚠️ AÇÃO NECESSÁRIA: ${missingTables.length} tabelas precisam ser criadas no backup!`)
      console.log('   Execute o SQL retornado no campo "missing_tables_sql" no Supabase de backup.')
    }

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
          error_message: hasErrors 
            ? `${tableErrorCount} erros em tabelas, ${fileErrorCount} erros em arquivos` 
            : hasMissingTables 
              ? `${missingTables.length} tabelas faltando no backup` 
              : null,
        })
        .eq('id', logId)
    }

    // Se houver erros ou tabelas faltando, notificar admins
    if (hasErrors || hasMissingTables) {
      console.log('\n⚠️ Enviando notificação para admins...')
      
      try {
        // Buscar admins
        const { data: admins } = await prodClient
          .from('admin_users')
          .select('user_id')

        if (admins && admins.length > 0) {
          const message = hasMissingTables 
            ? `O backup precisa de configuração: ${missingTables.length} tabelas não existem no Supabase de backup. Verifique os logs.`
            : `O backup automático teve ${tableErrorCount + fileErrorCount} erros. Verifique os logs.`

          // Criar notificação para cada admin
          for (const admin of admins) {
            await prodClient
              .from('notifications')
              .insert({
                user_id: admin.user_id,
                title: hasMissingTables ? '🔧 Backup precisa de configuração' : '⚠️ Backup com erros',
                message,
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
        status: hasErrors || hasMissingTables ? 207 : 200
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
