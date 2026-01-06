import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useSupport() {
  const { user } = useAuth();
  const [isSupport, setIsSupport] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsSupport(false);
      setLoading(false);
      return;
    }

    checkSupport();
  }, [user]);

  const checkSupport = async () => {
    try {
      // Verificar se tem role 'support'
      const { data, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user?.id)
        .eq('role', 'support')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setIsSupport(!!data);
    } catch (error) {
      console.error('Error checking support status:', error);
      setIsSupport(false);
    } finally {
      setLoading(false);
    }
  };

  return { isSupport, loading };
}
