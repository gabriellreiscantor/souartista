

# Plano: Corrigir campos que somem ao editar show

## Problema encontrado

Achei **2 bugs** no formulario de editar show:

### Bug 1: Nome do local some
Quando voce edita um show, o codigo salva o **nome** do local (ex: "Bar do Ze"), mas na hora de editar ele tenta usar o **ID** do local no dropdown. Como o ID fica vazio, aparece "Selecione um local" mesmo tendo um local salvo.

**Correcao:** Na funcao `handleShowEdit`, buscar o venue pelo nome e preencher o `venue_id` correto. Se nao encontrar (local deletado ou evento particular), usar o campo de texto.

### Bug 2: Duracao sempre volta pra 4 horas
O dropdown de duracao esta com `defaultValue="4h"` fixo no codigo. Ele nao esta conectado a nenhum estado nem salva no banco. O banco ja tem a coluna `duration_hours` com padrao 3, mas o formulario ignora ela completamente.

**Correcao:**
- Adicionar `duration_hours` ao estado do formulario (padrao: "3")
- Conectar o Select com `value` e `onValueChange` ao estado
- Carregar o valor salvo quando editar
- Salvar o valor no banco quando salvar o show
- Mudar padrao de "4h" para "3h"

## Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/artist/Shows.tsx` | Corrigir os 2 bugs no formulario (mobile e desktop) |

## Secao Tecnica

### Mudancas no estado do formulario

```text
showFormData atual:
  venue_id, custom_venue, date_local, time_local, fee, is_private_event

showFormData novo:
  venue_id, custom_venue, date_local, time_local, fee, is_private_event, duration_hours
```

### handleShowEdit - correcao do venue

```text
Antes:
  venue_id: ''  (sempre vazio)

Depois:
  venue_id: venues.find(v => v.name === show.venue_name)?.id || 'custom'
  custom_venue: show.venue_name (caso nao encontre o venue pelo nome)
```

### handleShowEdit - correcao da duracao

```text
Antes:
  duration_hours nao existia no form

Depois:
  duration_hours: show.duration_hours?.toString() || '3'
```

### handleShowSubmit - salvar duracao

```text
showData vai incluir:
  duration_hours: parseFloat(showFormData.duration_hours)
```

### Select de duracao (mobile e desktop) - 4 pontos no codigo

```text
Antes:
  <Select defaultValue="4h">

Depois:
  <Select value={showFormData.duration_hours + 'h'} onValueChange={v => setShowFormData({...showFormData, duration_hours: v.replace('h', '')})}>
```

### resetShowForm

```text
Antes:
  duration_hours nao existia

Depois:
  duration_hours: '3'  (padrao 3 horas como voce pediu)
```

### Interface Show

Adicionar `duration_hours?: number` ao tipo Show local.

### Impacto
- Muda apenas 1 arquivo frontend
- Usa coluna `duration_hours` que ja existe no banco com default 3
- Precisa de build no Codemagic para chegar no app nativo
