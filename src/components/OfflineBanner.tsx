import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <Alert className="fixed top-0 left-0 right-0 z-50 rounded-none border-destructive bg-destructive/10 text-destructive">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        Você está sem conexão com a internet. Algumas funcionalidades podem não estar disponíveis.
      </AlertDescription>
    </Alert>
  );
};
