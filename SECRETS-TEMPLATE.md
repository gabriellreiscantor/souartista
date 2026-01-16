# 🔐 Template de Secrets - SouArtista

> **DOCUMENTO CRÍTICO**: Lista de todas as secrets que precisam ser configuradas no Supabase de backup.
> 
> ⚠️ **IMPORTANTE**: NÃO salve os valores das secrets neste arquivo! Use um gerenciador de senhas seguro (1Password, Bitwarden, etc).

---

## 🚨 AÇÃO NECESSÁRIA AGORA

**Para estar preparado para emergências, você DEVE copiar as 7 secrets externas para o Supabase de backup ANTES de uma emergência acontecer.**

### Onde adicionar:
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto de **backup**
3. Vá em: **Settings** → **Edge Functions** → **Secrets**
4. Adicione cada secret listada abaixo

---

## 📊 RESUMO RÁPIDO

| Tipo | Quantidade | Ação |
|------|------------|------|
| API Keys (mesmo valor) | 5 | Copiar do serviço original |
| Webhook Tokens (você define) | 2 | Usar o mesmo valor que definiu |
| Backup Connection | 2 | NÃO copiar para backup (são auto-referência) |
| **Total a copiar** | **7** | |

---

## 📋 SECRETS PARA COPIAR (7 total)

### 🔑 TIPO 1: API Keys (usar MESMO valor - 5 secrets)

Essas chaves são obtidas dos serviços externos. Use os mesmos valores que já estão no Lovable Cloud.

#### 1. ASAAS_API_KEY
- **Descrição**: Chave de API do gateway de pagamentos Asaas
- **Onde obter**: https://app.asaas.com → Integrações → API → Chave de API
- **Formato**: `$aact_...` (começa com $aact_)
- **Usado em**: `create-asaas-subscription`, `cancel-subscription`, `check-payment-status`, `sync-asaas-payments`

#### 2. FIREBASE_SERVICE_ACCOUNT
- **Descrição**: JSON completo da conta de serviço do Firebase para push notifications (FCM v1 API)
- **Onde obter**: Firebase Console → Configurações do Projeto → Contas de Serviço → Gerar nova chave privada
- **Formato**: JSON completo (o conteúdo inteiro do arquivo .json baixado)
- **Usado em**: `send-push-notification` (via `_shared/fcm-sender.ts`)
- **⚠️ IMPORTANTE**: A antiga `FIREBASE_SERVER_KEY` foi descontinuada. Use apenas `FIREBASE_SERVICE_ACCOUNT`

#### 3. RESEND_API_KEY
- **Descrição**: Chave de API do Resend para envio de emails
- **Onde obter**: https://resend.com/api-keys → Create API Key
- **Formato**: `re_...` (começa com re_)
- **Usado em**: `send-report-email`

#### 4. BREVO_API_KEY
- **Descrição**: Chave de API do Brevo (ex-Sendinblue) para emails transacionais
- **Onde obter**: https://app.brevo.com → SMTP & API → API Keys
- **Formato**: `xkeysib-...` (começa com xkeysib-)
- **Usado em**: `send-otp-email`

#### 5. REVENUECAT_API_KEY
- **Descrição**: Chave de API do RevenueCat para gerenciamento de assinaturas iOS
- **Onde obter**: RevenueCat Dashboard → Project Settings → API Keys → Secret API Key
- **Formato**: `sk_...` (começa com sk_)
- **Usado em**: `verify-apple-receipt`, `sync-revenuecat-subscriptions`, `get-revenuecat-subscriber`

---

### 🎟️ TIPO 2: Webhook Tokens (você define - 2 secrets)

Esses tokens são **definidos por você**. Use os mesmos valores que você configurou no Lovable Cloud.

#### 6. ASAAS_WEBHOOK_TOKEN
- **Descrição**: Token de autenticação para webhooks do Asaas
- **Onde obter**: Token que VOCÊ definiu ao configurar o webhook no Asaas
- **Formato**: String alfanumérica (você escolhe)
- **Usado em**: `asaas-webhook`
- **⚠️ IMPORTANTE**: Este é um valor que você criou, não vem do Asaas

#### 7. REVENUECAT_WEBHOOK_AUTH_KEY
- **Descrição**: Token de autenticação para webhooks do RevenueCat
- **Onde obter**: Token que VOCÊ definiu ao configurar o webhook no RevenueCat
- **Formato**: String alfanumérica (você escolhe)
- **Usado em**: `apple-subscription-webhook`
- **⚠️ IMPORTANTE**: Este é um valor que você criou, não vem do RevenueCat

---

## ❌ NÃO COPIAR PARA BACKUP (2 secrets)

Estas secrets são referências ao próprio backup, então não fazem sentido no contexto de backup:

| Secret | Motivo |
|--------|--------|
| `BACKUP_SUPABASE_URL` | Seria auto-referência |
| `BACKUP_SUPABASE_SERVICE_ROLE_KEY` | Seria auto-referência |

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
Para cada uma das **7 secrets** listadas acima:
1. Clique em **Add new secret**
2. Digite o nome EXATAMENTE como listado
3. Cole o valor (obtido do seu gerenciador de senhas)
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
