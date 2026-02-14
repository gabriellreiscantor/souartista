

## Correção do nome "Seu Artista" para "SouArtista" no email de verificação OTP

### Problema
O email de verificação (código OTP) enviado pelo Resend e pelo Brevo está com o nome errado: **"Seu Artista"** em vez de **"SouArtista"**.

### Impacto
Apenas visual no email — a funcionalidade do OTP continua funcionando normalmente.

### Precisa buildar?
**Nao!** A alteracao e 100% no backend (Edge Function `send-otp-email`). Assim que salvar, ja entra no ar automaticamente.

### O que sera alterado

**Arquivo:** `supabase/functions/send-otp-email/index.ts`

Todas as ocorrencias de "Seu Artista" serao trocadas por "SouArtista" nos templates HTML de email:

1. **Template do Resend (principal):**
   - Titulo `<h1>`: "Seu Artista" → "SouArtista"
   - Texto de boas-vindas: "Bem-vindo ao Seu Artista!" → "Bem-vindo ao SouArtista!"
   - Texto do corpo: "usar o Seu Artista" → "usar o SouArtista"
   - Remetente (from): "Seu Artista" → "SouArtista"
   - Rodape: "Seu Artista. Todos os direitos reservados" → "SouArtista. Todos os direitos reservados"

2. **Template do Brevo (fallback):**
   - Titulo `<h1>`: "Seu Artista" → "SouArtista"
   - Texto de boas-vindas: "Bem-vindo ao Seu Artista!" → "Bem-vindo ao SouArtista!"
   - Subject do email: "Seu Artista" → "SouArtista"
   - Nome do remetente (sender.name): "Seu Artista" → "SouArtista"
   - Rodape: "Seu Artista. Todos os direitos reservados" → "SouArtista. Todos os direitos reservados"

3. **Subject do email Resend:**
   - "Seu código de verificação - Seu Artista" → "Seu código de verificação - SouArtista"

### Total de alteracoes
Aproximadamente **12 substituicoes** de texto no mesmo arquivo. Nenhuma logica ou configuracao sera modificada — apenas o texto exibido no email.

### Secao tecnica
- Arquivo unico: `supabase/functions/send-otp-email/index.ts`
- Apenas substituicoes de string em templates HTML inline
- Nenhuma alteracao em logica de envio, geracao de OTP, fallback Resend/Brevo, ou banco de dados
- Deploy automatico apos salvar
