# 🚨 DISASTER RECOVERY COMPLETO - SOU ARTISTA

> **DOCUMENTO CRÍTICO**: Guia completo para recuperação do sistema em caso de falha catastrófica.
> 
> **Última atualização**: Janeiro 2026
> **Tempo estimado de recuperação**: ~90 minutos (full restore)

---

## 📋 ÍNDICE

1. [Visão Geral e Cenários](#1-visão-geral-e-cenários)
2. [Inventário de Acessos](#2-inventário-de-acessos-necessários)
3. [Fase 1: Verificação Inicial](#3-fase-1-verificação-inicial-5-min)
4. [Fase 2: Baixar Código do GitHub](#4-fase-2-baixar-código-do-github-10-min)
5. [Fase 3: Configurar Ambiente Local](#5-fase-3-configurar-ambiente-local-com-cursor-20-min)
6. [Fase 4: Conectar Supabase de Backup](#6-fase-4-conectar-ao-supabase-de-backup-15-min)
7. [Fase 5: Configurar Secrets](#7-fase-5-configurar-secrets-10-min)
8. [Fase 6: Deploy Edge Functions](#8-fase-6-deploy-das-edge-functions-15-min)
9. [Fase 7: Testar Localmente](#9-fase-7-testar-localmente-10-min)
10. [Deploy Web (Vercel)](#10-deploy-web-via-vercel)
11. [Deploy iOS (Codemagic)](#11-deploy-ios-via-codemagic)
12. [Deploy Android (Codemagic)](#12-deploy-android-via-codemagic)
13. [Atualizar Webhooks](#13-atualizar-webhooks-externos)
14. [Checklist Final](#14-checklist-final)
15. [FAQ](#15-perguntas-frequentes-faq)
16. [Contatos de Emergência](#16-contatos-de-emergência)

---

## 1. VISÃO GERAL E CENÁRIOS

### Cenário 1: Lovable fora do ar (temporário)
**Impacto**: Não consegue editar código via Lovable
**Solução**: Use Cursor/VSCode com o código do GitHub. O app continua funcionando.

### Cenário 2: Lovable fechou permanentemente
**Impacto**: Plataforma não existe mais
**Solução**: Migrar completamente para desenvolvimento local + deploy manual

### Cenário 3: Supabase principal corrompido/deletado
**Impacto**: Banco de dados perdido
**Solução**: Restaurar do backup diário (máximo 24h de perda)

### Cenário 4: Perdi acesso a tudo
**Impacto**: Não tenho acesso às credenciais
**Solução**: Seguir recuperação de conta em cada serviço

---

## 2. INVENTÁRIO DE ACESSOS NECESSÁRIOS

### 🔐 GUARDE ESTAS CREDENCIAIS EM LOCAL SEGURO (1Password, Bitwarden, etc.)

| Serviço | URL | O que é | Credenciais necessárias |
|---------|-----|---------|------------------------|
| **GitHub** | github.com | Código fonte completo | Email + Senha + 2FA |
| **Supabase Produção** | Via Lovable Cloud | Banco principal | Gerenciado pelo Lovable |
| **Supabase Backup** | supabase.com | Banco de backup | Email + Senha |
| **Codemagic** | codemagic.io | Build iOS/Android | Email + Senha |
| **Firebase** | console.firebase.google.com | Push Notifications | Google Account |
| **Asaas** | asaas.com | Pagamentos BR | Email + Senha |
| **Resend** | resend.com | Envio de emails | Email + Senha |
| **Apple Developer** | developer.apple.com | Deploy iOS | Apple ID + 2FA |
| **Google Play Console** | play.google.com/console | Deploy Android | Google Account |
| **Vercel** | vercel.com | Hosting Web | GitHub login |
| **RevenueCat** | revenuecat.com | Pagamentos iOS | Email + Senha |

### 🔑 SECRETS CRÍTICOS (valores que você precisa ter salvos)

```
ASAAS_API_KEY=sua_chave_api_asaas
ASAAS_WEBHOOK_TOKEN=seu_token_webhook
BACKUP_SUPABASE_URL=https://seu-projeto-backup.supabase.co
BACKUP_SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_backup
BREVO_API_KEY=sua_chave_brevo
FIREBASE_SERVER_KEY=sua_chave_firebase (legado)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
RESEND_API_KEY=re_xxxxx
REVENUECAT_API_KEY=sua_chave_revenuecat
REVENUECAT_WEBHOOK_AUTH_KEY=seu_token_webhook
LOVABLE_API_KEY=chave_para_ia (se aplicável)
```

---

## 3. FASE 1: VERIFICAÇÃO INICIAL (5 min)

### O que verificar primeiro:

1. **App Web funciona?**
   ```
   Acesse: https://souartista.app (ou seu domínio)
   Se funciona → Problema é só no Lovable, app está online
   ```

2. **App Mobile funciona?**
   - Abra o app no celular
   - Tente fazer login
   - Se funciona → Backend está OK

3. **Supabase responde?**
   ```
   Acesse: https://wjutvzmnvemrplpwbkyf.supabase.co/rest/v1/profiles?limit=1
   Se retorna JSON → Supabase OK
   ```

4. **GitHub está acessível?**
   ```
   Acesse seu repositório: github.com/seu-usuario/souartista
   Se abre → Código seguro
   ```

### Diagnóstico:

| Situação | App Web | App Mobile | Supabase | Ação |
|----------|---------|------------|----------|------|
| Lovable down | ✅ | ✅ | ✅ | Aguardar ou usar Cursor |
| Supabase down | ❌ | ❌ | ❌ | Restaurar do backup |
| Problema no código | ❌ | ❌ | ✅ | Corrigir via GitHub |

---

## 4. FASE 2: BAIXAR CÓDIGO DO GITHUB (10 min)

### Passo 1: Instalar Git
```bash
# Mac
brew install git

# Windows
# Baixe de: https://git-scm.com/download/win

# Linux
sudo apt install git
```

### Passo 2: Clonar repositório
```bash
# No terminal, navegue para onde quer salvar
cd ~/projetos

# Clone o repositório
git clone https://github.com/SEU_USUARIO/souartista.git

# Entre na pasta
cd souartista
```

### Passo 3: Verificar estrutura
```
souartista/
├── src/                    # Código React
│   ├── components/         # Componentes reutilizáveis
│   ├── pages/              # Páginas da aplicação
│   ├── hooks/              # Hooks customizados
│   └── integrations/       # Integrações (Supabase)
├── supabase/
│   ├── functions/          # Edge Functions (32 funções)
│   └── config.toml         # Configuração
├── android/                # Código Android
├── ios/                    # Código iOS
├── backup-schema.sql       # SQL para criar tabelas
├── disaster-recovery.md    # Guia resumido
└── DISASTER-RECOVERY-COMPLETO.md  # Este arquivo
```

---

## 5. FASE 3: CONFIGURAR AMBIENTE LOCAL COM CURSOR (20 min)

### Passo 1: Instalar Node.js 20
```bash
# Mac (via Homebrew)
brew install node@20

# Ou baixe de: https://nodejs.org/en/download/
# Escolha a versão LTS (20.x)
```

### Passo 2: Instalar Cursor IDE
```
1. Acesse: https://cursor.com
2. Baixe e instale
3. Cursor é como VSCode, mas com IA integrada
```

### Passo 3: Abrir projeto
```
1. Abra Cursor
2. File > Open Folder
3. Selecione a pasta "souartista"
```

### Passo 4: Instalar dependências
```bash
# No terminal do Cursor (Ctrl+` ou Cmd+`)
npm install
```

### Passo 5: Criar arquivo .env
Crie o arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_anon_key_aqui
VITE_SUPABASE_PROJECT_ID=seu_project_id
```

### Passo 6: Testar localmente
```bash
npm run dev
```
Acesse: http://localhost:5173

---

## 6. FASE 4: CONECTAR AO SUPABASE DE BACKUP (15 min)

### Se o Supabase principal está perdido:

### Passo 1: Criar novo projeto Supabase
```
1. Acesse: https://supabase.com
2. Faça login
3. "New Project"
4. Nome: souartista-recovery
5. Região: South America (São Paulo)
6. Senha do banco: ANOTE E GUARDE
7. Aguarde criação (~2 min)
```

### Passo 2: Obter credenciais
```
No dashboard do projeto:
1. Settings > API
2. Copie:
   - Project URL (ex: https://xxxxx.supabase.co)
   - anon public key
   - service_role key (SECRETO!)
```

### Passo 3: Executar SQL de criação de tabelas
```
1. No Supabase, vá em SQL Editor
2. Cole o conteúdo do arquivo: backup-schema.sql
3. Execute (Run)
```

### Passo 4: Restaurar dados do backup

Se você tem acesso ao Supabase de backup:

```sql
-- No Supabase de produção novo, execute:
-- (conecte via psql ou SQL Editor)

-- Os dados já estão no backup, você precisa exportar de lá e importar aqui
-- Use pg_dump/pg_restore ou exporte via CSV
```

### Passo 5: Restaurar usuários de autenticação
```sql
-- Os usuários estão na tabela auth_users_backup
-- Você precisa recriar no auth.users

-- Consulte auth_users_backup para ver os usuários:
SELECT id, email, encrypted_password, created_at FROM auth_users_backup;

-- Para cada usuário, você pode:
-- 1. Pedir que refaçam cadastro (mais simples)
-- 2. Usar Admin API para recriar (mais complexo)
```

### Passo 6: Atualizar .env
```env
VITE_SUPABASE_URL=https://NOVO-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=nova_anon_key
VITE_SUPABASE_PROJECT_ID=novo_project_id
```

---

## 7. FASE 5: CONFIGURAR SECRETS (10 min)

### No Supabase Dashboard:

```
1. Project Settings > Edge Functions
2. Para cada secret, clique "Add secret"
```

### Secrets obrigatórios:

| Secret | Descrição | Onde obter |
|--------|-----------|------------|
| `ASAAS_API_KEY` | API do Asaas | asaas.com > Configurações > API |
| `ASAAS_WEBHOOK_TOKEN` | Token webhook | Você define e configura no Asaas |
| `BACKUP_SUPABASE_URL` | URL do backup | Seu projeto de backup |
| `BACKUP_SUPABASE_SERVICE_ROLE_KEY` | Key do backup | Settings > API no backup |
| `FIREBASE_SERVICE_ACCOUNT` | JSON completo | Firebase Console > Project Settings > Service Accounts |
| `RESEND_API_KEY` | API do Resend | resend.com > API Keys |
| `REVENUECAT_API_KEY` | API RevenueCat | RevenueCat Dashboard |
| `REVENUECAT_WEBHOOK_AUTH_KEY` | Webhook auth | Você define |

---

## 8. FASE 6: DEPLOY DAS EDGE FUNCTIONS (15 min)

### Passo 1: Instalar Supabase CLI
```bash
# Mac
brew install supabase/tap/supabase

# Windows (via npm)
npm install -g supabase

# Linux
curl -fsSL https://supabase.com/install.sh | sh
```

### Passo 2: Login
```bash
supabase login
# Abrirá navegador para autenticar
```

### Passo 3: Vincular projeto
```bash
supabase link --project-ref SEU_PROJECT_ID
# Informe a senha do banco quando pedir
```

### Passo 4: Deploy de todas as funções
```bash
supabase functions deploy
```

### Lista das 32 Edge Functions:
```
apple-subscription-webhook
asaas-webhook
backup-auth-users
cancel-subscription
check-expired-subscriptions
check-payment-status
check-pix-notifications
check-show-reminders
cleanup-deleted-users
create-asaas-subscription
create-notification
create-support-user
database-backup
delete-account
get-pending-payment
import-firebase-shows
improve-text
seed-test-account
send-engagement-tips
send-marketing-notifications
send-otp-email
send-push-notification
send-referral-notification
send-report-email
send-subscription-reminders
support-manage-user
sync-asaas-payments
test-push-notification
validate-referrals
verify-apple-receipt
verify-otp
```

---

## 9. FASE 7: TESTAR LOCALMENTE (10 min)

### Checklist de testes:

```bash
# 1. Iniciar servidor
npm run dev
```

```
# 2. Testar no navegador

[ ] Login funciona
[ ] Cadastro funciona
[ ] Dashboard carrega
[ ] Criar show funciona
[ ] Ver relatórios funciona
```

### Se algo falhar:

1. **Erro de CORS**: Verifique se as Edge Functions têm os headers corretos
2. **Erro de autenticação**: Verifique ANON_KEY no .env
3. **Erro de RLS**: Verifique se as policies estão criadas (backup-schema.sql)

---

## 10. DEPLOY WEB VIA VERCEL

### Passo 1: Conectar repositório
```
1. Acesse: vercel.com
2. Login com GitHub
3. "Add New Project"
4. Importe o repositório souartista
```

### Passo 2: Configurar variáveis
```
Em Settings > Environment Variables, adicione:

VITE_SUPABASE_URL = https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY = sua_anon_key
VITE_SUPABASE_PROJECT_ID = seu_project_id
```

### Passo 3: Deploy
```
1. Clique "Deploy"
2. Aguarde build (~2 min)
3. Acesse URL gerada
```

### Passo 4: Configurar domínio customizado
```
1. Settings > Domains
2. Adicione: souartista.app (ou seu domínio)
3. Configure DNS conforme instruções
```

---

## 11. DEPLOY iOS VIA CODEMAGIC

### Pré-requisitos:
- Conta Apple Developer ($99/ano)
- Certificados de distribuição
- Provisioning profiles

### Passo 1: Acessar Codemagic
```
1. Acesse: codemagic.io
2. Faça login
3. Encontre o projeto souartista
```

### Passo 2: Atualizar variáveis de ambiente
```
No Codemagic, em Environment Variables:

VITE_SUPABASE_URL = nova_url
VITE_SUPABASE_PUBLISHABLE_KEY = nova_key
```

### Passo 3: Verificar certificados
```
Em Code Signing > iOS:
- Distribution Certificate
- Provisioning Profile (App Store)
- Verifique se não expiraram
```

### Passo 4: Iniciar build
```
1. Clique "Start new build"
2. Selecione workflow: "ios-release" (ou similar)
3. Branch: main
4. Start
```

### Passo 5: Publicar na App Store
```
1. Após build, baixe o .ipa
2. Use Transporter (Mac) para enviar
3. No App Store Connect, configure a versão
4. Envie para revisão
```

---

## 12. DEPLOY ANDROID VIA CODEMAGIC

### Pré-requisitos:
- Conta Google Play Console ($25 única vez)
- Keystore assinado
- google-services.json

### Passo 1: Verificar keystore
```
O keystore está em:
resources/souartista_keystore.jks (ou similar)

Você precisa:
- Alias
- Senha do keystore
- Senha da key
```

### Passo 2: Atualizar variáveis
```
No Codemagic:

FCI_KEYSTORE = (base64 do keystore)
FCI_KEYSTORE_PASSWORD = senha
FCI_KEY_ALIAS = alias
FCI_KEY_PASSWORD = senha_key
```

### Passo 3: Iniciar build
```
1. "Start new build"
2. Workflow: "android-release"
3. Start
```

### Passo 4: Publicar no Google Play
```
1. Após build, baixe o .aab
2. No Google Play Console:
   - Production > Create new release
   - Upload .aab
   - Preencha notas de versão
   - Envie para revisão
```

---

## 13. ATUALIZAR WEBHOOKS EXTERNOS

### Asaas (Pagamentos)

```
1. Acesse: asaas.com
2. Configurações > Integrações > Webhooks
3. Atualize URL para:
   https://NOVO-PROJETO.supabase.co/functions/v1/asaas-webhook
```

### RevenueCat (iOS Payments)

```
1. Acesse: revenuecat.com
2. Project Settings > Integrations > Webhooks
3. Atualize URL para:
   https://NOVO-PROJETO.supabase.co/functions/v1/apple-subscription-webhook
```

### Firebase (Push Notifications)

```
1. Firebase Console > Project Settings
2. Cloud Messaging
3. Verifique se a Server Key está correta
4. Em Service Accounts, gere nova chave se necessário
```

---

## 14. CHECKLIST FINAL

### Infraestrutura
- [ ] Código baixado do GitHub
- [ ] Cursor/VSCode configurado
- [ ] Node.js 20 instalado
- [ ] npm install executado

### Supabase
- [ ] Novo projeto criado (se necessário)
- [ ] backup-schema.sql executado
- [ ] Dados restaurados do backup
- [ ] Usuários auth recriados
- [ ] RLS policies ativas
- [ ] Realtime habilitado para tabelas necessárias

### Secrets
- [ ] ASAAS_API_KEY configurado
- [ ] FIREBASE_SERVICE_ACCOUNT configurado
- [ ] RESEND_API_KEY configurado
- [ ] REVENUECAT_API_KEY configurado
- [ ] BACKUP_SUPABASE_URL configurado
- [ ] BACKUP_SUPABASE_SERVICE_ROLE_KEY configurado

### Edge Functions
- [ ] Supabase CLI instalado
- [ ] Login efetuado
- [ ] Projeto vinculado
- [ ] Todas as 32 funções deployed

### Testes
- [ ] App local funciona
- [ ] Login funciona
- [ ] Criar show funciona
- [ ] Notificações funcionam

### Deploys
- [ ] Web deploy no Vercel
- [ ] Domínio configurado
- [ ] iOS build no Codemagic
- [ ] App submetido na App Store
- [ ] Android build no Codemagic
- [ ] App submetido no Google Play

### Webhooks
- [ ] Asaas webhook atualizado
- [ ] RevenueCat webhook atualizado
- [ ] Firebase verificado

### Comunicação
- [ ] Usuários notificados (se houve downtime)
- [ ] Equipe informada

---

## 15. PERGUNTAS FREQUENTES (FAQ)

### "E se eu perder o backup-schema.sql?"
O arquivo está no repositório GitHub: `backup-schema.sql`

### "Como sei as senhas dos secrets?"
**VOCÊ PRECISA TER GUARDADO ANTES!** Use um gerenciador de senhas.
Se perdeu, terá que gerar novas chaves em cada serviço.

### "Os usuários vão perder a conta?"
Com o backup do auth.users, as senhas (hash) são preservadas.
Se restaurar corretamente, os usuários mantêm acesso.

### "Quanto tempo de dados posso perder?"
O backup roda diariamente às 3h AM.
Máximo de perda: 24 horas de dados.

### "Posso rodar backup mais frequente?"
Sim, no Supabase Dashboard:
- Database > Backups > Point-in-time Recovery
- Ou configure cron job mais frequente para a edge function

### "O app funciona offline?"
Não totalmente. Requer conexão com Supabase para:
- Login/autenticação
- Salvar/carregar dados
- Notificações

### "Como atualizo o app nas lojas?"
Via Codemagic:
1. Faça as alterações no código
2. Push para GitHub
3. Codemagic detecta e faz build
4. Baixe o artefato
5. Suba para App Store Connect / Google Play Console

### "Preciso manter o Lovable?"
Não obrigatoriamente. Com este guia você pode:
- Desenvolver localmente (Cursor/VSCode)
- Fazer deploy manual
- Não depender do Lovable

---

## 16. CONTATOS DE EMERGÊNCIA

### Suporte Técnico

| Serviço | Contato | Resposta |
|---------|---------|----------|
| Supabase | support@supabase.io | 24-48h |
| Codemagic | support@codemagic.io | 24h |
| Vercel | vercel.com/help | 24h |
| Firebase | firebase.google.com/support | 48h |

### Apple Developer
- Portal: developer.apple.com/contact
- Tel: 0800 761 0880 (Brasil)

### Google Play
- Portal: support.google.com/googleplay/android-developer
- Help Center online

### Asaas
- Email: suporte@asaas.com
- Chat no dashboard

### Resend
- Email: support@resend.com

---

## 17. CONTEXTO PARA NOVA IA LOVABLE

Esta seção permite que uma nova instância da IA do Lovable (em outra conta) entenda completamente o projeto e continue o desenvolvimento.

### 17.1 Prompt Inicial para Nova IA

**Cole este texto na primeira conversa com a nova IA:**

```
Olá! Este é o projeto SouArtista, um app de gestão financeira para artistas e músicos brasileiros.

=== CONTEXTO TÉCNICO ===
- Frontend: React 18 + TypeScript + Vite
- Mobile: Capacitor (iOS/Android nativo)
- UI: shadcn/ui + Tailwind CSS
- Backend: Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- Pagamentos: Asaas (PIX/Cartão BR) + RevenueCat/Apple IAP (iOS)
- Notificações Push: Firebase Cloud Messaging
- Emails: Resend
- IA: OpenAI (melhoria de textos)

=== PAPÉIS DE USUÁRIO ===
1. ARTISTA (role: "artist"):
   - Cadastra e gerencia shows
   - Adiciona músicos à equipe
   - Cadastra locais (venues)
   - Controla finanças (cachês, despesas)
   - Gera relatórios

2. MÚSICO (role: "musician"):
   - Visualiza shows onde foi escalado
   - Controla suas finanças pessoais
   - Vê artistas com quem trabalha

3. SUPORTE (role: "support"):
   - Gerencia tickets de usuários
   - Acesso limitado ao sistema

4. ADMIN:
   - Acesso total via admin_users table
   - Painel em /admin

=== FLUXO DE AUTENTICAÇÃO ===
1. Landing (/) → Register (/register)
2. Verificação de email via OTP (/verify-email)
3. Completar perfil com CPF (/complete-profile)
4. Escolher papel: Artista ou Músico (/select-role)
5. Assinar plano (/subscribe) - Trial 7 dias, depois R$14,90/mês
6. Dashboard (/{role}/dashboard)

=== ESTRUTURA DE PASTAS ===
- src/pages/artist/ → Páginas do artista
- src/pages/musician/ → Páginas do músico
- src/pages/demo/ → Versão demo (sem login)
- src/components/ → Componentes reutilizáveis
- src/hooks/ → Hooks customizados
- supabase/functions/ → 32 Edge Functions

=== EDGE FUNCTIONS PRINCIPAIS ===
Pagamentos:
- asaas-webhook: Recebe webhooks do Asaas
- create-asaas-subscription: Cria assinatura
- check-payment-status: Verifica pagamento PIX
- cancel-subscription: Cancela assinatura
- apple-subscription-webhook: Webhooks Apple
- verify-apple-receipt: Valida compra iOS

Notificações:
- send-push-notification: Envia push via FCM
- check-show-reminders: Lembretes de shows
- send-subscription-reminders: Avisos de vencimento
- send-engagement-tips: Dicas de engajamento

Backup:
- database-backup: Backup diário às 6h (Brasília)
- backup-auth-users: Backup dos auth.users

Auth:
- send-otp-email: Envia código verificação
- verify-otp: Valida código OTP

=== BANCO DE DADOS (35 tabelas) ===
Principais:
- profiles: Dados do usuário (extensão de auth.users)
- shows: Shows cadastrados
- artists: Artistas criados pelo usuário
- musicians: Músicos da equipe
- venues: Locais de shows
- subscriptions: Assinaturas e status
- payment_history: Histórico de pagamentos
- notifications: Notificações do sistema
- support_tickets: Tickets de suporte
- backup_logs: Logs de backup

=== PADRÕES DE CÓDIGO ===
- Idioma da interface: Português brasileiro
- Data fetching: TanStack Query (@tanstack/react-query)
- Formulários: react-hook-form + zod
- Toasts: sonner
- Ícones: lucide-react
- Datas: date-fns
- Componentes UI: shadcn/ui
- Sempre usar import { supabase } from "@/integrations/supabase/client"

=== SECRETS NECESSÁRIOS (Edge Functions) ===
- ASAAS_API_KEY: API do Asaas
- ASAAS_WEBHOOK_TOKEN: Validação webhooks
- FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY: Push notifications
- RESEND_API_KEY: Envio de emails
- OPENAI_API_KEY: Melhoria de textos
- APPLE_SHARED_SECRET: Validação IAP
- SUPABASE_BACKUP_URL, SUPABASE_BACKUP_SERVICE_KEY: Backup secundário

=== ESTADO ATUAL (Janeiro 2026) ===
- App em produção (iOS App Store + Google Play)
- Sistema de backup automático funcionando
- Pagamentos via Asaas e Apple IAP
- Notificações push funcionando
- Sistema de referral ativo

O repositório foi importado do GitHub e o Supabase de backup foi conectado.
Por favor, analise o código e me ajude a continuar o desenvolvimento.
```

### 17.2 Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   React     │  │  Capacitor  │  │    shadcn/ui + Tailwind │  │
│  │  (Vite+TS)  │  │ (iOS/Android)│  │         (UI)            │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────────┘  │
└─────────┼────────────────┼──────────────────────────────────────┘
          │                │
          ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE (Backend)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ PostgreSQL  │  │    Auth     │  │      32 Edge Functions  │  │
│  │ (35 tabelas)│  │ (email+OTP) │  │    (Deno/TypeScript)    │  │
│  └──────┬──────┘  └─────────────┘  └───────────┬─────────────┘  │
│         │                                      │                 │
│  ┌──────┴──────┐                              │                 │
│  │   Storage   │                              │                 │
│  │(avatars,img)│                              │                 │
│  └─────────────┘                              │                 │
└───────────────────────────────────────────────┼─────────────────┘
                                                │
              ┌─────────────────────────────────┼─────────────────────┐
              │                                 │                     │
              ▼                                 ▼                     ▼
     ┌─────────────────┐              ┌─────────────────┐    ┌───────────────┐
     │      Asaas      │              │    Firebase     │    │    Resend     │
     │ (PIX + Cartão)  │              │  (Push - FCM)   │    │   (Emails)    │
     └─────────────────┘              └─────────────────┘    └───────────────┘
              │
              ▼
     ┌─────────────────┐
     │   RevenueCat    │
     │ (Apple IAP iOS) │
     └─────────────────┘
```

### 17.3 Mapa de Tabelas Principais

| Tabela | Descrição | Relacionamentos |
|--------|-----------|-----------------|
| `profiles` | Dados do usuário | FK para auth.users |
| `user_roles` | Papel do usuário (artist/musician) | FK profiles |
| `shows` | Shows cadastrados | FK profiles (uid) |
| `artists` | Artistas do usuário | FK profiles (owner_uid) |
| `musicians` | Músicos da equipe | FK profiles (owner_uid) |
| `venues` | Locais de shows | FK profiles (owner_uid) |
| `subscriptions` | Assinaturas | FK profiles (user_id) |
| `payment_history` | Pagamentos | FK subscriptions |
| `notifications` | Notificações | target_role ou user_id |
| `support_tickets` | Tickets suporte | FK user_id |
| `backup_logs` | Logs de backup | - |
| `admin_users` | Admins do sistema | FK user_id |

### 17.4 Fluxo de Usuário Visual

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────┐
│ Landing  │───▶│ Register │───▶│ Verify   │───▶│ Complete  │
│    /     │    │/register │    │  Email   │    │  Profile  │
└──────────┘    └──────────┘    └──────────┘    └─────┬─────┘
                                                      │
                                                      ▼
┌──────────────────────────────────────────────────────────────┐
│                      Select Role                              │
│         ┌─────────────┐         ┌─────────────┐              │
│         │   ARTISTA   │         │   MÚSICO    │              │
│         └──────┬──────┘         └──────┬──────┘              │
└────────────────┼───────────────────────┼─────────────────────┘
                 │                       │
                 ▼                       ▼
          ┌──────────────┐        ┌──────────────┐
          │  Subscribe   │        │  Subscribe   │
          │  (7d trial)  │        │  (7d trial)  │
          └──────┬───────┘        └──────┬───────┘
                 │                       │
                 ▼                       ▼
          ┌──────────────┐        ┌──────────────┐
          │   Dashboard  │        │   Dashboard  │
          │   /artist/*  │        │  /musician/* │
          └──────────────┘        └──────────────┘
```

### 17.5 Comandos Úteis

```bash
# Instalar dependências
npm install

# Rodar localmente
npm run dev

# Build
npm run build

# Sync Capacitor
npx cap sync

# Abrir iOS
npx cap open ios

# Abrir Android
npx cap open android
```

### 17.6 Checklist Pós-Importação

Após importar o projeto em nova conta Lovable:

- [ ] Conectar Supabase de backup
- [ ] Configurar todos os secrets nas Edge Functions
- [ ] Testar login com usuário existente
- [ ] Verificar se dashboard carrega
- [ ] Testar criação de show
- [ ] Verificar notificações push
- [ ] Atualizar webhooks do Asaas
- [ ] Fazer deploy e testar

---

## 18. 🔄 IMPORTAR PARA NOVA CONTA LOVABLE (Válvula de Escape)

> ⚠️ **IMPORTANTE**: O Lovable **NÃO** importa repositórios GitHub automaticamente. Este guia detalha como reconstruir o projeto do zero em uma nova conta.

### 18.1 Pré-requisitos

Antes de iniciar, certifique-se de ter:

- [ ] Acesso ao repositório GitHub (https://github.com/SEU_USUARIO/souartista)
- [ ] Backup do Supabase funcionando (verificar backup-schema.sql)
- [ ] Todas as secrets salvas (ver seção 5)
- [ ] Nova conta Lovable criada (https://lovable.dev)
- [ ] Acesso ao Supabase de backup

### 18.2 Estratégia de Importação (3 Opções)

---

#### **OPÇÃO A - PROMPT MEGA (⭐ RECOMENDADA)**

**Tempo estimado: 30-45 minutos**

Esta é a forma mais rápida. Você envia um mega-prompt com toda a estrutura e a IA reconstrói.

**Passo 1: Baixar código do GitHub**
```bash
# Clone o repositório
git clone https://github.com/SEU_USUARIO/souartista.git
cd souartista

# Ou baixe como ZIP pelo GitHub:
# Vá em: Repositório > Code > Download ZIP
```

**Passo 2: Criar novo projeto no Lovable**
1. Acesse https://lovable.dev
2. Clique em "Create new project"
3. Escolha "Start from scratch" (projeto vazio)
4. Dê o nome "SouArtista"

**Passo 3: Enviar o Mega-Prompt inicial**

Cole exatamente este prompt no chat do Lovable:

```
Vou reconstruir um app completo chamado "Sou Artista" - gerenciador de shows para músicos brasileiros.

ARQUITETURA DO PROJETO:
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (auth, database, storage, edge functions)
- Capacitor para iOS/Android
- React Query para gerenciamento de estado

ESTRUTURA DE PASTAS NECESSÁRIA:
src/
├── components/
│   └── ui/ (componentes shadcn)
├── hooks/
├── pages/
│   ├── artist/
│   ├── musician/
│   └── demo/
├── integrations/supabase/
├── providers/
├── data/
├── lib/
└── assets/

supabase/
└── functions/ (32 edge functions)

FUNCIONALIDADES PRINCIPAIS:
1. Auth com email/OTP
2. Dois tipos de usuário: Artista e Músico
3. CRUD de shows com cachê, local, data, hora
4. Relatórios financeiros mensais
5. Sistema de assinaturas (Asaas + Apple IAP)
6. Push notifications via Firebase
7. Sistema de indicações com recompensas
8. Área admin para gerenciamento

Por favor:
1. Crie a estrutura de pastas base
2. Configure o tailwind.config.ts com o tema escuro
3. Configure o App.tsx com React Router
4. Aguarde que eu vou enviar os arquivos um por um

Confirme que entendeu e está pronto para receber os arquivos.
```

**Passo 4: Enviar arquivos na ordem correta (ver seção 18.3)**

**Passo 5: Conectar Lovable Cloud**
1. Após estrutura base criada, vá em Settings > Cloud
2. Enable Lovable Cloud
3. Isso criará um novo Supabase automaticamente

**Passo 6: Importar banco de dados (ver seção 18.5)**

---

#### **OPÇÃO B - ARQUIVO POR ARQUIVO**

**Tempo estimado: 2-3 horas**

Mais lento, mas mais controlado. Ideal se o mega-prompt não funcionar.

1. Crie projeto vazio no Lovable
2. Copie e cole cada arquivo individualmente
3. Siga a ordem da seção 18.3
4. Verifique se não há erros a cada 5-10 arquivos

**Dica**: Use o formato:
```
Crie o arquivo [caminho/arquivo.tsx] com este conteúdo:

[cole o conteúdo aqui]
```

---

#### **OPÇÃO C - DESENVOLVIMENTO LOCAL + GITHUB SYNC**

**Tempo estimado: 1 hora (se funcionar)**

⚠️ **Experimental** - Pode não sincronizar 100%

1. Crie projeto vazio no Lovable
2. Conecte ao GitHub (Settings > GitHub)
3. Crie um repositório novo pelo Lovable
4. Clone esse repositório localmente:
```bash
git clone https://github.com/SEU_USUARIO/novo-repo.git
cd novo-repo
```
5. Copie todos os arquivos do backup para este repo:
```bash
cp -r ../souartista-backup/* .
```
6. Faça commit e push:
```bash
git add .
git commit -m "Importação completa do backup"
git push origin main
```
7. O Lovable deve sincronizar automaticamente
8. Verifique se todos os arquivos apareceram

---

### 18.3 Ordem de Importação (Arquivos Críticos)

Siga esta ordem exata para evitar erros de dependência:

---

#### **FASE 1 - Configuração Base (5-10 min)**

```
1. package.json (dependências - APENAS LEITURA, Lovable gerencia)
2. tailwind.config.ts
3. index.html
4. vite.config.ts
5. capacitor.config.ts
```

**Prompt para Fase 1:**
```
Configure o projeto com:
- Tailwind CSS com tema escuro (cores: zinc, purple)
- Vite com alias @ para src/
- As seguintes dependências principais:
  - @supabase/supabase-js
  - @tanstack/react-query
  - react-router-dom
  - lucide-react
  - framer-motion
  - date-fns
  - recharts
  - react-hook-form + zod
```

---

#### **FASE 2 - Núcleo do App (5-10 min)**

```
1. src/main.tsx
2. src/App.tsx (com todas as rotas)
3. src/index.css (variáveis CSS do tema)
4. src/lib/utils.ts
5. src/vite-env.d.ts
```

**Prompt para Fase 2:**
```
Crie o núcleo do app com:
1. main.tsx com QueryProvider e BrowserRouter
2. App.tsx com TODAS estas rotas:
   - / (Landing)
   - /login, /register, /reset-password
   - /complete-profile, /select-role, /verify-email
   - /subscribe, /app (AppHub)
   - /artist/* (Dashboard, Shows, Calendar, Reports, etc)
   - /musician/* (Dashboard, Shows, Artists, etc)
   - /demo/* (versões demo)
   - /admin (área admin)
   - /support
3. index.css com variáveis HSL para tema escuro
```

---

#### **FASE 3 - Componentes UI shadcn (15-20 min)**

```
src/components/ui/
├── button.tsx
├── input.tsx
├── card.tsx
├── dialog.tsx
├── form.tsx
├── select.tsx
├── tabs.tsx
├── toast.tsx
├── toaster.tsx
├── use-toast.ts
├── table.tsx
├── badge.tsx
├── avatar.tsx
├── dropdown-menu.tsx
├── sheet.tsx
├── skeleton.tsx
├── switch.tsx
├── checkbox.tsx
├── label.tsx
├── popover.tsx
├── calendar.tsx
├── scroll-area.tsx
├── separator.tsx
├── progress.tsx
├── alert.tsx
├── accordion.tsx
├── textarea.tsx
└── (demais 15+ componentes)
```

**Prompt para Fase 3:**
```
Instale e configure todos os componentes shadcn/ui necessários:
- button, input, card, dialog, form, select, tabs
- toast, table, badge, avatar, dropdown-menu
- sheet, skeleton, switch, checkbox, label
- popover, calendar, scroll-area, separator
- progress, alert, accordion, textarea
- Todos com suporte a tema escuro
```

---

#### **FASE 4 - Hooks Essenciais (20-30 min)**

```
src/hooks/
├── useAuth.tsx (CRÍTICO - autenticação)
├── useAdmin.tsx
├── use-toast.ts
├── use-mobile.tsx
├── useShows.tsx
├── useArtistStats.tsx
├── useMusicianStats.tsx
├── useMonthlyData.tsx
├── useLocomotionData.tsx
├── usePushNotifications.tsx
├── useNativePlatform.tsx
├── usePlanType.tsx
├── useSupport.tsx
├── useReferrals.tsx
├── useAppleIAP.tsx
├── useCamera.tsx
├── useAppUpdate.tsx
├── useInAppReview.tsx
├── useUpcomingShows.tsx
├── useTimezoneSync.tsx
├── useLastSeen.tsx
├── useReportVisibility.tsx
└── usePixNotificationChecker.tsx
```

**IMPORTANTE**: O `useAuth.tsx` é o mais crítico. Ele gerencia:
- Login/logout
- Dados do usuário
- Role (artist/musician)
- Status do plano
- Refresh de dados

**Prompt para Fase 4:**
```
Preciso criar os hooks do sistema. O mais importante é useAuth.tsx que gerencia:
- Estado de autenticação com Supabase
- Dados do perfil do usuário
- Role do usuário (artist/musician)
- Status do plano (active/inactive/trial)
- Funções: signIn, signUp, signOut, updateUserData, setUserRole

Também preciso de: useShows, useMonthlyData, usePushNotifications, usePlanType
```

---

#### **FASE 5 - Componentes do App (30-45 min)**

```
src/components/
├── LoadingScreen.tsx
├── ProtectedRoute.tsx
├── SafeAreaWrapper.tsx
├── UserMenu.tsx
├── NotificationBell.tsx
├── NotificationItem.tsx
├── ArtistSidebar.tsx
├── MusicianSidebar.tsx
├── AdminSidebar.tsx
├── MobileBottomNav.tsx
├── WeeklySchedule.tsx
├── PaymentHistory.tsx
├── CreditCardForm.tsx
├── FeedbackForm.tsx
├── FeedbackHistory.tsx
├── Onboarding.tsx
├── PeriodFilter.tsx
├── ReferralProgress.tsx
├── ImageEditor.tsx
├── OfflineBanner.tsx
├── UpdateBanner.tsx
├── GlobalAnnouncementModal.tsx
├── LgpdRequestModal.tsx
├── ReturningUserModal.tsx
├── DemoBanner.tsx
├── DemoLockedModal.tsx
└── (componentes demo/*)
```

---

#### **FASE 6 - Páginas (45-60 min)**

**Páginas Raiz:**
```
src/pages/
├── Landing.tsx
├── Login.tsx
├── Register.tsx
├── ResetPassword.tsx
├── CompleteProfile.tsx
├── SelectRole.tsx
├── VerifyEmail.tsx
├── Subscribe.tsx
├── AppHub.tsx
├── Admin.tsx
├── Support.tsx
├── Terms.tsx
├── Privacy.tsx
├── NotFound.tsx
└── ReferralRedirect.tsx
```

**Páginas Artist:**
```
src/pages/artist/
├── Dashboard.tsx
├── Shows.tsx
├── Calendar.tsx
├── Reports.tsx
├── Musicians.tsx
├── Venues.tsx
├── Transportation.tsx
├── Profile.tsx
├── Settings.tsx
├── Subscription.tsx
├── Support.tsx
├── Tutorial.tsx
├── Updates.tsx
├── Terms.tsx
└── Privacy.tsx
```

**Páginas Musician:**
```
src/pages/musician/
├── Dashboard.tsx
├── Shows.tsx
├── Calendar.tsx
├── Reports.tsx
├── Artists.tsx
├── Transportation.tsx
├── Profile.tsx
├── Settings.tsx
├── Subscription.tsx
├── Support.tsx
├── Tutorial.tsx
├── Updates.tsx
├── Terms.tsx
└── Privacy.tsx
```

**Páginas Demo (opcional, pode fazer depois):**
```
src/pages/demo/artist/*
src/pages/demo/musician/*
```

---

#### **FASE 7 - Edge Functions (30-45 min)**

```
supabase/functions/
├── _shared/
│   ├── fcm-sender.ts
│   └── timezone-utils.ts
├── send-push-notification/
├── check-show-reminders/
├── create-asaas-subscription/
├── asaas-webhook/
├── check-payment-status/
├── cancel-subscription/
├── verify-apple-receipt/
├── apple-subscription-webhook/
├── sync-revenuecat-subscriptions/
├── send-otp-email/
├── verify-otp/
├── delete-account/
├── database-backup/
├── backup-auth-users/
├── send-report-email/
├── improve-text/
├── create-notification/
├── send-subscription-reminders/
├── send-engagement-tips/
├── send-marketing-notifications/
├── validate-referrals/
├── send-referral-notification/
├── check-expired-subscriptions/
├── get-pending-payment/
├── check-pix-notifications/
├── sync-asaas-payments/
├── cleanup-deleted-users/
├── create-support-user/
├── support-manage-user/
├── test-push-notification/
├── seed-test-account/
└── import-firebase-shows/
```

**Prompt para Edge Functions:**
```
Preciso criar as Edge Functions do Supabase. As mais críticas são:
1. send-push-notification - Envia push via Firebase FCM
2. check-show-reminders - Lembra sobre shows próximos
3. asaas-webhook - Recebe webhooks de pagamento
4. create-asaas-subscription - Cria assinaturas no Asaas
5. verify-apple-receipt - Valida compras da App Store

Todas precisam dos secrets configurados (ver seção 5 do disaster recovery)
```

---

#### **FASE 8 - Arquivos Mobile (5-10 min)**

```
android/app/src/main/AndroidManifest.xml
ios/App/App/Info.plist
resources/icon.png
resources/splash.png
resources/GoogleService-Info.plist
```

---

### 18.4 Mega-Prompt de Reconstrução Completo

Se a Opção A falhar parcialmente, use este mega-prompt mais detalhado:

```
# RECONSTRUÇÃO COMPLETA - SOU ARTISTA

## CONTEXTO
Estou reconstruindo um app de gerenciamento de shows para músicos brasileiros.
O app estava em produção e preciso recriar do zero com base no código do GitHub.

## STACK TECNOLÓGICO
- Frontend: React 18.3.1 + TypeScript + Vite
- Estilização: Tailwind CSS + shadcn/ui
- Backend: Supabase (Lovable Cloud)
- Mobile: Capacitor 7.x (iOS + Android)
- Estado: TanStack Query v5
- Forms: react-hook-form + zod
- Gráficos: recharts
- Ícones: lucide-react
- Datas: date-fns

## BANCO DE DADOS (TABELAS PRINCIPAIS)
1. profiles - dados do usuário (cpf, phone, plan_type, status_plano)
2. user_roles - role do usuário (artist/musician/support)
3. shows - shows cadastrados (date_local, time_local, venue_name, fee)
4. musicians - músicos do artista
5. venues - locais de show
6. subscriptions - assinaturas (status, next_due_date, payment_method)
7. referral_codes - códigos de indicação
8. referrals - indicações feitas
9. notifications - notificações do sistema
10. support_tickets - tickets de suporte
11. admin_users - administradores

## FLUXO DE AUTENTICAÇÃO
1. Landing → Login/Register
2. CompleteProfile (CPF, telefone, data nascimento)
3. VerifyEmail (OTP por email)
4. SelectRole (artist ou musician)
5. Subscribe (pagamento obrigatório)
6. Dashboard específico do role

## O QUE PRECISO AGORA
1. Criar estrutura completa de pastas
2. Configurar tema escuro com cores: zinc-900/950 fundo, purple accent
3. Configurar React Router com todas as rotas
4. Criar componentes base do shadcn
5. Aguardar envio dos arquivos específicos

Confirme que entendeu e vamos começar.
```

---

### 18.5 Conectar e Importar Banco de Dados

Após a estrutura do app estar pronta:

#### Passo 1: Habilitar Lovable Cloud
1. No Lovable, vá em **Settings > Cloud**
2. Clique em **"Enable Lovable Cloud"**
3. Aguarde a criação do projeto Supabase

#### Passo 2: Importar Schema
1. Pegue o arquivo `backup-schema.sql` do repositório
2. No chat do Lovable, peça:
```
Execute esta migração SQL para criar todas as tabelas do sistema:

[Cole o conteúdo do backup-schema.sql]
```

#### Passo 3: Restaurar Dados (via Supabase de Backup)
1. Acesse o Supabase de Backup
2. Exporte cada tabela como CSV:
   - profiles
   - user_roles
   - shows
   - musicians
   - venues
   - subscriptions
   - referral_codes
   - referrals
3. No novo Supabase, importe os CSVs

#### Passo 4: Restaurar Usuários Auth
1. No Supabase de Backup, vá em **Auth > Users**
2. Exporte a lista de usuários
3. Use a Edge Function `backup-auth-users` para recriar

#### Passo 5: Configurar Secrets
Adicione todos os secrets (ver seção 5):
- ASAAS_API_KEY
- FIREBASE_SERVICE_ACCOUNT
- RESEND_API_KEY
- etc.

---

### 18.6 Checklist Final de Validação

Após importação completa, teste tudo:

#### Infraestrutura
- [ ] Projeto Lovable criado e funcionando
- [ ] Lovable Cloud habilitado
- [ ] GitHub conectado (opcional)
- [ ] Deploy público funcionando

#### Banco de Dados
- [ ] Todas as 25+ tabelas criadas
- [ ] RLS policies configuradas
- [ ] Triggers funcionando
- [ ] Dados restaurados

#### Autenticação
- [ ] Login com email/senha funciona
- [ ] OTP por email funciona
- [ ] Logout funciona
- [ ] Perfil carrega corretamente

#### Funcionalidades Artist
- [ ] Dashboard carrega estatísticas
- [ ] CRUD de shows funciona
- [ ] CRUD de músicos funciona
- [ ] CRUD de locais funciona
- [ ] Relatórios geram corretamente
- [ ] Calendário mostra shows

#### Funcionalidades Musician
- [ ] Dashboard carrega
- [ ] Lista de artistas aparece
- [ ] Shows do artista aparecem

#### Pagamentos
- [ ] Asaas webhook configurado
- [ ] PIX funciona
- [ ] Cartão funciona
- [ ] Apple IAP funciona (iOS)

#### Notificações
- [ ] Push notifications funcionam
- [ ] Firebase configurado
- [ ] Lembretes de show funcionam

#### Edge Functions
- [ ] Todas as 32 functions deployadas
- [ ] Logs sem erros
- [ ] Webhooks respondendo

#### Mobile
- [ ] Build Android funciona
- [ ] Build iOS funciona
- [ ] App Store/Play Store atualizadas

---

### 18.7 Troubleshooting Comum

| Problema | Solução |
|----------|---------|
| "Cannot find module" | Verificar se dependência foi instalada |
| "RLS policy violation" | Verificar se policies foram criadas |
| "Edge function error" | Verificar se secrets estão configurados |
| "Auth error" | Verificar se usuários foram restaurados |
| "Tipo não encontrado" | Aguardar regeneração do types.ts |
| "CORS error" | Verificar URL do Supabase nas functions |

---

### 18.8 Tempo Total Estimado

| Fase | Tempo |
|------|-------|
| Criar projeto + mega-prompt | 15 min |
| Importar arquivos (Fases 1-6) | 2-3 horas |
| Edge Functions (Fase 7) | 45 min |
| Configurar banco de dados | 30 min |
| Restaurar dados | 30 min |
| Configurar secrets | 15 min |
| Testes e validação | 30 min |
| **TOTAL** | **4-5 horas** |

---

## 📝 NOTAS IMPORTANTES

1. **TESTE ESTE GUIA ANTES** de precisar usá-lo de verdade
2. **Mantenha os secrets** em local seguro e atualizado
3. **Verifique o backup** periodicamente (Admin > Backup God)
4. **Documente alterações** que fizer no sistema

---

## 📜 HISTÓRICO DE ATUALIZAÇÕES

| Data | Versão | Alteração |
|------|--------|-----------|
| Jan/2026 | 1.0 | Criação do documento completo |

---

> **Lembre-se**: Este documento é seu seguro. Mantenha-o atualizado e guarde as credenciais em local seguro!
