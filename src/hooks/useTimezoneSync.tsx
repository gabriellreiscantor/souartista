import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Hook that automatically syncs the user's device timezone to the database
 * whenever the app is opened or resumed. This ensures push notifications
 * are sent at the correct local time even after the user travels.
 */
export function useTimezoneSync() {
  const { user } = useAuth();
  const lastSyncedTimezone = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const syncTimezone = async () => {
      try {
        const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
        
        // Skip if timezone hasn't changed since last sync
        if (lastSyncedTimezone.current === currentTimezone) {
          return;
        }

        console.log('[useTimezoneSync] Syncing timezone:', currentTimezone);

        // Update profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ timezone: currentTimezone })
          .eq('id', user.id);

        if (profileError) {
          console.error('[useTimezoneSync] Error updating profile timezone:', profileError);
        }

        // Also update user_devices for all devices of this user
        const { error: deviceError } = await supabase
          .from('user_devices')
          .update({ timezone: currentTimezone })
          .eq('user_id', user.id);

        if (deviceError) {
          console.error('[useTimezoneSync] Error updating device timezone:', deviceError);
        }

        lastSyncedTimezone.current = currentTimezone;
        console.log('[useTimezoneSync] Timezone synced successfully:', currentTimezone);
      } catch (error) {
        console.error('[useTimezoneSync] Unexpected error:', error);
      }
    };

    // Delay inicial de 3 segundos para não bloquear o carregamento do app
    const initialDelay = setTimeout(() => {
      syncTimezone();
    }, 3000);

    // Also sync when the page becomes visible again (user returns to app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncTimezone();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialDelay);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id]);
}
