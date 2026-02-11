

# Plano: Mais Notificações de Conversão + Corrigir Nome

## O que muda

### 1. Corrigir o nome em TODAS as mensagens
- "Sou Artista" → "SouArtista" (junto)
- Remover "Sou Artista Pro" / "SouArtista Pro" → usar "Faça sua assinatura" ou similar
- Aplicar em **todos os arquivos** de notificação

### 2. Expandir mensagens de CONVERSÃO (de 20 para 40)

As 20 mensagens atuais serão corrigidas + 20 novas serão adicionadas, com temas variados:

**Mensagens existentes (corrigidas):**
- conv_1 a conv_20: Corrigir nome e remover "Pro"

**20 novas mensagens (conv_21 a conv_40):**
- Foco em dor do músico (cachês perdidos, agenda bagunçada, não saber lucro real)
- Urgência e escassez ("seus colegas já usam", "enquanto você anota em papel...")
- Benefícios concretos (relatórios, controle financeiro, agenda visual)
- Gatilhos emocionais (profissionalismo, crescimento, independência)
- Perguntas provocativas ("Sabe quanto gastou de Uber esse mês?")

### 3. Expandir mensagens de ONBOARDING/Pending (de 3 para 10)

As 3 mensagens atuais do `send-pending-user-reminders` serão corrigidas + 7 novas serão adicionadas, com gatilhos em mais dias:

**Cronograma expandido:**
- Dia 1: Boas-vindas + trial
- Dia 2: Destaque de funcionalidade
- Dia 3: Prova social
- Dia 4: Dor do músico
- Dia 5: Benefício concreto
- Dia 7: Urgência de expiração
- Dia 10: Última chance
- Dia 14: Re-engajamento
- Dia 21: Saudade
- Dia 30: Oferta final

### 4. Expandir mensagens para NOVOS sem shows (de 5 para 10)

Mais incentivos para cadastrar o primeiro show.

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/send-marketing-notifications/index.ts` | Corrigir nome, remover "Pro", adicionar conv_21 a conv_40, expandir NEW_USER_MESSAGES |
| `supabase/functions/send-pending-user-reminders/index.ts` | Corrigir nome, expandir de 3 para 10 lembretes com mais dias |

## Seção Técnica

### send-marketing-notifications - CONVERSION_MESSAGES (40 total)

**Existentes corrigidas (exemplos):**
- conv_1: "Artistas profissionais usam o SouArtista para gerenciar a agenda. Faça sua assinatura!"
- conv_7: "Impressione contratantes com relatórios detalhados. Faça sua assinatura no SouArtista!"

**Novas (conv_21 a conv_40):**
- conv_21: "Você sabe quanto lucrou no último show? Com o SouArtista você descobre na hora."
- conv_22: "Enquanto você anota em papel, outros músicos já organizam tudo pelo SouArtista."
- conv_23: "Quantos shows você fez esse ano? Com o SouArtista você tem essa resposta em 1 toque."
- conv_24: "Chega de mandar mensagem perguntando cachê. No SouArtista tá tudo registrado."
- conv_25: "Sabe quanto gastou de transporte nos últimos shows? O SouArtista calcula pra você."
- conv_26: "Músico profissional tem controle financeiro. Faça sua assinatura no SouArtista!"
- conv_27: "Sua agenda de shows merece mais que um caderninho. Experimente o SouArtista!"
- conv_28: "Relatório mensal pronto em segundos. É isso que o SouArtista faz por você."
- conv_29: "Quanto você quer ganhar esse mês? No SouArtista você acompanha sua meta em tempo real."
- conv_30: "Pare de depender da memória. Registre seus shows e tenha tudo documentado."
- conv_31: "Cada show não registrado é dinheiro que você esquece. Use o SouArtista!"
- conv_32: "Músicos que usam o SouArtista sabem exatamente quanto ganham. E você?"
- conv_33: "Organize seus músicos, locais e cachês. Tudo no SouArtista. Faça sua assinatura!"
- conv_34: "Imposto, transporte, alimentação... Você sabe seu lucro real? Descubra no SouArtista."
- conv_35: "Não deixe pra depois. Organize sua carreira musical hoje. Assine o SouArtista!"
- conv_36: "Seu contador vai agradecer. Relatórios organizados direto do SouArtista."
- conv_37: "Quanto tempo você perde organizando shows? Com o SouArtista são 2 minutos."
- conv_38: "Shows confirmados, cachês registrados, gastos controlados. Isso é SouArtista."
- conv_39: "A diferença entre amador e profissional? Organização. Faça sua assinatura!"
- conv_40: "Você toca bem, mas organiza bem? O SouArtista cuida da parte chata pra você."

### send-pending-user-reminders - REMINDERS (10 total)

```text
Dia 1:  "Bem-vindo ao SouArtista! Faça sua assinatura e organize seus shows."
Dia 2:  "Sabia que você pode cadastrar shows, músicos e locais? Faça sua assinatura!"
Dia 3:  "Músicos organizados ganham mais. Comece a usar o SouArtista hoje!"
Dia 4:  "Cansado de anotar shows no papel? O SouArtista resolve isso. Assine agora!"
Dia 5:  "Relatórios de cachê, gastos e lucro. Tudo automático no SouArtista."
Dia 7:  "Já faz uma semana! Ainda dá tempo de organizar sua carreira. Assine!"
Dia 10: "Sentimos sua falta! O SouArtista está pronto pra te ajudar. Faça sua assinatura."
Dia 14: "Sua carreira musical merece organização. Volte pro SouArtista!"
Dia 21: "Ainda pensando? Músicos já estão usando o SouArtista. Não fique pra trás!"
Dia 30: "Última chamada! Faça sua assinatura e transforme sua carreira."
```

### NEW_USER_MESSAGES (10 total)
Expandir de 5 para 10 mensagens para quem assinou mas nunca cadastrou show, também com nome corrigido.

### Nenhum build necessário
Todas as mudanças são em Edge Functions (backend), sem necessidade de atualizar o app nas lojas.
