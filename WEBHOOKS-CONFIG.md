# 🔗 CONFIGURAÇÃO DE WEBHOOKS - SOU ARTISTA

> **DOCUMENTO DE REFERÊNCIA**: URLs atuais e de backup para todos os webhooks do sistema.
> 
> **⚠️ IMPORTANTE**: Webhooks só precisam ser alterados SE você migrar para o Supabase de backup!

---

## 📋 VISÃO GERAL

O sistema usa webhooks para receber notificações de:
1. **Asaas** - Pagamentos PIX/Boleto/Cartão
2. **RevenueCat** - Assinaturas iOS (Apple)

---

## 🌐 URLS DOS WEBHOOKS

### Ambiente ATUAL (Lovable Cloud)

| Serviço | Edge Function | URL Atual |
|---------|---------------|-----------|
| **Asaas** | `asaas-webhook` | `https://wjutvzmnvemrplpwbkyf.supabase.co/functions/v1/asaas-webhook` |
| **RevenueCat** | `apple-subscription-webhook` | `https://wjutvzmnvemrplpwbkyf.supabase.co/functions/v1/apple-subscription-webhook` |

### Ambiente de BACKUP (Seu Supabase)

| Serviço | Edge Function | URL de Backup |
|---------|---------------|---------------|
| **Asaas** | `asaas-webhook` | `https://SEU-PROJETO-BACKUP.supabase.co/functions/v1/asaas-webhook` |
| **RevenueCat** | `apple-subscription-webhook` | `https://SEU-PROJETO-BACKUP.supabase.co/functions/v1/apple-subscription-webhook` |

> **📝 NOTA**: Substitua `SEU-PROJETO-BACKUP` pelo ID real do seu projeto Supabase de backup.

---

## 🔧 COMO ATUALIZAR OS WEBHOOKS

### 1️⃣ ASAAS (Pagamentos PIX/Boleto/Cartão)

#### Acessar Painel
1. Acesse: **https://app.asaas.com**
2. Faça login com sua conta
3. Vá em: **Integrações** → **Webhooks**

#### Configuração Atual
```
URL: https://wjutvzmnvemrplpwbkyf.supabase.co/functions/v1/asaas-webhook
Método: POST
Eventos: PAYMENT_CONFIRMED, PAYMENT_RECEIVED, PAYMENT_OVERDUE, etc.
Token: [Seu ASAAS_WEBHOOK_TOKEN]
```

#### Como Alterar
1. Clique no webhook existente para editar
2. No campo **URL**, substitua por:
   ```
   https://SEU-PROJETO-BACKUP.supabase.co/functions/v1/asaas-webhook
   ```
3. Mantenha o mesmo **Token de autenticação** (ASAAS_WEBHOOK_TOKEN)
4. Clique **Salvar**

#### Testar
- Clique em **"Testar webhook"** no painel do Asaas
- Verifique os logs: `supabase functions logs asaas-webhook`

---

### 2️⃣ REVENUECAT (Assinaturas iOS)

#### Acessar Painel
1. Acesse: **https://app.revenuecat.com**
2. Faça login
3. Selecione seu app: **SouArtista**
4. Vá em: **Integrations** → **Webhooks**

#### Configuração Atual
```
URL: https://wjutvzmnvemrplpwbkyf.supabase.co/functions/v1/apple-subscription-webhook
Authorization Header: Bearer [Seu REVENUECAT_WEBHOOK_AUTH_KEY]
Events: INITIAL_PURCHASE, RENEWAL, CANCELLATION, etc.
```

#### Como Alterar
1. Clique em **Edit** no webhook
2. No campo **Webhook URL**, substitua por:
   ```
   https://SEU-PROJETO-BACKUP.supabase.co/functions/v1/apple-subscription-webhook
   ```
3. Mantenha o mesmo **Authorization Header**
4. Clique **Save**

#### Testar
- Use o botão **"Send Test Event"** no RevenueCat
- Verifique os logs: `supabase functions logs apple-subscription-webhook`

---

## 🔐 TOKENS DE AUTENTICAÇÃO

Os webhooks usam tokens para validar que as requisições são legítimas.

| Webhook | Secret | Descrição |
|---------|--------|-----------|
| Asaas | `ASAAS_WEBHOOK_TOKEN` | Token que **você definiu** ao configurar o webhook no Asaas |
| RevenueCat | `REVENUECAT_WEBHOOK_AUTH_KEY` | Token que **você definiu** ao configurar no RevenueCat |

> **⚠️ IMPORTANTE**: Estes tokens são **definidos por você**. São os mesmos valores usados no Lovable Cloud e no Supabase de backup.

---

## 📊 EVENTOS MONITORADOS

### Asaas - Eventos de Pagamento
| Evento | Descrição | Ação no Sistema |
|--------|-----------|-----------------|
| `PAYMENT_CONFIRMED` | PIX confirmado | Ativa assinatura |
| `PAYMENT_RECEIVED` | Pagamento recebido | Atualiza status |
| `PAYMENT_OVERDUE` | Vencido | Envia lembrete |
| `PAYMENT_REFUNDED` | Estornado | Cancela assinatura |

### RevenueCat - Eventos iOS
| Evento | Descrição | Ação no Sistema |
|--------|-----------|-----------------|
| `INITIAL_PURCHASE` | Primeira compra | Cria assinatura |
| `RENEWAL` | Renovação | Atualiza próximo vencimento |
| `CANCELLATION` | Cancelamento | Marca para expirar |
| `EXPIRATION` | Expirado | Desativa acesso |

---

## 🧪 COMO TESTAR

### Verificar se webhook está funcionando

```bash
# Ver logs do Asaas webhook
supabase functions logs asaas-webhook --project-ref SEU_PROJECT_ID

# Ver logs do RevenueCat webhook  
supabase functions logs apple-subscription-webhook --project-ref SEU_PROJECT_ID
```

### Testar manualmente com curl

```bash
# Testar Asaas webhook (exemplo)
curl -X POST \
  https://SEU-PROJETO.supabase.co/functions/v1/asaas-webhook \
  -H "asaas-access-token: SEU_ASAAS_WEBHOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event":"PAYMENT_CONFIRMED","payment":{"id":"test"}}'
```

---

## 📁 ARQUIVOS RELACIONADOS

| Arquivo | Descrição |
|---------|-----------|
| `supabase/functions/asaas-webhook/index.ts` | Código do webhook Asaas |
| `supabase/functions/apple-subscription-webhook/index.ts` | Código do webhook RevenueCat |
| `SECRETS-TEMPLATE.md` | Lista de secrets necessárias |
| `EMERGENCY-CHECKLIST.md` | Checklist de migração |

---

## ⏱️ TEMPO PARA ATUALIZAR

| Ação | Tempo Estimado |
|------|----------------|
| Atualizar webhook Asaas | 3 min |
| Atualizar webhook RevenueCat | 3 min |
| Testar ambos | 4 min |
| **Total** | **~10 min** |

---

**Última atualização**: Janeiro 2026
