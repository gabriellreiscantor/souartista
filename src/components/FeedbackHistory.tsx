import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, MessageCircle, Clock, CheckCircle2, XCircle, Lightbulb, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Feedback {
  id: string;
  title: string;
  message: string;
  status: string;
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  pending: {
    label: 'Pendente',
    variant: 'secondary',
    icon: <Clock className="h-3 w-3" />
  },
  reviewed: {
    label: 'Revisado',
    variant: 'default',
    icon: <CheckCircle2 className="h-3 w-3" />
  },
  implemented: {
    label: 'Implementado',
    variant: 'default',
    icon: <Lightbulb className="h-3 w-3" />
  },
  dismissed: {
    label: 'Descartado',
    variant: 'destructive',
    icon: <XCircle className="h-3 w-3" />
  }
};

export function FeedbackHistory() {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchMyFeedbacks();
    }
  }, [user?.id]);

  const fetchMyFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from('user_feedback')
        .select('id, title, message, status, admin_response, responded_at, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
      console.error('Erro ao buscar feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (feedbacks.length === 0) {
    return null; // Não mostrar nada se não houver feedbacks
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <MessageSquare className="h-5 w-5 text-primary" />
          Meus Feedbacks
        </CardTitle>
        <CardDescription className="text-gray-600">
          Histórico dos seus feedbacks enviados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedbacks.map((feedback) => {
          const status = statusConfig[feedback.status] || statusConfig.pending;
          
          return (
            <div 
              key={feedback.id} 
              className="border border-border rounded-lg p-4 space-y-3"
            >
              {/* Header com título e status */}
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-gray-900 flex-1">
                  {feedback.title}
                </h4>
                <Badge variant={status.variant} className="flex items-center gap-1 shrink-0">
                  {status.icon}
                  {status.label}
                </Badge>
              </div>
              
              {/* Mensagem original */}
              <p className="text-sm text-gray-600 line-clamp-2">
                {feedback.message}
              </p>
              
              {/* Data de envio */}
              <p className="text-xs text-gray-500">
                Enviado em {format(new Date(feedback.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              
              {/* Resposta do Admin */}
              {feedback.admin_response && (
                <div className="bg-primary/10 p-3 rounded-lg border-l-4 border-primary mt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Resposta da Equipe</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {feedback.admin_response}
                  </p>
                  {feedback.responded_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      {format(new Date(feedback.responded_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
