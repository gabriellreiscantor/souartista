# 🚨 DISASTER RECOVERY - SouArtista

## Visão Geral

Este documento descreve o processo completo para restaurar o sistema SouArtista em caso de falha catastrófica do Supabase principal.

**Tempo estimado de recuperação: ~22 minutos**

---

## 📋 Pré-requisitos

Antes de iniciar a recuperação, certifique-se de ter:

1. Acesso ao **Supabase de Backup** (projeto separado)
2. Acesso ao **código-fonte** (GitHub ou local)
3. Acesso às **credenciais de serviços externos** (Asaas, Firebase, etc.)
4. Último backup executado com sucesso (verificar tabela `backup_logs`)

---

## 🔄 Processo de Recuperação

### Passo 1: Verificar Status do Backup (2 min)

Acesse o Supabase de backup e execute:

```sql
SELECT * FROM backup_logs 
ORDER BY executed_at DESC 
LIMIT 5;
```

Verifique:
- ✅ Status = 'success' ou 'partial_success'
- ✅ `tables_copied` = 34+
- ✅ `records_copied` > 0
- ✅ `executed_at` recente (menos de 24h)

---

### Passo 2: Restaurar Usuários Auth (5 min)

Execute o seguinte SQL no Supabase de backup para importar os usuários:

```sql
-- IMPORTANTE: Execute isso no SQL Editor do Supabase de BACKUP
-- Isso restaura os usuários do auth.users a partir do backup

-- 1. Inserir usuários do backup na tabela auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
SELECT 
  id,
  '00000000-0000-0000-0000-000000000000'::uuid as instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  COALESCE(updated_at, created_at),
  COALESCE(raw_app_meta_data, '{"provider": "email", "providers": ["email"]}'::jsonb),
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  'authenticated' as aud,
  'authenticated' as role,
  '' as confirmation_token,
  '' as recovery_token,
  '' as email_change_token_new,
  '' as email_change
FROM auth_users_backup
ON CONFLICT (id) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  updated_at = EXCLUDED.updated_at,
  raw_app_meta_data = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- 2. Criar identidades para os usuários (necessário para login)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  created_at,
  updated_at,
  last_sign_in_at
)
SELECT 
  gen_random_uuid(),
  id as user_id,
  jsonb_build_object('sub', id::text, 'email', email),
  'email' as provider,
  id::text as provider_id,
  created_at,
  COALESCE(updated_at, created_at),
  last_sign_in_at
FROM auth_users_backup
ON CONFLICT (provider, provider_id) DO NOTHING;
```

---

### Passo 3: Atualizar Variáveis de Ambiente (5 min)

No seu projeto Lovable ou ambiente de deploy, atualize:

```env
VITE_SUPABASE_URL=https://[SEU-PROJETO-BACKUP].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[ANON-KEY-DO-BACKUP]
```

**Para Edge Functions**, configure os secrets no Supabase de backup:

| Secret | Descrição |
|--------|-----------|
| `SUPABASE_URL` | URL do Supabase (backup) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (backup) |
| `ASAAS_API_KEY` | Chave da API do Asaas |
| `ASAAS_WEBHOOK_TOKEN` | Token do webhook Asaas |
| `FIREBASE_PROJECT_ID` | ID do projeto Firebase |
| `FIREBASE_CLIENT_EMAIL` | Email do service account Firebase |
| `FIREBASE_PRIVATE_KEY` | Private key do Firebase (JSON escaped) |
| `RESEND_API_KEY` | Chave da API do Resend |
| `OPENAI_API_KEY` | Chave da API do OpenAI |
| `APPLE_SHARED_SECRET` | Secret para validação Apple IAP |
| `SUPPORT_USER_PASSWORD` | Senha do usuário de suporte |

---

### Passo 4: Deploy das Edge Functions (5 min)

As Edge Functions serão automaticamente deployed quando você fizer push do código apontando para o novo Supabase.

Se precisar fazer deploy manual:

```bash
supabase functions deploy --project-ref [SEU-PROJETO-BACKUP]
```

---

### Passo 5: Verificação Final (5 min)

Execute os seguintes testes:

1. **Login de usuário existente**
   - Tente logar com um email conhecido
   - Verifique se o dashboard carrega

2. **Verificar dados**
   ```sql
   SELECT COUNT(*) FROM profiles;
   SELECT COUNT(*) FROM shows;
   SELECT COUNT(*) FROM subscriptions WHERE status = 'active';
   ```

3. **Testar criação de show**
   - Crie um show de teste
   - Verifique se salvou no banco

4. **Verificar notificações**
   - Verifique se FCM tokens estão presentes
   - Teste envio de notificação

---

## 📊 Checklist de Recuperação

Use este checklist para garantir que tudo foi feito:

- [ ] Backup verificado (status success, dados recentes)
- [ ] Usuários auth restaurados
- [ ] Variáveis de ambiente atualizadas
- [ ] Secrets das Edge Functions configurados
- [ ] Edge Functions deployed
- [ ] Login testado e funcionando
- [ ] Dados dos usuários acessíveis
- [ ] Notificações funcionando
- [ ] Webhooks do Asaas redirecionados (se aplicável)
- [ ] DNS/domínio apontando para novo ambiente (se aplicável)

---

## ⚠️ Considerações Importantes

### Dados que podem ter sido perdidos

- Dados criados entre o último backup e a falha
- Sessões ativas dos usuários (precisarão logar novamente)
- Tokens de push notification podem precisar ser renovados

### Ações pós-recuperação

1. **Notificar usuários** sobre manutenção/problema
2. **Monitorar** erros nos primeiros dias
3. **Verificar** webhooks de pagamento estão funcionando
4. **Configurar** novo backup automático (cron job)

### Redirecionamento de Webhooks

Se estiver usando webhooks do Asaas, atualize a URL no painel do Asaas:

```
Nova URL: https://[SEU-PROJETO-BACKUP].supabase.co/functions/v1/asaas-webhook
```

---

## 📞 Contatos de Emergência

- **Supabase Support**: support@supabase.io
- **Asaas Support**: suporte@asaas.com.br
- **Firebase Console**: https://console.firebase.google.com

---

## 📝 Histórico de Recuperações

| Data | Motivo | Tempo | Status |
|------|--------|-------|--------|
| - | - | - | - |

*Adicione entradas aqui sempre que uma recuperação for realizada.*
