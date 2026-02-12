

## Correção da data de expiração no modal de usuário retornado

### Problema
A query que busca a assinatura expirada seleciona apenas `status` e `updated_at`, e usa `updated_at` como data de expiração. Isso mostra a data em que o registro foi modificado pelo sistema, não a data real em que a assinatura venceu.

### Solução
No arquivo `src/pages/Subscribe.tsx`:

1. **Linha 113** - Adicionar `next_due_date` no select da query:
   - De: `select('status, updated_at')`
   - Para: `select('status, updated_at, next_due_date')`

2. **Linha 157** - Usar `next_due_date` como data de expiração, com fallback para `updated_at`:
   - De: `expirationDate: subscription.updated_at`
   - Para: `expirationDate: subscription.next_due_date || subscription.updated_at`

Assim, o modal vai mostrar a data real de vencimento da assinatura. Se por algum motivo essa data não existir, ele ainda mostra a data de modificação como fallback.
