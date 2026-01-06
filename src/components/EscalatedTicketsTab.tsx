import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle, MessageCircle, Send, CheckCircle, ArrowDownLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EscalatedTicket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  escalated_to_admin: boolean;
  escalated_at: string;
  escalation_reason: string;
  escalated_by: string;
  attachment_url?: string;
  profile?: {
    id: string;
    name: string;
    email: string;
  };
  escalator?: {
    name: string;
    email: string;
  };
}

export function EscalatedTicketsTab() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<EscalatedTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<EscalatedTicket | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchEscalatedTickets();
  }, []);

  const fetchEscalatedTickets = async () => {
    try {
      setLoading(true);
      
      const { data: ticketsData, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('escalated_to_admin', true)
        .order('escalated_at', { ascending: false });

      if (error) throw error;

      if (!ticketsData || ticketsData.length === 0) {
        setTickets([]);
        return;
      }

      // Fetch user profiles
      const userIds = [...new Set(ticketsData.map(t => t.user_id))];
      const escalatorIds = [...new Set(ticketsData.map(t => t.escalated_by).filter(Boolean))];
      const allIds = [...new Set([...userIds, ...escalatorIds])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', allIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const ticketsWithProfiles = ticketsData.map(ticket => ({
        ...ticket,
        profile: profilesMap.get(ticket.user_id),
        escalator: ticket.escalated_by ? profilesMap.get(ticket.escalated_by) : undefined
      }));

      setTickets(ticketsWithProfiles);
    } catch (error) {
      console.error('Erro ao buscar tickets escalados:', error);
      toast.error('Erro ao carregar tickets escalados');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!selectedTicket || !responseMessage.trim()) return;

    try {
      setSendingResponse(true);

      // Insert response
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: responseError } = await supabase
        .from('support_responses')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user?.id,
          message: responseMessage,
          is_admin: true
        });

      if (responseError) throw responseError;

      // Send notification
      await supabase.functions.invoke('create-notification', {
        body: {
          userId: selectedTicket.user_id,
          title: '💬 Resposta do Admin no seu ticket',
          message: `Seu ticket "${selectedTicket.subject}" recebeu uma resposta.`,
          link: '/app-hub'
        }
      });

      toast.success('Resposta enviada!');
      setResponseMessage('');
      setShowDialog(false);
      fetchEscalatedTickets();
    } catch (error) {
      console.error('Erro ao responder:', error);
      toast.error('Erro ao enviar resposta');
    } finally {
      setSendingResponse(false);
    }
  };

  const handleResolve = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          status: 'resolved',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;
      toast.success('Ticket resolvido!');
      fetchEscalatedTickets();
      setShowDialog(false);
    } catch (error) {
      console.error('Erro ao resolver:', error);
      toast.error('Erro ao resolver ticket');
    }
  };

  const handleDeescalate = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          escalated_to_admin: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;
      toast.success('Ticket devolvido ao suporte!');
      fetchEscalatedTickets();
      setShowDialog(false);
    } catch (error) {
      console.error('Erro ao devolver:', error);
      toast.error('Erro ao devolver ticket');
    }
  };

  const filteredTickets = tickets.filter(t => 
    statusFilter === 'all' || t.status === statusFilter
  );

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="p-3 md:p-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <CardTitle className="text-gray-900 text-base md:text-lg">Tickets Escalados</CardTitle>
            <Badge className="bg-orange-500">{tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length}</Badge>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="open">Abertos</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="resolved">Resolvidos</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchEscalatedTickets}>
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 md:p-6 pt-0">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum ticket escalado
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <Card key={ticket.id} className="border-orange-200 bg-orange-50/50">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                        <p className="text-sm text-gray-600">
                          {ticket.profile?.name} • {ticket.profile?.email}
                        </p>
                      </div>
                      <Badge className={ticket.status === 'resolved' ? 'bg-green-500' : 'bg-orange-500'}>
                        {ticket.status === 'resolved' ? 'Resolvido' : 'Escalado'}
                      </Badge>
                    </div>
                    
                    <div className="bg-orange-100 rounded p-2 text-sm">
                      <span className="font-medium">Motivo:</span> {ticket.escalation_reason}
                    </div>
                    
                    <p className="text-sm text-gray-700 line-clamp-2">{ticket.message}</p>
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedTicket(ticket); setShowDialog(true); }}>
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Ver / Responder
                      </Button>
                      {ticket.status !== 'resolved' && (
                        <>
                          <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleResolve(ticket.id)}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolver
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeescalate(ticket.id)}>
                            <ArrowDownLeft className="h-4 w-4 mr-1" />
                            Devolver
                          </Button>
                        </>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500 pt-2 border-t">
                      Escalado por {ticket.escalator?.name || 'N/A'} em {ticket.escalated_at ? format(new Date(ticket.escalated_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
            <DialogDescription>
              {selectedTicket?.profile?.name} • {selectedTicket?.escalation_reason}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4">
              <div className="bg-gray-100 rounded p-3">
                <p className="text-sm whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>
              
              <div className="space-y-2">
                <Textarea
                  placeholder="Digite sua resposta..."
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Fechar</Button>
            <Button onClick={handleRespond} disabled={sendingResponse || !responseMessage.trim()}>
              {sendingResponse ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Responder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
