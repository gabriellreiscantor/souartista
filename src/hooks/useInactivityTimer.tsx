import { useEffect, useCallback, useRef } from 'react';

interface UseInactivityTimerOptions {
  timeout: number; // Tempo em milissegundos
  onTimeout: () => void; // Função chamada quando o tempo expira
  enabled?: boolean; // Se o timer está ativo
}

export function useInactivityTimer({
  timeout,
  onTimeout,
  enabled = true
}: UseInactivityTimerOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onTimeoutRef = useRef(onTimeout);

  // Mantém a referência atualizada
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onTimeoutRef.current();
    }, timeout);
  }, [timeout]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Eventos que indicam atividade do usuário
    const activityEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'touchmove',
      'click',
      'wheel'
    ];

    // Adiciona listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    // Inicia o timer
    resetTimer();

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [enabled, resetTimer]);

  return { resetTimer };
}
