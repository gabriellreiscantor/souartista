import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function FeedbackForm() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    // Validação
    if (!title.trim()) {
      toast.error('Digite um título');
      return;
    }

    if (title.length > 100) {
      toast.error('Título muito longo (máximo 100 caracteres)');
      return;
    }

    if (!message.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }

    if (message.length > 800) {
      toast.error('Mensagem muito longa (máximo 800 caracteres)');
      return;
    }

    try {
      setSending(true);
      
      const { error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: user?.id,
          title: title.trim(),
          message: message.trim()
        });

      if (error) throw error;

      toast.success('Feedback enviado com sucesso! 🎉');
      setTitle('');
      setMessage('');
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      toast.error('Erro ao enviar feedback');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <MessageSquare className="h-5 w-5 text-primary" />
          Enviar Feedback
        </CardTitle>
        <CardDescription className="text-gray-600">
          Compartilhe suas sugestões, críticas ou ideias de melhorias
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="feedback-title" className="text-gray-900">
            Título *
          </Label>
          <Input
            id="feedback-title"
            placeholder="Ex: Sugestão para melhorar a página de shows"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="bg-white text-gray-900 border-gray-200"
          />
          <p className="text-xs text-gray-500">
            {title.length}/100 caracteres
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="feedback-message" className="text-gray-900">
            Mensagem *
          </Label>
          <Textarea
            id="feedback-message"
            placeholder="Descreva sua sugestão, crítica ou ideia..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={800}
            rows={6}
            className="bg-white text-gray-900 border-gray-200"
          />
          <p className="text-xs text-gray-500">
            {message.length}/800 caracteres
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={sending || !title.trim() || !message.trim()}
          className="w-full"
        >
          {sending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Enviar Feedback
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
