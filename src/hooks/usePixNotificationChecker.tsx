import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para executar verificação de notificações PIX e assinaturas expiradas periodicamente
 * Executa a cada 1 hora
 */
export const usePixNotificationChecker = () => {
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        await Promise.all([
          supabase.functions.invoke('check-pix-notifications'),
          supabase.functions.invoke('check-expired-subscriptions'),
        ]);
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };

    // Executar imediatamente ao montar
    checkNotifications();

    // Executar a cada 1 hora
    const interval = setInterval(checkNotifications, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
};
