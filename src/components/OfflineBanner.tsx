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

  // Define a variável CSS para ajustar o layout (inclui safe-area)
  useEffect(() => {
    const bannerHeight = isOnline ? '0px' : '36px';
    document.documentElement.style.setProperty('--offline-banner-height', bannerHeight);
  }, [isOnline]);

  // Não mostra nada se está online
  if (isOnline) return null;

  // Banner que respeita safe-area-inset-top
  return (
    <div 
      className="fixed left-0 right-0 z-[9998] bg-amber-500 text-white px-4 flex items-center justify-center gap-2 text-sm font-medium shadow-md animate-fade-in"
      style={{ 
        top: 'env(safe-area-inset-top, 0px)',
        height: '36px'
      }}
    >
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">Você está offline • Visualizando dados em cache</span>
    </div>
  );
};
