import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface LgpdRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const requestTypes = [
  { value: 'access', label: 'Acesso aos dados', description: 'Ver quais dados temos sobre você' },
  { value: 'correction', label: 'Correção de dados', description: 'Corrigir informações incorretas' },
  { value: 'deletion', label: 'Exclusão de dados', description: 'Solicitar remoção dos seus dados' },
  { value: 'portability', label: 'Portabilidade', description: 'Exportar seus dados' },
  { value: 'revocation', label: 'Revogação de consentimento', description: 'Revogar consentimentos dados' },
];

export const LgpdRequestModal = ({ open, onOpenChange }: LgpdRequestModalProps) => {
  const { userData, user } = useAuth();
  const [requestType, setRequestType] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!requestType) {
      toast.error('Selecione o tipo de solicitação.');
      return;
    }

    if (!user || !userData) {
      toast.error('Você precisa estar logado para fazer uma solicitação.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('lgpd_requests').insert({
        user_id: user.id,
        user_email: userData.email,
        user_name: userData.name,
        request_type: requestType,
        description: description || null,
        status: 'pending',
      });

      if (error) throw error;

      toast.success('Solicitação LGPD enviada com sucesso!');

      setRequestType('');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting LGPD request:', error);
      toast.error('Não foi possível enviar sua solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white sm:max-w-md border-gray-200">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Shield className="w-6 h-6 text-gray-600" />
            </div>
            <DialogTitle className="text-xl text-gray-900">Direitos LGPD</DialogTitle>
          </div>
          <DialogDescription className="text-gray-600">
            Exerça seus direitos de proteção de dados conforme a Lei Geral de Proteção de Dados (LGPD).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="request-type" className="text-gray-700">Tipo de Solicitação *</Label>
            <Select value={requestType} onValueChange={setRequestType}>
              <SelectTrigger id="request-type" className="bg-white border-gray-300 text-gray-900">
                <SelectValue placeholder="Selecione o tipo de solicitação" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                {requestTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-gray-900">
                    <div>
                      <span className="font-medium">{type.label}</span>
                      <span className="text-gray-500 ml-2 text-sm">- {type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-700">Descrição (opcional)</Label>
            <Textarea
              id="description"
              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
              placeholder="Forneça detalhes adicionais sobre sua solicitação..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} disabled={isSubmitting} className="bg-red-500 text-white border-red-500 hover:bg-red-500 hover:text-white">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !requestType}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Solicitação'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
