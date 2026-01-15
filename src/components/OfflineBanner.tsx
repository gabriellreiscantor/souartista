import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

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

  // Define a variável CSS para ajustar o layout
  // Quando offline: banner aparece ABAIXO da safe-area, então o offset total = safe-area + banner
  // Quando online: offset = 0, as páginas usam apenas seu próprio safe-area-top
  useEffect(() => {
    if (isOnline) {
      document.documentElement.style.setProperty('--offline-banner-height', '0px');
    } else {
      document.documentElement.style.setProperty('--offline-banner-height', '36px');
    }
  }, [isOnline]);

  // Não mostra nada se está online - nenhum offset extra
  if (isOnline) return null;

  // Banner fixo que aparece ABAIXO da safe-area do dispositivo
  return (
    <div 
      className="fixed left-0 right-0 z-[9998] bg-amber-500 text-white px-4 flex items-center justify-center gap-2 text-sm font-medium shadow-md animate-fade-in"
      style={{ 
        top: 'env(safe-area-inset-top, 0px)',
        height: '36px'
      }}
    >
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">Você está offline</span>
    </div>
  );
};
