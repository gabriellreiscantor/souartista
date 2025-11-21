import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, Users, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Ticket {
  id: string;
  user_id: string;
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

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

const Admin = () => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [newResponse, setNewResponse] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error('Acesso negado');
      navigate('/login');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchTickets();
      fetchUsers();
    }
  }, [user, isAdmin]);

  const fetchTickets = async () => {
    try {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Erro ao carregar tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
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

  const handleSendResponse = async () => {
    if (!newResponse.trim() || !selectedTicket) return;

    try {
      const { error: responseError } = await supabase
        .from('support_responses')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user?.id,
          message: newResponse,
          is_admin: true
        });

      if (responseError) throw responseError;

      // Update ticket status to in_progress if it's open
      if (selectedTicket.status === 'open') {
        const { error: updateError } = await supabase
          .from('support_tickets')
          .update({ status: 'in_progress' })
          .eq('id', selectedTicket.id);

        if (updateError) throw updateError;
      }

      toast.success('Resposta enviada!');
      setNewResponse('');
      fetchResponses(selectedTicket.id);
      fetchTickets();
    } catch (error) {
      console.error('Error sending response:', error);
      toast.error('Erro ao enviar resposta');
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;

      toast.success('Status atualizado!');
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const openTicketDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    fetchResponses(ticket.id);
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || user?.email || 'Usuário';
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

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">🎧 Painel Admin</h1>
        </div>
        
        <Button variant="outline" onClick={() => navigate('/artist/dashboard')}>
          Voltar ao App
        </Button>
      </header>

      <main className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total de Tickets</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Abertos</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.open}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Em Andamento</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Resolvidos</p>
                    <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="tickets" className="w-full">
            <TabsList className="bg-white border border-gray-200">
              <TabsTrigger value="tickets">Tickets de Suporte</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
            </TabsList>

            <TabsContent value="tickets" className="space-y-4 mt-4">
              <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); fetchTickets(); }}>
                  <SelectTrigger className="w-[200px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="open">Abertos</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="resolved">Resolvidos</SelectItem>
                    <SelectItem value="closed">Fechados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4">
                {tickets.map((ticket) => (
                  <Card 
                    key={ticket.id} 
                    className="bg-white border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => openTicketDetails(ticket)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-600">
                              {getUserName(ticket.user_id)}
                            </span>
                          </div>
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
                ))}
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-4 mt-4">
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Usuários Cadastrados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Ticket Details Dialog */}
          {selectedTicket && (
            <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
              <DialogContent className="bg-white max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <DialogTitle className="text-xl">{selectedTicket.subject}</DialogTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Por: {getUserName(selectedTicket.user_id)}
                      </p>
                    </div>
                    <Select 
                      value={selectedTicket.status} 
                      onValueChange={(value) => handleUpdateStatus(selectedTicket.id, value)}
                    >
                      <SelectTrigger className="w-[180px] bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="open">Aberto</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="resolved">Resolvido</SelectItem>
                        <SelectItem value="closed">Fechado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                        <span className="text-sm font-semibold text-gray-900">
                          {getUserName(selectedTicket.user_id)}
                        </span>
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
                            {response.is_admin ? '🎧 Você (Admin)' : getUserName(response.user_id)}
                          </span>
                          <span className="text-xs text-gray-600">
                            {format(new Date(response.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-gray-700">{response.message}</p>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Admin Response Input */}
                  {selectedTicket.status !== 'closed' && (
                    <div className="space-y-3 border-t border-gray-200 pt-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Responder como Admin
                      </label>
                      <Textarea
                        value={newResponse}
                        onChange={(e) => setNewResponse(e.target.value)}
                        placeholder="Digite sua resposta..."
                        rows={4}
                        className="bg-white"
                      />
                      <Button 
                        onClick={handleSendResponse}
                        className="w-full bg-purple-600 text-white hover:bg-purple-700"
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
  );
};

export default Admin;
