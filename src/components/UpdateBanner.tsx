import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const UpdateBanner = () => {
  const { 
    updateAvailable, 
    availableVersion, 
    openStore, 
    dismissUpdate,
    isIOS,
    isAndroid
  } = useAppUpdate();

  // Não mostrar em web
  if (!isIOS && !isAndroid) return null;
  if (!updateAvailable) return null;

  const storeName = isIOS ? 'App Store' : 'Play Store';

  return (
    <Dialog open={updateAvailable} onOpenChange={(open) => !open && dismissUpdate()}>
      <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-xl">
        <DialogHeader className="text-center sm:text-center pt-2">
          <div className="flex justify-center mb-5">
            <div className="p-4 rounded-full bg-primary shadow-lg">
              <Download className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <DialogTitle className="text-2xl font-bold text-center text-gray-900">
            Nova versão disponível!
          </DialogTitle>
          
          <DialogDescription className="text-center pt-3 text-base text-gray-600 leading-relaxed">
            Atualize agora para aproveitar as últimas melhorias e novidades do aplicativo.
          </DialogDescription>
          
          <p className="text-center text-sm text-gray-500 mt-2">
            Disponível na {storeName}
          </p>
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button
            variant="outline"
            onClick={dismissUpdate}
            className="w-full sm:w-auto bg-white text-black border border-gray-300 hover:bg-gray-100"
          >
            Depois
          </Button>
          <Button 
            onClick={openStore}
            className="w-full sm:w-auto min-w-[140px] h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            Atualizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
