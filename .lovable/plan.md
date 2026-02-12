

## Correção do botão "Depois" no modal de debug do Admin

O problema é que existe uma copia do modal de atualização dentro do arquivo `src/pages/Admin.tsx` (usado para testes via "Testar Banners"). Esse modal tem seu proprio estilo e nao foi atualizado junto com o `UpdateBanner.tsx`.

### O que sera feito

**Arquivo:** `src/pages/Admin.tsx` (linha 6506)

Alterar as classes do botao "Depois" de:
```
className="w-full sm:w-auto text-gray-600 border-gray-300 hover:bg-gray-50"
```

Para:
```
className="w-full sm:w-auto bg-white text-black border border-gray-300 hover:bg-gray-100"
```

Isso vai deixar o botao com fundo branco e texto preto, igual ao segundo print de referencia.
