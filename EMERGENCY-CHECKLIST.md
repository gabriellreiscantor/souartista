# 🚨 CHECKLIST DE EMERGÊNCIA - SOU ARTISTA

> **USE ESTE CHECKLIST EM CASO DE MIGRAÇÃO PARA O SUPABASE DE BACKUP**
> 
> **Tempo total estimado: 30 minutos** (se secrets já estiverem configuradas no backup)

---

## ⏰ ANTES DE COMEÇAR

### ✅ Pré-requisitos (faça AGORA, não na emergência!)

- [ ] **Secrets copiadas para o Supabase de backup** (Ver `SECRETS-TEMPLATE.md`)
- [ ] **Credenciais salvas em gerenciador de senhas** (1Password, Bitwarden)
- [ ] **Acesso ao GitHub** funcionando
- [ ] **Supabase CLI instalado** no computador

---

## 🔴 CHECKLIST DE EMERGÊNCIA (siga na ordem!)

### PASSO 1: Verificar o que está funcionando (2 min)

| Verificação | URL/Ação | Status |
|-------------|----------|--------|
| [ ] App Web | https://souartista.lovable.app | ✅ / ❌ |
| [ ] App Mobile | Abrir app no celular | ✅ / ❌ |
| [ ] GitHub | https://github.com/SEU_USUARIO/souartista | ✅ / ❌ |
| [ ] Supabase Backup | https://supabase.com/dashboard | ✅ / ❌ |

**Se app está funcionando mas só Lovable caiu**: Aguarde, não precisa migrar!

---

### PASSO 2: Baixar código do GitHub (3 min)

```bash
# Clone o repositório
git clone https://github.com/SEU_USUARIO/souartista.git
cd souartista

# Instalar dependências
npm install
```

- [ ] Código clonado
- [ ] `npm install` executado sem erros

---

### PASSO 3: Configurar .env para Supabase de Backup (2 min)

Crie/atualize o arquivo `.env` na raiz do projeto:

```env
# ⚠️ SUBSTITUIR PELOS VALORES DO SUPABASE DE BACKUP
VITE_SUPABASE_URL=https://SEU-PROJETO-BACKUP.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_anon_key_do_backup
VITE_SUPABASE_PROJECT_ID=id_do_projeto_backup
```

**Onde encontrar esses valores:**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto de backup
3. Vá em: Settings → API
4. Copie: Project URL, anon key, Project ID

- [ ] `.env` atualizado com credenciais do backup

---

### PASSO 4: Deploy das Edge Functions (10 min)

```bash
# Login no Supabase CLI
supabase login

# Vincular ao projeto de backup
supabase link --project-ref ID_DO_PROJETO_BACKUP

# Deploy de TODAS as funções
supabase functions deploy
```

- [ ] `supabase login` feito
- [ ] `supabase link` conectado ao backup
- [ ] `supabase functions deploy` executado (32 funções)

---

### PASSO 5: Atualizar Webhooks Externos (10 min)

#### 5.1 Asaas Webhook

1. **Acesse**: https://app.asaas.com/webhooks
2. **Edite** o webhook existente
3. **Altere a URL** de:
   ```
   ANTIGO: https://wjutvzmnvemrplpwbkyf.supabase.co/functions/v1/asaas-webhook
   NOVO:   https://SEU-PROJETO-BACKUP.supabase.co/functions/v1/asaas-webhook
   ```
4. **Salve**

- [ ] Webhook Asaas atualizado

#### 5.2 RevenueCat Webhook

1. **Acesse**: https://app.revenuecat.com/apps → Seu app → Integrations → Webhooks
2. **Edite** a configuração
3. **Altere a URL** de:
   ```
   ANTIGO: https://wjutvzmnvemrplpwbkyf.supabase.co/functions/v1/apple-subscription-webhook
   NOVO:   https://SEU-PROJETO-BACKUP.supabase.co/functions/v1/apple-subscription-webhook
   ```
4. **Salve**

- [ ] Webhook RevenueCat atualizado

---

### PASSO 6: Testar (5 min)

```bash
# Rodar localmente primeiro
npm run dev
```

Acesse http://localhost:5173 e teste:

- [ ] **Login funciona** (usuário existente consegue entrar)
- [ ] **Dashboard carrega** (dados aparecem)
- [ ] **Criar show funciona** (salva no banco)

Se tudo funcionou localmente, prossiga para deploy.

---

### PASSO 7: Deploy Web (5 min)

#### Opção A: Vercel (recomendado)
1. Acesse: https://vercel.com
2. Importe repositório do GitHub
3. Configure variáveis de ambiente (mesmas do `.env`)
4. Deploy

#### Opção B: Netlify
1. Acesse: https://netlify.com
2. Import from Git
3. Configure variáveis
4. Deploy

- [ ] App web deployado e acessível

---

### PASSO 8: Notificar usuários (se necessário)

Se houve tempo de indisponibilidade, considere:
- [ ] Enviar email aos usuários
- [ ] Postar nas redes sociais
- [ ] Atualizar status page (se tiver)

---

## ✅ VALIDAÇÃO FINAL

| Funcionalidade | Testar | Status |
|----------------|--------|--------|
| Login/Cadastro | Criar nova conta ou logar | ⬜ |
| Dashboard | Ver dados existentes | ⬜ |
| Criar Show | Adicionar novo show | ⬜ |
| Pagamento PIX | Iniciar pagamento | ⬜ |
| Pagamento iOS | Verificar assinatura | ⬜ |
| Push Notification | Enviar teste | ⬜ |

---

## 📞 CONTATOS DE EMERGÊNCIA

| Serviço | Suporte |
|---------|---------|
| Supabase | support@supabase.io |
| Asaas | suporte@asaas.com |
| Firebase | Firebase Console Chat |
| RevenueCat | support@revenuecat.com |

---

## 📁 ARQUIVOS RELACIONADOS

- `SECRETS-TEMPLATE.md` - Lista de secrets necessárias
- `WEBHOOKS-CONFIG.md` - URLs dos webhooks
- `DISASTER-RECOVERY-COMPLETO.md` - Guia detalhado completo
- `backup-schema.sql` - SQL para criar tabelas

---

**Última atualização**: Janeiro 2026
