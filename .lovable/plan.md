

## Adicionar mensagens de indicação nas notificações de marketing e engajamento

### Contexto
Atualmente, nenhuma das notificações push de marketing ou dicas de engajamento menciona o programa de indicações. Isso é uma oportunidade perdida de divulgar a funcionalidade.

### Alteracoes

#### 1. `send-marketing-notifications` - Novas mensagens sobre indicacoes

Adicionar mensagens nos grupos existentes:

**ENGAGEMENT_MESSAGES (assinantes ativos)** - Adicionar ~3 mensagens:
- "Indique amigos e ganhe 30 dias gratis! A cada 5 indicacoes validadas, voce ganha 1 mes de assinatura."
- "Voce sabia que pode ganhar meses gratis? Compartilhe seu codigo de indicacao com outros musicos!"
- "Seus amigos musicos precisam do SouArtista! Indique e ganhe recompensas."

**CONVERSION_MESSAGES (nao-assinantes)** - Adicionar ~2 mensagens:
- "Conhece outros musicos? Indique o SouArtista e ganhe beneficios exclusivos!"
- "Compartilhe o SouArtista com seus amigos musicos. Voces dois saem ganhando!"

**NEW_USER_MESSAGES (novos usuarios)** - Adicionar ~1 mensagem:
- "Conhece outros musicos? Compartilhe o SouArtista e ganhe recompensas!"

**INACTIVE_USER_MESSAGES (inativos)** - Adicionar ~1 mensagem:
- "Seus amigos estao usando o SouArtista! Volte e indique mais musicos para ganhar meses gratis."

#### 2. `send-engagement-tips` - Nova dica sobre indicacoes

Adicionar 1 nova dica ao array ENGAGEMENT_TIPS:
- Titulo: "Indique e ganhe!"
- Mensagem: "Compartilhe seu codigo de indicacao com amigos musicos. A cada 5 indicacoes validadas, voce ganha 30 dias gratis de assinatura!"
- Link: `/artist/subscription` (onde o componente ReferralProgress fica)

### Detalhes tecnicos

**Arquivo 1:** `supabase/functions/send-marketing-notifications/index.ts`
- Adicionar novas mensagens nos arrays ENGAGEMENT_MESSAGES, CONVERSION_MESSAGES, NEW_USER_MESSAGES e INACTIVE_USER_MESSAGES
- Os links das mensagens de indicacao para assinantes apontarao para a pagina de assinatura onde o componente de indicacoes aparece

**Arquivo 2:** `supabase/functions/send-engagement-tips/index.ts`
- Adicionar 1 novo item ao array ENGAGEMENT_TIPS (total passara de 15 para 16 dicas)

Nenhuma mudanca de logica e necessaria — apenas novas mensagens nos arrays existentes. O sistema de rotacao ja garante que todas as mensagens serao enviadas eventualmente.

