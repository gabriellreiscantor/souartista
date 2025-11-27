import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsReconnecting(true);
      // Aguardar 1.5 segundos antes de recarregar para garantir conexão estável
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (isOnline) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: '#1E082B' }}
    >
      {/* Glow central suave */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-[#B96FFF] opacity-[0.08] blur-[120px] rounded-full animate-float" />
      </div>

      {/* Vignette nas bordas */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(30, 8, 43, 0.6) 100%)'
        }} 
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center max-w-md animate-fade-in">
        {/* Animated Icon */}
        <div className="mb-8 animate-scale-in">
          <div className="relative">
            <WifiOff className="w-24 h-24 text-primary drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]" />
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4 animate-fade-in">
          {isReconnecting ? 'Reconectando...' : 'Sem conexão'}
        </h1>

        {/* Message */}
        <p className="text-lg text-gray-300 mb-8 animate-fade-in">
          {isReconnecting 
            ? 'Sua conexão foi restabelecida. Recarregando...'
            : 'Você está offline. Verifique sua conexão com a internet e tente novamente.'
          }
        </p>

        {/* Action Button */}
        {!isReconnecting && (
          <Button 
            size="lg" 
            onClick={handleRefresh}
            className="rounded-full text-lg font-medium shadow-primary hover:scale-105 transition-transform animate-fade-in"
          >
            <RefreshCw className="mr-2 w-5 h-5" />
            Tentar novamente
          </Button>
        )}

        {/* Additional info */}
        <p className="text-sm text-gray-400 mt-6 animate-fade-in">
          Esta página será atualizada automaticamente quando a conexão for restabelecida
        </p>
      </div>
    </div>
  );
};
