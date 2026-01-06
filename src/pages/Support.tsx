import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSupport } from '@/hooks/useSupport';
import { useAdmin } from '@/hooks/useAdmin';
import { useNativePlatform } from '@/hooks/useNativePlatform';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Loader2, 
  MessageCircle, 
  Send, 
  Filter,
  Ticket,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  LogOut,
  Monitor
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logoIcon from '@/assets/logo_icon.png';

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  attachment_url?: string;
  profile?: {
    id: string;
    name: string;
    email: string;
  };
  responses?: SupportResponse[];
}

interface SupportResponse {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  user_id: string;
}

export default function Support() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isSupport, loading: supportLoading } = useSupport();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { isNative } = useNativePlatform();
  
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0
  });

  useEffect(() => {
    // Aguarda verificação de permissões
    if (supportLoading || adminLoading) return;
    
    // Se não for support nem admin, redireciona
    if (!isSupport && !isAdmin) {
      toast.error('Acesso não autorizado');
      navigate('/app');
      return;
    }

    fetchTickets();
  }, [isSupport, isAdmin, supportLoading, adminLoading, navigate]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      
      // Buscar tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ticketsError) throw ticketsError;
      
      if (!ticketsData || ticketsData.length === 0) {
        setTickets([]);
        setStats({ total: 0, open: 0, inProgress: 0, resolved: 0 });
        return;
      }

      // Buscar profiles dos usuários
      const userIds = [...new Set(ticketsData.map(t => t.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;

      // Mapear profiles aos tickets
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const ticketsWithProfiles = ticketsData.map(ticket => ({
        ...ticket,
        profile: profilesMap.get(ticket.user_id)
      }));
      
      setTickets(ticketsWithProfiles);
      
      // Calcular stats
      setStats({
        total: ticketsData.length,
        open: ticketsData.filter(t => t.status === 'open').length,
        inProgress: ticketsData.filter(t => t.status === 'in_progress').length,
        resolved: ticketsData.filter(t => t.status === 'resolved' || t.status === 'closed').length
      });
    } catch (error) {
      console.error('Erro ao buscar tickets:', error);
      toast.error('Erro ao carregar tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketResponses = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_responses')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar respostas:', error);
      return [];
    }
  };

  const handleViewTicket = async (ticket: SupportTicket) => {
    const responses = await fetchTicketResponses(ticket.id);
    setSelectedTicket({ ...ticket, responses });
    setShowTicketDialog(true);
  };

  const handleRespondTicket = async () => {
    if (!selectedTicket || !responseMessage.trim()) {
      toast.error('Por favor, escreva uma resposta');
      return;
    }

    try {
      setSendingResponse(true);

      // Inserir resposta
      const { error: responseError } = await supabase
        .from('support_responses')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user?.id,
          message: responseMessage,
          is_admin: true
        });

      if (responseError) throw responseError;

      // Atualizar status do ticket para "in_progress" se estiver "open"
      if (selectedTicket.status === 'open') {
        const { error: updateError } = await supabase
          .from('support_tickets')
          .update({ 
            status: 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTicket.id);

        if (updateError) throw updateError;
      }

      // Enviar notificação para o usuário
      try {
        await supabase.functions.invoke('create-notification', {
          body: {
            userId: selectedTicket.user_id,
            title: '💬 Resposta no seu ticket de suporte',
            message: `Seu ticket "${selectedTicket.subject}" recebeu uma resposta.`,
            link: '/app-hub'
          }
        });
      } catch (notifError) {
        console.error('Erro ao enviar notificação:', notifError);
      }

      toast.success('Resposta enviada com sucesso!');
      setResponseMessage('');
      
      // Atualizar respostas do ticket
      const responses = await fetchTicketResponses(selectedTicket.id);
      setSelectedTicket({ ...selectedTicket, responses, status: selectedTicket.status === 'open' ? 'in_progress' : selectedTicket.status });
      
      fetchTickets();
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      toast.error('Erro ao enviar resposta');
    } finally {
      setSendingResponse(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;
      
      toast.success('Status atualizado!');
      fetchTickets();
      
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao sair:', error);
      toast.error('Erro ao sair');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive">Aberto</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-500">Em Andamento</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500">Resolvido</Badge>;
      case 'closed':
        return <Badge variant="secondary">Fechado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Alta</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Média</Badge>;
      case 'low':
        return <Badge variant="secondary">Baixa</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  // Filtrar tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesSearch = searchQuery === '' || 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.profile?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.profile?.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (supportLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Block mobile access - show friendly message
  if (isNative) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Monitor className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Acesso apenas via Web</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              O Portal de Suporte está disponível apenas na versão web do aplicativo.
            </p>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Acesse pelo navegador:</p>
              <p className="font-mono text-primary font-medium">
                souartista.app/support-tickets
              </p>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate('/app')}
            >
              Voltar ao App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img src={logoIcon} alt="Logo" className="h-8 w-8" />
            <div>
              <h1 className="text-lg font-semibold">Central de Suporte</h1>
              <p className="text-xs text-muted-foreground">Gerenciamento de Tickets</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Admin
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abertos</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.open}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.inProgress}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.resolved}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar por assunto, nome ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="open">Abertos</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="resolved">Resolvidos</SelectItem>
                <SelectItem value="closed">Fechados</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchTickets}>
              Atualizar
            </Button>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets de Suporte</CardTitle>
            <CardDescription>
              {filteredTickets.length} ticket(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum ticket encontrado
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Assunto</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{ticket.profile?.name || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">{ticket.profile?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {ticket.subject}
                        </TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewTicket(ticket)}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Ticket Detail Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              {selectedTicket?.subject}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              {selectedTicket && getStatusBadge(selectedTicket.status)}
              {selectedTicket && getPriorityBadge(selectedTicket.priority)}
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              {/* Ticket Info */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-4 text-gray-200">
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Usuário:</span>
                      <span>{selectedTicket.profile?.name} ({selectedTicket.profile?.email})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Criado em:</span>
                      <span>{format(new Date(selectedTicket.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Atualizado em:</span>
                      <span>{format(new Date(selectedTicket.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Original Message */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-200">Mensagem Original</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-200">
                  <p className="text-sm whitespace-pre-wrap">{selectedTicket.message}</p>
                  {selectedTicket.attachment_url && (
                    <a 
                      href={selectedTicket.attachment_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary text-sm underline mt-2 inline-block"
                    >
                      Ver anexo
                    </a>
                  )}
                </CardContent>
              </Card>

              {/* Responses */}
              {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-200">Histórico de Respostas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-gray-200">
                    {selectedTicket.responses.map((response) => (
                      <div 
                        key={response.id} 
                        className={`p-3 rounded-lg ${response.is_admin ? 'bg-primary/10 ml-4' : 'bg-muted mr-4'}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium">
                            {response.is_admin ? '🛡️ Suporte' : '👤 Usuário'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(response.created_at), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{response.message}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Status Update */}
              <div className="flex gap-2">
                <Select 
                  value={selectedTicket.status} 
                  onValueChange={(value) => handleUpdateStatus(selectedTicket.id, value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Alterar status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Aberto</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="resolved">Resolvido</SelectItem>
                    <SelectItem value="closed">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Response Form */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Digite sua resposta..."
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  rows={4}
                />
                <Button 
                  onClick={handleRespondTicket} 
                  disabled={sendingResponse || !responseMessage.trim()}
                  className="w-full"
                >
                  {sendingResponse ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enviar Resposta
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
