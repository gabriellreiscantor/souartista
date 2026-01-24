
# Plano: Corrigir Notificação de 30 Minutos

## Diagnóstico do Problema

Após análise detalhada dos logs e do código, identifiquei que **ZERO notificações de 30 minutos foram enviadas** (confirmado pela query no banco).

### Causa Raiz: Bug no Cálculo de Timezone

A função `getMinutesUntilShow` em `supabase/functions/_shared/timezone-utils.ts` tem um bug crítico na comparação de datas:

```text
┌─────────────────────────────────────────────────────────────┐
│                    SITUAÇÃO ATUAL                           │
├─────────────────────────────────────────────────────────────┤
│ Show: 23:00 BRT (2026-01-23)                               │
│ Cron roda às: 22:30 BRT (01:30 UTC)                        │
│                                                             │
│ Problema:                                                   │
│ - showDateTime = new Date(2026, 0, 23, 23, 0)              │
│   → Interpretado como 23:00 UTC (02:00 do dia 24 em BRT)   │
│                                                             │
│ - localTime = getCurrentTimeInTimezone('America/Sao_Paulo')│
│   → Retorna 22:30 (mas Date sem timezone = UTC)            │
│                                                             │
│ Cálculo: 23:00 - 22:30 = 30 min (PARECE CORRETO)          │
│ Realidade: Os objetos Date usam getTime() que opera em UTC │
│                                                             │
│ O bug aparece quando o servidor não está em UTC-3          │
└─────────────────────────────────────────────────────────────┘
```

Na verdade, após revisar mais profundamente, o problema é ainda mais sutil: **a janela de captura do cron é muito pequena**.

### Análise Detalhada do Timing

```text
Janela atual para 30 minutos:
  - min: 25 minutos
  - max: 35 minutos
  - Duração da janela: 10 minutos

Cron roda a cada: 30 minutos (00, 30)

CENÁRIO REAL (Show às 23:00):
┌────────────────────────────────────────────────────┐
│ Horário UTC  │ Horário BRT │ Minutos até show      │
├──────────────┼─────────────┼───────────────────────┤
│ 01:00 UTC    │ 22:00 BRT   │ 60 min (FORA: 25-35)  │
│ 01:30 UTC    │ 22:30 BRT   │ 30 min (DENTRO: 25-35)│
│ 02:00 UTC    │ 23:00 BRT   │ 0 min (show começou)  │
└────────────────────────────────────────────────────┘

PROBLEMA: O cron às 01:30 DEVERIA ter capturado!
```

Vou verificar se o problema está na execução ou na lógica. Analisando o código mais atentamente:

```javascript
// Na função getMinutesUntilShow:
const showDateTime = new Date(year, month - 1, day, hours, minutes, 0);
// Isso cria um Date no TIMEZONE LOCAL DO SERVIDOR (UTC em edge functions)
// Então 23:00 vira 23:00 UTC = 20:00 BRT

const localTime = getCurrentTimeInTimezone(timezone);
// Isso retorna a hora atual no timezone do usuário
// Mas também como Date local (sem offset real)
```

**O verdadeiro bug:** Ambas as datas são criadas sem timezone real, então quando comparadas via `getTime()`, uma representa UTC e a outra representa o horário local do usuário - mas ambas são tratadas como se estivessem no mesmo timezone.

## Solução Proposta

Corrigir a função `getMinutesUntilShow` para garantir que ambos os horários (show e atual) sejam calculados consistentemente no mesmo timezone.

### Mudanças no Arquivo

**Arquivo:** `supabase/functions/_shared/timezone-utils.ts`

**Função a modificar:** `getMinutesUntilShow` (linhas 185-211)

### Nova Lógica

Em vez de criar objetos `Date` que perdem informação de timezone, vou:

1. Calcular a hora atual do usuário em minutos desde meia-noite
2. Calcular a hora do show em minutos desde meia-noite  
3. Ajustar para diferença de dias se necessário
4. Comparar diretamente os valores em minutos

```javascript
export function getMinutesUntilShow(
  showDateLocal: string,
  showTimeLocal: string,
  timezone: string
): number {
  try {
    // Obter data/hora atual no timezone do usuário
    const { today } = getRelativeDatesInTimezone(timezone);
    const localTime = getCurrentTimeInTimezone(timezone);
    
    // Hora atual em minutos desde meia-noite
    const currentMinutes = localTime.getHours() * 60 + localTime.getMinutes();
    
    // Hora do show em minutos desde meia-noite
    const [hours, minutes] = (showTimeLocal || '20:00').split(':').map(Number);
    const showMinutes = hours * 60 + minutes;
    
    // Calcular diferença de dias
    const showDate = new Date(showDateLocal + 'T00:00:00');
    const todayDate = new Date(today + 'T00:00:00');
    const daysDiff = Math.round(
      (showDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Calcular minutos totais até o show
    const totalMinutes = (daysDiff * 24 * 60) + (showMinutes - currentMinutes);
    
    return totalMinutes;
  } catch (error) {
    console.warn(`[timezone-utils] Error calculating minutes until show:`, error);
    return -1;
  }
}
```

### Também Aumentar a Janela de Captura

Para garantir que o cron capture mesmo com pequenas variações, vou aumentar a janela:

**Arquivo:** `supabase/functions/check-show-reminders/index.ts`

```javascript
// De:
'30_minutes': { min: 25, max: 35 }   // janela de 10 min

// Para:
'30_minutes': { min: 15, max: 45 }   // janela de 30 min
```

Isso garante que o cron que roda a cada 30 minutos capture a notificação de 30 minutos independentemente de quando exatamente ela deveria cair.

## Resumo das Mudanças

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/_shared/timezone-utils.ts` | Reescrever `getMinutesUntilShow` para calcular minutos usando operações de timezone consistentes |
| `supabase/functions/check-show-reminders/index.ts` | Aumentar janela de `30_minutes` de {25-35} para {15-45} |

## Resultado Esperado

Após as correções:
- Notificação de 30 minutos será enviada corretamente
- Usuários em qualquer timezone receberão a notificação
- A janela maior garante captura pelo cron mesmo com variações de timing

## Seção Técnica

### Por que o bug acontecia

Edge Functions do Supabase rodam em UTC. Quando criamos `new Date(2026, 0, 23, 23, 0, 0)`, isso é interpretado como 23:00 UTC. Mas o show é às 23:00 no timezone local do usuário (ex: BRT = UTC-3), que seria 02:00 UTC.

A função `getCurrentTimeInTimezone` retornava corretamente a hora local, mas como um objeto `Date` sem offset real. Quando comparado com o `showDateTime` (também sem offset), a diferença de 3 horas se perdia.

### Nova abordagem

A nova lógica evita criar objetos `Date` com horários específicos. Em vez disso:
1. Usa apenas comparação de datas (YYYY-MM-DD)
2. Calcula minutos desde meia-noite para ambos (show e atual)
3. Combina diferença de dias + diferença de minutos

Isso elimina completamente problemas de timezone na comparação.
