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
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [requestType, setRequestType] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!requestType) {
      toast({
        title: 'Erro',
        description: 'Selecione o tipo de solicitação.',
        variant: 'destructive',
      });
      return;
    }

    if (!user || !userData) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para fazer uma solicitação.',
        variant: 'destructive',
      });
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

      toast({
        title: 'Solicitação enviada',
        description: 'Sua solicitação LGPD foi registrada. Entraremos em contato em breve.',
      });

      setRequestType('');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting LGPD request:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar sua solicitação. Tente novamente.',
        variant: 'destructive',
      });
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
            <Label htmlFor="request-type">Tipo de Solicitação *</Label>
            <Select value={requestType} onValueChange={setRequestType}>
              <SelectTrigger id="request-type">
                <SelectValue placeholder="Selecione o tipo de solicitação" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {requestTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
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
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Forneça detalhes adicionais sobre sua solicitação..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
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
