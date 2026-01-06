import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppUpdate } from '@/hooks/useAppUpdate';

export const UpdateBanner = () => {
  const { 
    updateAvailable, 
    availableVersion, 
    openStore, 
    dismissUpdate,
    isIOS,
    isAndroid
  } = useAppUpdate();

  if (!updateAvailable) return null;

  const storeName = isIOS ? 'App Store' : isAndroid ? 'Play Store' : 'loja';

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-primary text-primary-foreground px-4 py-3 shadow-lg animate-in slide-in-from-top duration-300">
      <div className="flex items-center justify-between max-w-lg mx-auto gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Download className="h-5 w-5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">
              Nova versão disponível{availableVersion ? ` (${availableVersion})` : ''}!
            </p>
            <p className="text-xs opacity-90">
              Atualize para a melhor experiência
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="secondary"
            className="text-xs px-3 h-8"
            onClick={openStore}
          >
            Atualizar
          </Button>
          <button
            onClick={dismissUpdate}
            className="p-1 hover:bg-primary-foreground/10 rounded-full transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
