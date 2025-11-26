import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para executar verificação de notificações PIX periodicamente
 * Executa a cada 1 hora
 */
export const usePixNotificationChecker = () => {
  useEffect(() => {
    const checkPixNotifications = async () => {
      try {
        await supabase.functions.invoke('check-pix-notifications');
      } catch (error) {
        console.error('Error checking PIX notifications:', error);
      }
    };

    // Executar imediatamente ao montar
    checkPixNotifications();

    // Executar a cada 1 hora
    const interval = setInterval(checkPixNotifications, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
};
