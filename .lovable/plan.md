
# Plano: Corrigir Toasts Travados

## O problema

O app tem **dois sistemas de toast ao mesmo tempo**:

1. **Sonner** (o correto, renderizado no App.tsx) - usado pela maioria das páginas
2. **Radix Toast** (o antigo, via `useToast` de `@/hooks/use-toast`) - usado por ~12 arquivos

O Radix Toast **nao tem componente visual renderizado** no App.tsx (o `<Toaster />` do Radix foi removido antes), entao os toasts criados por ele ficam presos na memoria e nao somem corretamente. Esse e o bug.

## O que vai ser feito

### 1. Reduzir duracao do Sonner para 1 segundo
- Em `src/components/ui/sonner.tsx`: mudar `duration={3000}` para `duration={1000}`

### 2. Migrar TODOS os arquivos que usam o toast antigo para Sonner

Arquivos que ainda importam de `@/hooks/use-toast` e precisam migrar para `import { toast } from 'sonner'`:

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/artist/Settings.tsx` | `useToast` → `toast` do sonner |
| `src/pages/musician/Settings.tsx` | `useToast` → `toast` do sonner |
| `src/pages/Register.tsx` | `useToast` → `toast` do sonner |
| `src/pages/Login.tsx` | `useToast` → `toast` do sonner |
| `src/pages/ResetPassword.tsx` | `useToast` → `toast` do sonner |
| `src/pages/CompleteProfile.tsx` | `useToast` → `toast` do sonner |
| `src/pages/SelectRole.tsx` | `useToast` → `toast` do sonner |
| `src/pages/musician/Transportation.tsx` | `useToast` → `toast` do sonner |
| `src/hooks/useReferrals.tsx` | `useToast` → `toast` do sonner |
| `src/hooks/usePushNotifications.tsx` | `toast` do use-toast → `toast` do sonner |

### 3. Limpar arquivos mortos

Remover os arquivos do sistema antigo que nao serao mais usados:
- `src/hooks/use-toast.ts` (o hook antigo)
- `src/components/ui/use-toast.ts` (re-export)
- `src/components/ui/toaster.tsx` (componente Radix nao renderizado)
- `src/components/ui/toast.tsx` (componente visual Radix)

## Secao Tecnica

### Padrao de migracao

**Antes (Radix - bugado):**
```typescript
import { useToast } from '@/hooks/use-toast';
const { toast } = useToast();
toast({ title: 'Sucesso', description: 'Show cadastrado' });
```

**Depois (Sonner - correto):**
```typescript
import { toast } from 'sonner';
toast.success('Show cadastrado com sucesso!');
// ou para erros:
toast.error('Erro ao cadastrar show');
```

### Mapeamento de variantes
- `variant: 'destructive'` → `toast.error()`
- sem variant (default/success) → `toast.success()`
- title + description → mensagem unica ou `toast.success(title, { description })`

### Nenhum build necessario
Mudancas sao apenas no frontend web (React). O app nativo carrega o bundle atualizado automaticamente (se usar live update) ou na proxima build.
