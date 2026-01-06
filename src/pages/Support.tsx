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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
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
  Monitor,
  User,
  Calendar,
  MapPin,
  Bell,
  AlertTriangle,
  ArrowUpRight,
  Mail,
  Key,
  Phone,
  Pencil
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
  escalated_to_admin?: boolean;
  escalated_at?: string;
  escalation_reason?: string;
  escalated_by?: string;
  profile?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    created_at?: string;
    last_seen_at?: string;
    status_plano?: string;
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

interface UserShow {
  id: string;
  venue_name: string;
  date_local: string;
  time_local: string;
}

interface UserRole {
  role: string;
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

  // User details
  const [userShows, setUserShows] = useState<UserShow[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  // Escalation dialog
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [escalationCategory, setEscalationCategory] = useState('');
  const [escalating, setEscalating] = useState(false);

  // Send notification dialog
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);

  // Edit user dialogs
  const [showEditEmailDialog, setShowEditEmailDialog] = useState(false);
  const [showEditPasswordDialog, setShowEditPasswordDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingUserData, setSavingUserData] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    escalated: 0
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
        setStats({ total: 0, open: 0, inProgress: 0, resolved: 0, escalated: 0 });
        return;
      }

      // Buscar profiles dos usuários
      const userIds = [...new Set(ticketsData.map(t => t.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, phone, created_at, last_seen_at, status_plano')
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
        resolved: ticketsData.filter(t => t.status === 'resolved' || t.status === 'closed').length,
        escalated: ticketsData.filter(t => t.escalated_to_admin === true).length
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

  const fetchUserDetails = async (userId: string) => {
    try {
      setLoadingUserDetails(true);
      
      // Buscar shows do usuário (últimos 5, sem dados financeiros)
      const { data: shows, error: showsError } = await supabase
        .from('shows')
        .select('id, venue_name, date_local, time_local')
        .eq('uid', userId)
        .order('date_local', { ascending: false })
        .limit(5);
      
      if (showsError) {
        console.error('Erro ao buscar shows:', showsError);
      } else {
        setUserShows(shows || []);
      }

      // Buscar role do usuário
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (roleError && roleError.code !== 'PGRST116') {
        console.error('Erro ao buscar role:', roleError);
      } else {
        setUserRole(roleData?.role || null);
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do usuário:', error);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const handleViewTicket = async (ticket: SupportTicket) => {
    const responses = await fetchTicketResponses(ticket.id);
    setSelectedTicket({ ...ticket, responses });
    setShowTicketDialog(true);
    
    // Buscar detalhes adicionais do usuário
    fetchUserDetails(ticket.user_id);
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

  const handleEscalateTicket = async () => {
    if (!selectedTicket || !escalationCategory) {
      toast.error('Selecione um motivo para escalar');
      return;
    }

    try {
      setEscalating(true);

      const fullReason = escalationReason 
        ? `${escalationCategory}: ${escalationReason}`
        : escalationCategory;

      // Atualizar ticket com escalação
      const { error: updateError } = await supabase
        .from('support_tickets')
        .update({
          escalated_to_admin: true,
          escalated_at: new Date().toISOString(),
          escalation_reason: fullReason,
          escalated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTicket.id);

      if (updateError) throw updateError;

      // Criar notificação para admins
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          title: '🚨 Ticket Escalado',
          message: `Ticket "${selectedTicket.subject}" foi escalado para admin. Motivo: ${fullReason}`,
          link: '/admin?tab=escalados',
          target_role: null, // Será visível para admins pela policy
          created_by: user?.id
        });

      if (notifError) {
        console.error('Erro ao criar notificação:', notifError);
      }

      toast.success('Ticket escalado para admin!');
      setShowEscalateDialog(false);
      setEscalationReason('');
      setEscalationCategory('');
      setShowTicketDialog(false);
      fetchTickets();
    } catch (error) {
      console.error('Erro ao escalar ticket:', error);
      toast.error('Erro ao escalar ticket');
    } finally {
      setEscalating(false);
    }
  };

  const handleSendNotification = async () => {
    if (!selectedTicket || !notificationTitle.trim() || !notificationMessage.trim()) {
      toast.error('Preencha título e mensagem');
      return;
    }

    try {
      setSendingNotification(true);

      await supabase.functions.invoke('create-notification', {
        body: {
          userId: selectedTicket.user_id,
          title: notificationTitle,
          message: notificationMessage,
          link: '/app-hub'
        }
      });

      toast.success('Notificação enviada!');
      setShowNotificationDialog(false);
      setNotificationTitle('');
      setNotificationMessage('');
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      toast.error('Erro ao enviar notificação');
    } finally {
      setSendingNotification(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!selectedTicket || !newEmail.trim()) {
      toast.error('Email é obrigatório');
      return;
    }

    try {
      setSavingUserData(true);

      const { data, error } = await supabase.functions.invoke('support-manage-user', {
        body: {
          action: 'update_email',
          userId: selectedTicket.user_id,
          newEmail: newEmail.trim()
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Email atualizado!');
      setShowEditEmailDialog(false);
      setNewEmail('');
      
      // Atualizar dados do ticket
      setSelectedTicket({
        ...selectedTicket,
        profile: { ...selectedTicket.profile!, email: newEmail.trim() }
      });
      fetchTickets();
    } catch (error: any) {
      console.error('Erro ao atualizar email:', error);
      toast.error(error?.message || 'Erro ao atualizar email');
    } finally {
      setSavingUserData(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedTicket || !newPassword) {
      toast.error('Senha é obrigatória');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Senhas não coincidem');
      return;
    }

    try {
      setSavingUserData(true);

      const { data, error } = await supabase.functions.invoke('support-manage-user', {
        body: {
          action: 'reset_password',
          userId: selectedTicket.user_id,
          newPassword
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Senha resetada!');
      setShowEditPasswordDialog(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error);
      toast.error(error?.message || 'Erro ao resetar senha');
    } finally {
      setSavingUserData(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!selectedTicket) return;

    try {
      setSavingUserData(true);

      const { data, error } = await supabase.functions.invoke('support-manage-user', {
        body: {
          action: 'update_profile',
          userId: selectedTicket.user_id,
          newName: editName.trim() || undefined,
          newPhone: editPhone.trim() || undefined
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Perfil atualizado!');
      setShowEditProfileDialog(false);
      
      // Atualizar dados do ticket
      setSelectedTicket({
        ...selectedTicket,
        profile: { 
          ...selectedTicket.profile!, 
          name: editName.trim() || selectedTicket.profile?.name || '',
          phone: editPhone.trim() || selectedTicket.profile?.phone
        }
      });
      fetchTickets();
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error(error?.message || 'Erro ao atualizar perfil');
    } finally {
      setSavingUserData(false);
    }
  };

  const openEditProfileDialog = () => {
    setEditName(selectedTicket?.profile?.name || '');
    setEditPhone(selectedTicket?.profile?.phone || '');
    setShowEditProfileDialog(true);
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

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case 'artist':
        return <Badge className="bg-purple-500">Artista</Badge>;
      case 'musician':
        return <Badge className="bg-blue-500">Músico</Badge>;
      default:
        return <Badge variant="outline">Sem role</Badge>;
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
        <div className="grid gap-4 md:grid-cols-5 mb-6">
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Escalados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.escalated}</div>
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
                      <TableHead>Escalado</TableHead>
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
                        <TableCell>
                          {ticket.escalated_to_admin ? (
                            <Badge className="bg-orange-500">Sim</Badge>
                          ) : (
                            <Badge variant="outline">Não</Badge>
                          )}
                        </TableCell>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              {selectedTicket?.subject}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              {selectedTicket && getStatusBadge(selectedTicket.status)}
              {selectedTicket && getPriorityBadge(selectedTicket.priority)}
              {selectedTicket?.escalated_to_admin && (
                <Badge className="bg-orange-500">Escalado</Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Left Column - User Details */}
              <div className="space-y-4">
                {/* User Info */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-200 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Dados do Usuário
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-200">
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nome:</span>
                        <span>{selectedTicket.profile?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{selectedTicket.profile?.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Telefone:</span>
                        <span>{selectedTicket.profile?.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">User ID:</span>
                        <span className="font-mono text-xs">{selectedTicket.user_id}</span>
                      </div>
                      <Separator className="my-2 bg-gray-700" />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tipo:</span>
                        {loadingUserDetails ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          getRoleBadge(userRole)
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Plano:</span>
                        <span>
                          {selectedTicket.profile?.status_plano === 'ativo' ? (
                            <Badge className="bg-green-500">Ativo</Badge>
                          ) : (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Conta criada:</span>
                        <span>
                          {selectedTicket.profile?.created_at 
                            ? format(new Date(selectedTicket.profile.created_at), "dd/MM/yyyy", { locale: ptBR })
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Último acesso:</span>
                        <span>
                          {selectedTicket.profile?.last_seen_at 
                            ? format(new Date(selectedTicket.profile.last_seen_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Shows */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-200 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Shows Recentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-200">
                    {loadingUserDetails ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : userShows.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Nenhum show encontrado
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {userShows.map((show) => (
                          <div key={show.id} className="flex items-center gap-2 text-sm p-2 bg-gray-700/50 rounded">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <div className="font-medium">{show.venue_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(show.date_local), "dd/MM/yyyy", { locale: ptBR })} às {show.time_local}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* User Management Actions */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-200 flex items-center gap-2">
                      <Pencil className="h-4 w-4" />
                      Gerenciar Usuário
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={openEditProfileDialog}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Editar Nome/Telefone
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => {
                        setNewEmail(selectedTicket.profile?.email || '');
                        setShowEditEmailDialog(true);
                      }}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Alterar Email
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => setShowEditPasswordDialog(true)}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Resetar Senha
                    </Button>
                  </CardContent>
                </Card>

                {/* Support Actions */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-200">Ações do Ticket</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => setShowNotificationDialog(true)}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Enviar Notificação Individual
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar como Resolvido
                    </Button>
                    {!selectedTicket.escalated_to_admin && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start text-orange-400 border-orange-400 hover:bg-orange-400/10"
                        onClick={() => setShowEscalateDialog(true)}
                      >
                        <ArrowUpRight className="h-4 w-4 mr-2" />
                        Escalar para Admin
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Ticket Details */}
              <div className="space-y-4">
                {/* Original Message */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-200">Mensagem Original</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(selectedTicket.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
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
                    <CardContent className="space-y-3 text-gray-200 max-h-[200px] overflow-y-auto">
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Escalate Dialog */}
      <Dialog open={showEscalateDialog} onOpenChange={setShowEscalateDialog}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Escalar para Admin
            </DialogTitle>
            <DialogDescription>
              O ticket será enviado para a fila de análise do admin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo da escalação</Label>
              <Select value={escalationCategory} onValueChange={setEscalationCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Problema de pagamento">Problema de pagamento</SelectItem>
                  <SelectItem value="Solicitação LGPD">Solicitação LGPD</SelectItem>
                  <SelectItem value="Bug técnico">Bug técnico</SelectItem>
                  <SelectItem value="Reclamação grave">Reclamação grave</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Detalhes adicionais (opcional)</Label>
              <Textarea
                placeholder="Descreva detalhes que podem ajudar o admin..."
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEscalateDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleEscalateTicket}
              disabled={escalating || !escalationCategory}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {escalating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowUpRight className="h-4 w-4 mr-2" />
              )}
              Escalar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Notification Dialog */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Enviar Notificação
            </DialogTitle>
            <DialogDescription>
              Envie uma notificação push + in-app para {selectedTicket?.profile?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                placeholder="Título da notificação"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                placeholder="Mensagem da notificação"
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotificationDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSendNotification}
              disabled={sendingNotification || !notificationTitle.trim() || !notificationMessage.trim()}
            >
              {sendingNotification ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Email Dialog */}
      <Dialog open={showEditEmailDialog} onOpenChange={setShowEditEmailDialog}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Alterar Email
            </DialogTitle>
            <DialogDescription>
              Altere o email do usuário {selectedTicket?.profile?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Novo Email</Label>
              <Input
                type="email"
                placeholder="novo@email.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditEmailDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateEmail}
              disabled={savingUserData || !newEmail.trim()}
            >
              {savingUserData ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showEditPasswordDialog} onOpenChange={setShowEditPasswordDialog}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Resetar Senha
            </DialogTitle>
            <DialogDescription>
              Defina uma nova senha para {selectedTicket?.profile?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmar Senha</Label>
              <Input
                type="password"
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditPasswordDialog(false);
              setNewPassword('');
              setConfirmPassword('');
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleResetPassword}
              disabled={savingUserData || !newPassword || newPassword !== confirmPassword}
            >
              {savingUserData ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Key className="h-4 w-4 mr-2" />
              )}
              Resetar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Editar Perfil
            </DialogTitle>
            <DialogDescription>
              Edite os dados do usuário {selectedTicket?.profile?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Nome do usuário"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                placeholder="(00) 00000-0000"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditProfileDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateProfile}
              disabled={savingUserData}
            >
              {savingUserData ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Pencil className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
