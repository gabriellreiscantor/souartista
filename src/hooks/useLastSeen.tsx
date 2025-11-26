import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Hook para atualizar o last_seen_at do usuário
 * Atualiza quando o usuário acessa a aplicação
 */
export const useLastSeen = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const updateLastSeen = async () => {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating last_seen_at:', error);
        }
      } catch (error) {
        console.error('Error in updateLastSeen:', error);
      }
    };

    // Atualizar imediatamente ao montar
    updateLastSeen();

    // Atualizar a cada 5 minutos enquanto o usuário está ativo
    const interval = setInterval(updateLastSeen, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user?.id]);
};
