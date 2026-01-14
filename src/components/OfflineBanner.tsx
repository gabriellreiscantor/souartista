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
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--offline-banner-height',
      isOnline ? '0px' : '36px'
    );
  }, [isOnline]);

  // Não mostra nada se está online
  if (isOnline) return null;

  // Banner sutil no topo (não bloqueia a tela)
  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] bg-amber-500 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium shadow-md animate-fade-in h-9">
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">Você está offline • Visualizando dados em cache</span>
    </div>
  );
};
