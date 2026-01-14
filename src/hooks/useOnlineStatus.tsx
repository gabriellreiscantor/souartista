import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface OnlineStatusState {
  isOnline: boolean;
  wasOffline: boolean;
}

export function useOnlineStatus() {
  const [state, setState] = useState<OnlineStatusState>({
    isOnline: navigator.onLine,
    wasOffline: false,
  });

  const handleOnline = useCallback(() => {
    setState(prev => {
      // Só mostra toast se estava offline antes
      if (!prev.isOnline || prev.wasOffline) {
        toast.success('Conexão restaurada', {
          description: 'Você está online novamente',
          duration: 3000,
        });
      }
      return { isOnline: true, wasOffline: false };
    });
  }, []);

  const handleOffline = useCallback(() => {
    setState({ isOnline: false, wasOffline: true });
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  const requireOnline = useCallback((action: string): boolean => {
    if (!state.isOnline) {
      toast.error('Sem conexão com a internet', {
        description: `${action} requer conexão com a internet`,
        duration: 4000,
      });
      return false;
    }
    return true;
  }, [state.isOnline]);

  return {
    isOnline: state.isOnline,
    requireOnline,
  };
}
