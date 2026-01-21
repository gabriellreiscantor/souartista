import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para executar verificação de notificações PIX e assinaturas expiradas periodicamente
 * Executa a cada 1 hora, mas só após verificar que o usuário está logado
 * Inclui delay inicial para não bloquear o carregamento do app
 */
export const usePixNotificationChecker = () => {
  const hasCheckedInitial = useRef(false);

  useEffect(() => {
    const checkNotifications = async () => {
      try {
        // Verificar se usuário está logado antes de chamar
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('[usePixNotificationChecker] Skipping - no active session');
          return;
        }

        await Promise.all([
          supabase.functions.invoke('check-pix-notifications'),
          supabase.functions.invoke('check-expired-subscriptions'),
        ]);
      } catch (error) {
        console.error('[usePixNotificationChecker] Error checking notifications:', error);
      }
    };

    // Delay inicial de 5 segundos para não bloquear o carregamento do app
    const initialDelay = setTimeout(() => {
      if (!hasCheckedInitial.current) {
        hasCheckedInitial.current = true;
        checkNotifications();
      }
    }, 5000);

    // Executar a cada 1 hora
    const interval = setInterval(checkNotifications, 60 * 60 * 1000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);
};
