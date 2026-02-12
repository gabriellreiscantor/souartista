

## Ajuste visual do botão "Depois" no modal de atualização

O botão "Depois" no `UpdateBanner.tsx` (linha ~56) será alterado para ter fundo branco e texto preto.

### Mudança

No arquivo `src/components/UpdateBanner.tsx`, o botão "Depois" terá suas classes atualizadas:

- **De:** `variant="outline"` com classes `text-gray-600 border-gray-300 hover:bg-gray-50`
- **Para:** Fundo branco, texto preto, com borda sutil para manter contraste

Classes finais: `bg-white text-black border border-gray-300 hover:bg-gray-100`

