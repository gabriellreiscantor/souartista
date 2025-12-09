import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
import { UserMenu } from '@/components/UserMenu';
import { NotificationBell } from '@/components/NotificationBell';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Plus, MessageSquare, Clock, CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePlanType } from '@/hooks/usePlanType';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  attachment_url?: string | null;
}

interface Response {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  user_id: string;
}

const ArtistSupport = () => {
  const { user, userData } = useAuth();
  const { isAnnualPlan } = usePlanType();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [newResponse, setNewResponse] = useState('');
  
  // New ticket form
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Erro ao carregar tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchResponses = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_responses')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setResponses(data || []);
    } catch (error) {
      console.error('Error fetching responses:', error);
    }
  };

  const handleCreateTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      setUploading(true);
      let attachmentUrl = null;

      // Upload attachment if exists
      if (attachmentFile) {
        const fileExt = attachmentFile.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('support-attachments')
          .upload(fileName, attachmentFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('support-attachments')
          .getPublicUrl(fileName);

        attachmentUrl = publicUrl;
      }

      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user?.id,
          subject,
          message,
          priority,
          status: 'open',
          attachment_url: attachmentUrl
        });

      if (error) throw error;

      toast.success('Ticket criado com sucesso!');
      setSubject('');
      setMessage('');
      setPriority('medium');
      setAttachmentFile(null);
      setDialogOpen(false);
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Erro ao criar ticket');
    } finally {
      setUploading(false);
    }
  };

  const handleSendResponse = async () => {
    if (!newResponse.trim() || !selectedTicket) return;

    try {
      const { error } = await supabase
        .from('support_responses')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user?.id,
          message: newResponse,
          is_admin: false
        });

      if (error) throw error;

      toast.success('Resposta enviada!');
      setNewResponse('');
      fetchResponses(selectedTicket.id);
    } catch (error) {
      console.error('Error sending response:', error);
      toast.error('Erro ao enviar resposta');
    }
  };

  const openTicketDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    fetchResponses(ticket.id);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      open: 'default',
      in_progress: 'secondary',
      resolved: 'default',
      closed: 'secondary'
    };

    const icons = {
      open: Clock,
      in_progress: MessageSquare,
      resolved: CheckCircle,
      closed: XCircle
    };

    const Icon = icons[status as keyof typeof icons] || Clock;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] as any} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status === 'open' ? 'Aberto' : 
         status === 'in_progress' ? 'Em Andamento' :
         status === 'resolved' ? 'Resolvido' : 'Fechado'}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[priority as keyof typeof colors]}>
        {priority === 'low' ? 'Baixa' :
         priority === 'medium' ? 'Média' :
         priority === 'high' ? 'Alta' : 'Urgente'}
      </Badge>
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <ArtistSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-4 md:px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Suporte</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <NotificationBell />
              <UserMenu userName={userData?.name} userRole="artist" photoUrl={userData?.photo_url} />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6 scrollbar-hide" style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Central de Suporte</h2>
                  <p className="text-gray-600 mt-1">Gerencie seus tickets e obtenha ajuda</p>
                </div>
                
                <div className="flex items-center gap-3">
                  {isAnnualPlan && (
                    <Button
                      onClick={() => window.open('https://wa.me/SEUNUMERO', '_blank')}
                      className="bg-[#25D366] hover:bg-[#20BA5A] text-white"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Suporte WhatsApp
                    </Button>
                  )}
                  
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-white hover:bg-primary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Ticket
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white text-black">
                    <DialogHeader>
                      <DialogTitle className="text-black">Criar Novo Ticket</DialogTitle>
                      <DialogDescription className="text-gray-600">
                        Descreva seu problema ou dúvida e nossa equipe responderá em breve.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assunto
                        </label>
                        <Input
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Ex: Problema com pagamento"
                          className="bg-white text-black placeholder:text-gray-400 capitalize"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prioridade
                        </label>
                        <Select value={priority} onValueChange={setPriority}>
                          <SelectTrigger className="bg-white text-black">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white text-black">
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="urgent">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mensagem
                        </label>
                        <Textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Descreva detalhadamente seu problema..."
                          rows={5}
                          className="bg-white text-black placeholder:text-gray-400 capitalize"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Anexar Print (opcional)
                        </label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                          className="bg-white text-black"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Formatos aceitos: JPG, PNG, GIF, WEBP. Tamanho máximo: 15MB
                        </p>
                      </div>

                      <Button 
                        onClick={handleCreateTicket}
                        disabled={uploading}
                        className="w-full bg-primary text-white hover:bg-primary/90"
                      >
                        {uploading ? 'Enviando...' : 'Criar Ticket'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                </div>
              </div>

              {/* Tickets List */}
              <div className="grid gap-4">
                {tickets.length === 0 ? (
                  <Card className="bg-white border-gray-200">
                    <CardContent className="p-12 text-center">
                      <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Nenhum ticket ainda
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Crie seu primeiro ticket para obter suporte
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  tickets.map((ticket) => (
                    <Card 
                      key={ticket.id} 
                      className="bg-white border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => openTicketDetails(ticket)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-gray-900">
                              {ticket.subject}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {ticket.message}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Ticket Details Dialog */}
              {selectedTicket && (
                <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
                  <DialogContent className="bg-white max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-xl">{selectedTicket.subject}</DialogTitle>
                      <div className="flex gap-2 mt-2">
                        {getStatusBadge(selectedTicket.status)}
                        {getPriorityBadge(selectedTicket.priority)}
                      </div>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                      {/* Original Message */}
                      <Card className="bg-gray-50 border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-gray-900">Você</span>
                            <span className="text-xs text-gray-600">
                              {format(new Date(selectedTicket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-gray-700">{selectedTicket.message}</p>
                          {selectedTicket.attachment_url && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-600 mb-2">Anexo:</p>
                              <a 
                                href={selectedTicket.attachment_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img 
                                  src={selectedTicket.attachment_url} 
                                  alt="Anexo do ticket" 
                                  className="max-w-full h-auto rounded border border-gray-300 hover:opacity-90 transition-opacity"
                                  style={{ maxHeight: '400px' }}
                                />
                              </a>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Responses */}
                      {responses.map((response) => (
                        <Card 
                          key={response.id} 
                          className={response.is_admin ? "bg-purple-50 border-purple-200" : "bg-gray-50 border-gray-200"}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-semibold text-gray-900">
                                {response.is_admin ? '🎧 Suporte' : 'Você'}
                              </span>
                              <span className="text-xs text-gray-600">
                                {format(new Date(response.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            <p className="text-gray-700">{response.message}</p>
                          </CardContent>
                        </Card>
                      ))}

                      {/* New Response Input */}
                      {selectedTicket.status !== 'closed' && (
                        <div className="space-y-3">
                          <Textarea
                            value={newResponse}
                            onChange={(e) => setNewResponse(e.target.value)}
                            placeholder="Digite sua resposta..."
                            rows={3}
                            className="bg-white"
                          />
                          <Button 
                            onClick={handleSendResponse}
                            className="w-full bg-primary text-white hover:bg-primary/90"
                            disabled={!newResponse.trim()}
                          >
                            Enviar Resposta
                          </Button>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </main>
        </div>
        
        <MobileBottomNav role="artist" />
      </div>
    </SidebarProvider>
  );
};

export default ArtistSupport;
