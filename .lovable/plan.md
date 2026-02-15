

## Criar pagina publica "/delete-account" para o Google Play

### Problema
O Google Play exige uma URL publica e acessivel sem login, onde o usuario consiga entender como solicitar a exclusao da conta. As paginas `/artist/settings` e `/musician/settings` exigem login e nao servem.

### Solucao
Criar uma pagina publica em `/delete-account` no mesmo estilo visual das paginas `/privacy` e `/terms` (que ja existem e sao publicas).

### Conteudo da pagina
A pagina vai explicar de forma clara:
1. O que acontece ao excluir a conta (todos os dados sao apagados permanentemente)
2. Lista dos dados que serao excluidos (shows, musicos, venues, despesas, assinatura, etc.)
3. Como excluir: passo a passo dentro do app (Ajustes → Zona de Perigo → Excluir Conta)
4. Alternativa por email: contato@souartista.app para quem nao conseguir acessar o app
5. Prazo de exclusao (imediata)

### O que sera feito

1. **Novo arquivo:** `src/pages/DeleteAccount.tsx`
   - Pagina publica, sem necessidade de login
   - Layout identico ao `/privacy` (header com logo + botao voltar, conteudo em prosa)
   - Branding SouArtista com cores roxas consistentes

2. **Alterar:** `src/App.tsx`
   - Adicionar rota publica `/delete-account` apontando para a nova pagina

### URL final para o Google
`https://souartista.lovable.app/delete-account`

### Precisa buildar no app?
Sim, esta e uma alteracao no frontend (nova pagina + nova rota). Mas nao afeta nenhuma funcionalidade existente.

### Secao tecnica
- Novo componente React puro (sem estado, sem hooks, sem chamadas ao backend)
- Rota publica adicionada junto com `/terms` e `/privacy` no App.tsx
- Segue exatamente o mesmo padrao de layout do `Privacy.tsx`
