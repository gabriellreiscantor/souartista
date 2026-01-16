# 🔐 Template de Secrets - SouArtista

Este documento lista todas as secrets que precisam ser configuradas manualmente no Supabase de backup para garantir recuperação completa em caso de desastre.

> ⚠️ **IMPORTANTE**: NÃO salve os valores das secrets neste arquivo! Use um gerenciador de senhas seguro (1Password, Bitwarden, etc).

---

## 📋 Secrets Externas (10 total)

### 1. ASAAS_API_KEY
- **Descrição**: Chave de API do gateway de pagamentos Asaas
- **Onde obter**: https://app.asaas.com → Integrações → API → Chave de API
- **Formato**: `$aact_...` (começa com $aact_)
- **Usado em**: `create-asaas-subscription`, `cancel-subscription`, `check-payment-status`, `sync-asaas-payments`

### 2. ASAAS_WEBHOOK_TOKEN
- **Descrição**: Token de autenticação para webhooks do Asaas
- **Onde obter**: Token que VOCÊ definiu ao configurar o webhook no Asaas
- **Formato**: String alfanumérica (você escolhe)
- **Usado em**: `asaas-webhook`

### 3. FIREBASE_SERVER_KEY
- **Descrição**: Chave do servidor Firebase Cloud Messaging (FCM) para push notifications
- **Onde obter**: Firebase Console → Configurações do Projeto → Cloud Messaging → Chave do servidor
- **Formato**: String longa começando com caracteres alfanuméricos
- **Usado em**: `send-push-notification`, `_shared/fcm-sender.ts`
- **Nota**: Esta é a chave legada. Para novos projetos, use FIREBASE_SERVICE_ACCOUNT

### 4. FIREBASE_SERVICE_ACCOUNT
- **Descrição**: JSON completo da conta de serviço do Firebase
- **Onde obter**: Firebase Console → Configurações do Projeto → Contas de Serviço → Gerar nova chave privada
- **Formato**: JSON completo (stringificado)
- **Usado em**: `send-push-notification` (FCM v1 API)

### 5. RESEND_API_KEY
- **Descrição**: Chave de API do Resend para envio de emails
- **Onde obter**: https://resend.com/api-keys → Create API Key
- **Formato**: `re_...` (começa com re_)
- **Usado em**: `send-report-email`

### 6. BREVO_API_KEY
- **Descrição**: Chave de API do Brevo (ex-Sendinblue) para emails transacionais
- **Onde obter**: https://app.brevo.com → SMTP & API → API Keys
- **Formato**: `xkeysib-...` (começa com xkeysib-)
- **Usado em**: `send-otp-email`

### 7. REVENUECAT_API_KEY
- **Descrição**: Chave de API do RevenueCat para gerenciamento de assinaturas iOS
- **Onde obter**: RevenueCat Dashboard → Project Settings → API Keys → Secret API Key
- **Formato**: `sk_...` (começa com sk_)
- **Usado em**: `verify-apple-receipt`, `sync-revenuecat-subscriptions`, `get-revenuecat-subscriber`

### 8. REVENUECAT_WEBHOOK_AUTH_KEY
- **Descrição**: Token de autenticação para webhooks do RevenueCat
- **Onde obter**: Token que VOCÊ definiu ao configurar o webhook no RevenueCat
- **Formato**: String alfanumérica (você escolhe)
- **Usado em**: `apple-subscription-webhook`

### 9. BACKUP_SUPABASE_URL
- **Descrição**: URL do projeto Supabase de backup
- **Onde obter**: Supabase Dashboard (backup) → Settings → API → Project URL
- **Formato**: `https://[project-id].supabase.co`
- **Usado em**: `database-backup`, `backup-auth-users`

### 10. BACKUP_SUPABASE_SERVICE_ROLE_KEY
- **Descrição**: Service Role Key do projeto Supabase de backup
- **Onde obter**: Supabase Dashboard (backup) → Settings → API → service_role (secret)
- **Formato**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (JWT longo)
- **Usado em**: `database-backup`, `backup-auth-users`

---

## ✅ Secrets Automáticas (não precisam backup manual)

Estas são gerenciadas automaticamente pelo Lovable/Supabase:

| Secret | Descrição |
|--------|-----------|
| `SUPABASE_URL` | URL do projeto principal |
| `SUPABASE_ANON_KEY` | Chave anônima do projeto |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role do projeto principal |
| `SUPABASE_DB_URL` | URL de conexão direta ao banco |
| `LOVABLE_API_KEY` | Chave da API Lovable AI |

---

## 🔄 Como Espelhar no Supabase de Backup

### Passo 1: Acessar o Supabase de Backup
1. Vá para https://supabase.com/dashboard
2. Selecione o projeto de backup

### Passo 2: Navegar para Secrets
1. Vá em **Settings** (ícone de engrenagem)
2. Clique em **Edge Functions**
3. Role até **Secrets**

### Passo 3: Adicionar cada Secret
Para cada uma das 10 secrets acima:
1. Clique em **Add new secret**
2. Digite o nome EXATAMENTE como listado acima
3. Cole o valor
4. Clique em **Save**

### Passo 4: Verificar
Execute a edge function `verify-backup-secrets` para confirmar que todas estão configuradas.

---

## 📅 Manutenção

- **Quando atualizar**: Sempre que regenerar qualquer chave de API
- **Frequência recomendada**: Verificar mensalmente
- **Rotação de chaves**: Ao rotacionar uma chave, atualize em AMBOS os Supabase (principal e backup)

---

## 🚨 Em Caso de Emergência

Se precisar usar o backup:

1. ✅ Dados já estão sincronizados (backup diário)
2. ✅ Auth users já estão sincronizados (backup diário)
3. ✅ Storage files já estão copiados (backup diário)
4. ✅ Secrets estão espelhadas (se você seguiu este guia)
5. 📝 Atualize os webhooks nos serviços externos para apontar para o novo Supabase

### Webhooks para atualizar:
- **Asaas**: https://app.asaas.com → Integrações → Webhooks
- **RevenueCat**: RevenueCat Dashboard → Integrations → Webhooks
