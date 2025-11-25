import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DemoLockedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoLockedModal({ open, onOpenChange }: DemoLockedModalProps) {
  const navigate = useNavigate();

  const handleCreateAccount = () => {
    navigate('/register');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-purple-600" />
          </div>
          <DialogTitle className="text-2xl text-center">
            Recurso Bloqueado
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Esta função está disponível apenas na versão completa do aplicativo.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <Button 
            onClick={handleCreateAccount} 
            size="lg" 
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Criar Conta e Desbloquear
          </Button>
          
          <Button 
            onClick={() => onOpenChange(false)} 
            variant="ghost" 
            size="lg" 
            className="w-full"
          >
            Continuar no Demo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
