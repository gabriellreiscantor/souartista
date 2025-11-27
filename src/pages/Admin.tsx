import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { queryClient } from '@/providers/QueryProvider';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Users, Music, Mic2, Copy, MoreVertical, Loader2, ArrowLeft, Clipboard, X, Send, Download, Filter, Link as LinkIcon, MessageCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { RouteSelector } from '@/components/RouteSelector';
import * as XLSX from 'xlsx';
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  birth_date: string | null;
  status_plano: string;
  plan_type: string | null;
  created_at: string;
  plan_purchased_at: string | null;
  last_seen_at: string | null;
  role?: string;
  isAdmin?: boolean;
  isSupport?: boolean;
}
interface Show {
  id: string;
  venue_name: string;
  date_local: string;
  time_local: string;
  fee: number;
  expenses_team: any;
  expenses_other: any;
  uid?: string;
}
interface LocomotionExpense {
  id: string;
  cost: number;
  type: string;
  created_at: string;
}
interface Stats {
  totalUsers: number;
  totalArtists: number;
  totalMusicians: number;
  totalTickets: number;
}
export default function Admin() {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    isAdmin,
    loading: adminLoading
  } = useAdmin();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'usuarios';
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalArtists: 0,
    totalMusicians: 0,
    totalTickets: 0
  });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editPlanType, setEditPlanType] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchedUser, setSearchedUser] = useState<UserProfile | null>(null);
  const [userShows, setUserShows] = useState<Show[]>([]);
  const [userExpenses, setUserExpenses] = useState<LocomotionExpense[]>([]);
  const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null);

  // Estados para Financeiro Global
  const [googleTax, setGoogleTax] = useState(30);
  const [appleTax, setAppleTax] = useState(15);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [savingTax, setSavingTax] = useState(false);

  // Estados para Notificações
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationLink, setNotificationLink] = useState('');
  const [notificationFilter, setNotificationFilter] = useState('todos');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [deletingNotificationId, setDeletingNotificationId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRouteSelector, setShowRouteSelector] = useState(false);

  // Estados para Push Mobile
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [pushLink, setPushLink] = useState('');
  const [sendingPush, setSendingPush] = useState(false);
  const [pushUserSearch, setPushUserSearch] = useState('todos');
  const [fcmUsersCount, setFcmUsersCount] = useState(0);
  const [loadingFcmCount, setLoadingFcmCount] = useState(false);

  // Estados para Contatos WhatsApp
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactFilter, setContactFilter] = useState('todos');
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Estados para Logs
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logFilter, setLogFilter] = useState('all');
  
  // Estados para Logs Técnicos
  const [technicalLogs, setTechnicalLogs] = useState<any[]>([]);
  const [loadingTechnicalLogs, setLoadingTechnicalLogs] = useState(false);
  const [technicalLogFilter, setTechnicalLogFilter] = useState('all');
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);
  
  // Estados para Suporte
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [loadingSupportTickets, setLoadingSupportTickets] = useState(false);
  const [supportFilter, setSupportFilter] = useState('all');
  const [respondingTicket, setRespondingTicket] = useState<any | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  
  // Estados para Administradores
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Estados para Importação Firebase
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState<any>(null);
  
  const usersPerPage = 50;
  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      const userRole = localStorage.getItem('userRole');
      if (userRole === 'artist') {
        navigate('/artist/dashboard');
      } else {
        navigate('/musician/dashboard');
      }
    }

    // Saudação especial para admin (apenas uma vez por sessão)
    if (!adminLoading && isAdmin && !sessionStorage.getItem('admin_greeted')) {
      toast.success('👑 Olá Chefe! Bem-vindo ao Painel Admin', {
        duration: 3000
      });
      sessionStorage.setItem('admin_greeted', 'true');
    }
  }, [isAdmin, adminLoading, user, navigate]);
  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchUsers();
      // Limpa a busca quando mudar de tab
      setSearchedUser(null);
      setUserShows([]);
      setUserExpenses([]);
      setSearchId('');

      // Carrega dados específicos por tab
      if (currentTab === 'financeiro') {
        fetchFinancialData();
      } else if (currentTab === 'notificacoes') {
        fetchNotifications();
      } else if (currentTab === 'push-mobile') {
        fetchFcmUsersCount();
      } else if (currentTab === 'contatos') {
        fetchContacts();
      } else if (currentTab === 'logs') {
        fetchSystemLogs();
        fetchTechnicalLogs();
      } else if (currentTab === 'administradores') {
        fetchAdminUsers();
      } else if (currentTab === 'suporte') {
        fetchSupportTickets();
      } else if (currentTab === 'importacao') {
        // Limpar estado ao entrar na tab de importação
        setImportFile(null);
        setImportData(null);
        setImportReport(null);
      }
    }
  }, [isAdmin, currentTab]);

  // Realtime updates para a aba de administradores
  useEffect(() => {
    if (!isAdmin || currentTab !== 'administradores') return;

    console.log('🔄 Iniciando realtime para admin permissions...');

    const adminChannel = supabase
      .channel('admin-permissions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_users'
        },
        (payload) => {
          console.log('✅ Admin users changed:', payload);
          fetchAdminUsers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        (payload) => {
          console.log('✅ User roles changed:', payload);
          fetchAdminUsers();
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime status:', status);
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Falha no realtime, usando polling como fallback');
          toast.error('Realtime indisponível, atualize manualmente se necessário');
        }
      });

    return () => {
      console.log('🔌 Desconectando realtime admin permissions');
      supabase.removeChannel(adminChannel);
    };
  }, [isAdmin, currentTab]);
  const fetchStats = async () => {
    try {
      const {
        count: usersCount
      } = await supabase.from('profiles').select('*', {
        count: 'exact',
        head: true
      });
      const {
        count: artistsCount
      } = await supabase.from('user_roles').select('*', {
        count: 'exact',
        head: true
      }).eq('role', 'artist');
      const {
        count: musiciansCount
      } = await supabase.from('user_roles').select('*', {
        count: 'exact',
        head: true
      }).eq('role', 'musician');
      const {
        count: ticketsCount
      } = await supabase.from('support_tickets').select('*', {
        count: 'exact',
        head: true
      });
      setStats({
        totalUsers: usersCount || 0,
        totalArtists: artistsCount || 0,
        totalMusicians: musiciansCount || 0,
        totalTickets: ticketsCount || 0
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('profiles').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };
  const handleUpdateName = async () => {
    if (!editingUser) return;
    try {
      const {
        error
      } = await supabase.from('profiles').update({
        name: editName
      }).eq('id', editingUser.id);
      if (error) throw error;
      toast.success('Nome atualizado com sucesso!');
      setShowEditDialog(false);
      fetchUsers();
    } catch (error) {
      console.error('Erro ao atualizar nome:', error);
      toast.error('Erro ao atualizar nome');
    }
  };
  const handleUpdateStatus = async () => {
    if (!editingUser) return;
    try {
      const {
        error
      } = await supabase.from('profiles').update({
        status_plano: editStatus,
        plan_type: editPlanType || null
      }).eq('id', editingUser.id);
      if (error) throw error;
      toast.success('Plano atualizado com sucesso!');
      setShowStatusDialog(false);
      fetchUsers();
      // Se estiver na busca, atualizar também
      if (searchedUser?.id === editingUser.id) {
        handleSearchUser();
      }
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      toast.error('Erro ao atualizar plano');
    }
  };
  const handleSearchUser = async () => {
    if (!searchId.trim()) {
      toast.error('Digite um ID para buscar');
      return;
    }
    try {
      setSearching(true);

      // Buscar profile
      const {
        data: profile,
        error: profileError
      } = await supabase.from('profiles').select('*').eq('id', searchId.trim()).single();
      if (profileError) throw new Error('Usuário não encontrado');

      // Buscar role
      const {
        data: roleData
      } = await supabase.from('user_roles').select('role').eq('user_id', searchId.trim()).single();
      console.log('User role:', roleData?.role);

      // Buscar shows se for artista
      let shows: Show[] = [];
      if (roleData?.role === 'artist') {
        const {
          data: showsData
        } = await supabase.from('shows').select('id, venue_name, date_local, time_local, fee, expenses_team, expenses_other').eq('uid', searchId.trim()).order('date_local', {
          ascending: false
        });
        shows = showsData || [];
        console.log('Shows do artista:', shows.length);
      }

      // Buscar participações em shows se for músico - usar team_musician_ids
      if (roleData?.role === 'musician') {
        const {
          data: showsData,
          error: showsError
        } = await supabase.from('shows').select('id, venue_name, date_local, time_local, fee, expenses_team, expenses_other, uid').contains('team_musician_ids', [searchId.trim()]).order('date_local', {
          ascending: false
        });
        console.log('Shows do músico:', showsData?.length, 'Error:', showsError);
        shows = showsData || [];
      }

      // Buscar despesas de locomoção
      const {
        data: expensesData
      } = await supabase.from('locomotion_expenses').select('id, cost, type, created_at').eq('uid', searchId.trim()).order('created_at', {
        ascending: false
      });
      console.log('Despesas:', expensesData?.length);
      setSearchedUser({
        ...profile,
        role: roleData?.role
      });
      setUserShows(shows);
      setUserExpenses(expensesData || []);
      toast.success('Usuário encontrado!');
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      toast.error('Usuário não encontrado');
      setSearchedUser(null);
      setUserShows([]);
      setUserExpenses([]);
    } finally {
      setSearching(false);
    }
  };
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('ID copiado!');
  };
  const handlePasteClick = () => {
    // Foca no input e instrui o usuário
    if (searchInputRef) {
      searchInputRef.focus();
      searchInputRef.select();

      // Tenta executar paste programaticamente
      const pasteSuccess = document.execCommand('paste');
      if (!pasteSuccess) {
        toast.info('Cole agora (Ctrl+V ou toque longo)', {
          duration: 2000
        });
      }
    }
  };
  const handleClearSearch = () => {
    setSearchId('');
    setSearchedUser(null);
    setUserShows([]);
    setUserExpenses([]);
    toast.info('Busca limpa');
  };

  // Funções para Financeiro Global
  // Buscar contagem de usuários com FCM token
  const fetchFcmUsersCount = async () => {
    try {
      setLoadingFcmCount(true);
      
      let query = supabase
        .from('profiles')
        .select('id, fcm_token', { count: 'exact', head: true })
        .not('fcm_token', 'is', null);

      // Filtrar por role se necessário
      if (pushUserSearch === 'artistas' || pushUserSearch === 'musicos') {
        const role = pushUserSearch === 'artistas' ? 'artist' : 'musician';
        const { data: roleUsers } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', role);
        
        if (roleUsers && roleUsers.length > 0) {
          const userIds = roleUsers.map(r => r.user_id);
          query = query.in('id', userIds);
        } else {
          setFcmUsersCount(0);
          return;
        }
      }

      const { count, error } = await query;

      if (error) throw error;
      
      setFcmUsersCount(count || 0);
    } catch (error) {
      console.error('Erro ao buscar contagem FCM:', error);
      setFcmUsersCount(0);
    } finally {
      setLoadingFcmCount(false);
    }
  };

  const fetchFinancialData = async () => {
    try {
      const {
        count
      } = await supabase.from('profiles').select('*', {
        count: 'exact',
        head: true
      }).eq('status_plano', 'ativo');
      setActiveUsersCount(count || 0);

      // Carregar taxas salvas
      const savedGoogleTax = localStorage.getItem('admin_google_tax');
      if (savedGoogleTax) {
        setGoogleTax(Number(savedGoogleTax));
      }
      const savedAppleTax = localStorage.getItem('admin_apple_tax');
      if (savedAppleTax) {
        setAppleTax(Number(savedAppleTax));
      }
    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error);
    }
  };
  const handleSaveTax = () => {
    setSavingTax(true);
    try {
      localStorage.setItem('admin_google_tax', googleTax.toString());
      localStorage.setItem('admin_apple_tax', appleTax.toString());
      toast.success('Taxas salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar taxas:', error);
      toast.error('Erro ao salvar taxas');
    } finally {
      setTimeout(() => setSavingTax(false), 500);
    }
  };

  // Funções para Notificações
  const fetchNotifications = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('notifications').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      toast.error('Erro ao carregar notificações');
    }
  };
  const handleSendNotification = async () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      toast.error('Preencha título e mensagem');
      return;
    }
    try {
      setSendingNotification(true);
      const {
        error
      } = await supabase.from('notifications').insert({
        title: notificationTitle,
        message: notificationMessage,
        link: notificationLink || null,
        created_by: user?.id
      });
      if (error) throw error;
      toast.success('Notificação enviada com sucesso!');
      setNotificationTitle('');
      setNotificationMessage('');
      setNotificationLink('');
      fetchNotifications();
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      toast.error('Erro ao enviar notificação');
    } finally {
      setSendingNotification(false);
    }
  };
  const handleDeleteNotification = async () => {
    if (!deletingNotificationId) return;
    try {
      const {
        error
      } = await supabase.from('notifications').delete().eq('id', deletingNotificationId);
      if (error) throw error;
      toast.success('Notificação removida com sucesso!');
      setShowDeleteDialog(false);
      setDeletingNotificationId(null);
      fetchNotifications();
    } catch (error) {
      console.error('Erro ao remover notificação:', error);
      toast.error('Erro ao remover notificação');
    }
  };

  // Funções para Contatos WhatsApp
  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);

      // Buscar todos os perfis com roles
      const {
        data: profiles,
        error: profilesError
      } = await supabase.from('profiles').select('id, name, email, phone, status_plano');
      if (profilesError) throw profilesError;

      // Buscar roles de cada usuário
      const profilesWithRoles = await Promise.all((profiles || []).map(async profile => {
        const {
          data: roleData
        } = await supabase.from('user_roles').select('role').eq('user_id', profile.id).single();
        return {
          ...profile,
          role: roleData?.role || 'Não definido'
        };
      }));
      setContacts(profilesWithRoles);
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
      toast.error('Erro ao carregar contatos');
    } finally {
      setLoadingContacts(false);
    }
  };
  const handleExportContacts = () => {
    const filteredContacts = contactFilter === 'todos' ? contacts : contacts.filter(c => {
      if (contactFilter === 'ativos') return c.status_plano === 'ativo';
      if (contactFilter === 'inativos') return c.status_plano === 'inativo';
      if (contactFilter === 'artistas') return c.role === 'artist';
      if (contactFilter === 'musicos') return c.role === 'musician';
      return true;
    });
    const exportData = filteredContacts.map(contact => ({
      Nome: contact.name,
      Email: contact.email,
      Telefone: contact.phone || 'Não informado',
      Role: contact.role,
      Plano: contact.status_plano
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contatos');
    XLSX.writeFile(wb, `contatos-whatsapp-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Contatos exportados com sucesso!');
  };

  // Funções para Logs do Sistema
  const fetchSystemLogs = async () => {
    try {
      setLoadingLogs(true);
      
      // Buscar logs de atividades recentes
      const logs = [];
      
      // 1. Últimos usuários criados
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      recentUsers?.forEach(user => {
        logs.push({
          type: 'user_created',
          message: `Novo usuário: ${user.name} (${user.email})`,
          timestamp: user.created_at,
          severity: 'info'
        });
      });

      // 2. Últimos shows criados
      const { data: recentShows } = await supabase
        .from('shows')
        .select('venue_name, date_local, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      recentShows?.forEach(show => {
        logs.push({
          type: 'show_created',
          message: `Novo show: ${show.venue_name} - ${show.date_local}`,
          timestamp: show.created_at,
          severity: 'success'
        });
      });

      // 3. Últimas notificações enviadas
      const { data: recentNotifications } = await supabase
        .from('notifications')
        .select('title, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      recentNotifications?.forEach(notif => {
        logs.push({
          type: 'notification_sent',
          message: `Notificação enviada: ${notif.title}`,
          timestamp: notif.created_at,
          severity: 'warning'
        });
      });

      // Ordenar por timestamp
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setSystemLogs(logs);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      toast.error('Erro ao carregar logs do sistema');
    } finally {
      setLoadingLogs(false);
    }
  };

  // Função para Suporte
  const fetchSupportTickets = async () => {
    try {
      setLoadingSupportTickets(true);
      
      // Buscar tickets
      const { data: tickets, error: ticketsError } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ticketsError) throw ticketsError;
      
      if (!tickets || tickets.length === 0) {
        setSupportTickets([]);
        return;
      }

      // Buscar profiles dos usuários
      const userIds = [...new Set(tickets.map(t => t.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;

      // Mapear profiles aos tickets
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const ticketsWithProfiles = tickets.map(ticket => ({
        ...ticket,
        profile: profilesMap.get(ticket.user_id)
      }));
      
      setSupportTickets(ticketsWithProfiles);
    } catch (error) {
      console.error('Erro ao buscar tickets:', error);
      toast.error('Erro ao carregar tickets de suporte');
    } finally {
      setLoadingSupportTickets(false);
    }
  };

  const handleRespondTicket = async () => {
    if (!respondingTicket || !responseMessage.trim()) {
      toast.error('Por favor, escreva uma resposta');
      return;
    }

    try {
      setSendingResponse(true);

      // Inserir resposta
      const { error: responseError } = await supabase
        .from('support_responses')
        .insert({
          ticket_id: respondingTicket.id,
          user_id: user?.id,
          message: responseMessage,
          is_admin: true
        });

      if (responseError) throw responseError;

      // Atualizar status do ticket para "in_progress" se estiver "open"
      if (respondingTicket.status === 'open') {
        const { error: updateError } = await supabase
          .from('support_tickets')
          .update({ 
            status: 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', respondingTicket.id);

        if (updateError) throw updateError;
      }

      toast.success('Resposta enviada com sucesso!');
      setShowResponseDialog(false);
      setResponseMessage('');
      setRespondingTicket(null);
      fetchSupportTickets();
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      toast.error('Erro ao enviar resposta');
    } finally {
      setSendingResponse(false);
    }
  };

  // Funções para Administradores e Suporte
  const fetchAdminUsers = async () => {
    try {
      setLoadingAdmins(true);
      console.log('🔄 Buscando usuários e permissões...');
      
      // Buscar todos os usuários
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });
      
      if (usersError) throw usersError;
      console.log(`📋 ${allUsers?.length || 0} usuários encontrados`);
      
      // Buscar quem são os admins
      const { data: admins, error: adminsError } = await supabase
        .from('admin_users')
        .select('user_id');
      
      if (adminsError) throw adminsError;
      console.log(`👑 ${admins?.length || 0} admins encontrados:`, admins);
      
      // Buscar quem tem role de support
      const { data: supports, error: supportsError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'support');
      
      if (supportsError) throw supportsError;
      console.log(`🎧 ${supports?.length || 0} suportes encontrados:`, supports);
      
      const adminIds = new Set(admins?.map(a => a.user_id) || []);
      const supportIds = new Set(supports?.map(s => s.user_id) || []);
      
      // Adicionar flags de admin e support aos usuários
      const usersWithPermissions = allUsers?.map(user => {
        const isAdmin = adminIds.has(user.id);
        const isSupport = supportIds.has(user.id);
        
        if (isAdmin || isSupport) {
          console.log(`✅ ${user.email}: Admin=${isAdmin}, Support=${isSupport}`);
        }
        
        return {
          ...user,
          isAdmin,
          isSupport
        };
      }) || [];
      
      console.log('✅ Permissões carregadas com sucesso');
      setAdminUsers(usersWithPermissions);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ Erro ao buscar permissões:', error);
      toast.error('Erro ao carregar permissões');
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handlePromoteToAdmin = async (userId: string, userName: string) => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .insert({ user_id: userId });
      
      if (error) throw error;
      
      toast.success(`${userName} foi promovido a administrador!`);
      await fetchAdminUsers();
    } catch (error: any) {
      console.error('Erro ao promover a admin:', error);
      if (error.code === '23505') {
        toast.info('Este usuário já é administrador');
        // Mesmo que já seja admin, atualiza a UI para refletir o estado real
        await fetchAdminUsers();
      } else {
        toast.error('Erro ao promover a administrador');
      }
    }
  };

  const handleRevokeAdmin = async (userId: string, userName: string) => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
      
      toast.success(`${userName} não é mais administrador`);
      await fetchAdminUsers();
    } catch (error) {
      console.error('Erro ao remover admin:', error);
      toast.error('Erro ao remover administrador');
    }
  };

  const handlePromoteToSupport = async (userId: string, userName: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'support' });
      
      if (error) throw error;
      
      toast.success(`${userName} foi promovido a Suporte!`);
      await fetchAdminUsers();
    } catch (error: any) {
      console.error('Erro ao promover a suporte:', error);
      if (error.code === '23505') {
        toast.info('Este usuário já é suporte');
        // Mesmo que já seja suporte, atualiza a UI para refletir o estado real
        await fetchAdminUsers();
      } else {
        toast.error('Erro ao promover a suporte');
      }
    }
  };

  const handleRevokeSupport = async (userId: string, userName: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'support');
      
      if (error) throw error;
      
      toast.success(`${userName} não é mais suporte`);
      await fetchAdminUsers();
    } catch (error) {
      console.error('Erro ao remover suporte:', error);
      toast.error('Erro ao remover suporte');
    }
  };

  // Funções para Logs Técnicos
  const fetchTechnicalLogs = async () => {
    try {
      setLoadingTechnicalLogs(true);
      
      const allLogs: any[] = [];
      const alerts: any[] = [];

      // Nota: Como não temos acesso direto às analytics queries no frontend,
      // vamos simular logs técnicos baseados em dados disponíveis
      
      // Verificar usuários recentes para possíveis problemas
      const { data: recentProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (profileError) {
        allLogs.push({
          type: 'database',
          severity: 'error',
          message: `🗄️ [DB ERROR] Falha ao buscar profiles: ${profileError.message}`,
          timestamp: new Date().toISOString()
        });
      }

      // Verificar shows para possíveis erros
      const { data: recentShows, error: showError } = await supabase
        .from('shows')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (showError) {
        allLogs.push({
          type: 'database',
          severity: 'error',
          message: `🗄️ [DB ERROR] Falha ao buscar shows: ${showError.message}`,
          timestamp: new Date().toISOString()
        });
      }

      // Gerar Alertas Inteligentes
      const userCount = stats.totalUsers;
      
      if (userCount >= 45) {
        alerts.push({
          type: 'limit_warning',
          severity: 'warning',
          message: `⚠️ Atenção! ${userCount}/50 usuários cadastrados. Prepare-se para upgrade do plano.`,
          timestamp: new Date().toISOString()
        });
      }

      if (userCount >= 48) {
        alerts.push({
          type: 'limit_critical',
          severity: 'error',
          message: `🚨 CRÍTICO! ${userCount}/50 usuários. Limite quase atingido!`,
          timestamp: new Date().toISOString()
        });
      }

      // Adicionar logs de sucesso se não houver erros
      if (allLogs.length === 0) {
        allLogs.push({
          type: 'system',
          severity: 'success',
          message: '✅ Sistema operando normalmente. Sem erros detectados.',
          timestamp: new Date().toISOString()
        });
        
        allLogs.push({
          type: 'database',
          severity: 'success',
          message: '🗄️ [DB] Banco de dados respondendo corretamente.',
          timestamp: new Date().toISOString()
        });

        allLogs.push({
          type: 'auth',
          severity: 'success',
          message: '🔐 [AUTH] Sistema de autenticação funcionando.',
          timestamp: new Date().toISOString()
        });
      }

      // Ordenar logs por timestamp
      allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setTechnicalLogs(allLogs);
      setSystemAlerts(alerts);
    } catch (error) {
      console.error('Erro ao buscar logs técnicos:', error);
      
      // Adicionar o próprio erro aos logs
      setTechnicalLogs([{
        type: 'system',
        severity: 'error',
        message: `❌ [SYSTEM ERROR] Falha ao carregar logs técnicos: ${error}`,
        timestamp: new Date().toISOString()
      }]);
      
      toast.error('Erro ao carregar logs técnicos');
    } finally {
      setLoadingTechnicalLogs(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: {
        label: 'Pendente',
        icon: '⏳',
        className: 'bg-yellow-100 text-yellow-800'
      },
      ativo: {
        label: 'Ativo',
        icon: '✓',
        className: 'bg-green-100 text-green-800'
      },
      inativo: {
        label: 'Inativo',
        icon: '○',
        className: 'bg-gray-100 text-gray-800'
      },
      cancelado: {
        label: 'Cancelado',
        icon: '✕',
        className: 'bg-red-100 text-red-800'
      }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inativo;
    return <Badge className={config.className}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>;
  };

  const getPlanTypeBadge = (planType: string | null) => {
    if (!planType) return null;
    
    const planConfig = {
      monthly: {
        label: 'Mensal',
        icon: '💳',
        className: 'bg-blue-100 text-blue-800'
      },
      annual: {
        label: 'Anual',
        icon: '🌟',
        className: 'bg-purple-100 text-purple-800'
      }
    };
    
    const config = planConfig[planType as keyof typeof planConfig];
    if (!config) return null;
    
    return <Badge className={config.className}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>;
  };
  const paginatedUsers = users.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);
  const totalPages = Math.ceil(users.length / usersPerPage);

  // Funções para Importação Firebase
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Por favor, selecione um arquivo JSON');
      return;
    }

    setImportFile(file);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setImportData(json);
        toast.success('Arquivo carregado! Revise os dados antes de importar.');
      } catch (error) {
        console.error('Erro ao ler JSON:', error);
        toast.error('Erro ao ler arquivo JSON');
        setImportFile(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importData) {
      toast.error('Nenhum dado para importar');
      return;
    }

    try {
      setImporting(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      console.log('🚀 Iniciando importação...');
      
      const { data, error } = await supabase.functions.invoke('import-firebase-shows', {
        body: { shows: importData },
      });

      if (error) {
        console.error('❌ Erro na importação:', error);
        throw error;
      }

      console.log('✅ Importação concluída:', data);
      
      setImportReport(data);
      toast.success(`🎉 Importação concluída! ${data.shows_imported} shows importados.`);
      
      // Invalidar cache para atualizar dados no dashboard
      queryClient.invalidateQueries({ queryKey: ['shows'] });
      queryClient.invalidateQueries({ queryKey: ['artist-stats'] });
      queryClient.invalidateQueries({ queryKey: ['musician-stats'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-data'] });
      queryClient.invalidateQueries({ queryKey: ['locomotion-data'] });
      
      console.log('🔄 Cache invalidado - dados serão recarregados');
      
      // Limpar dados após sucesso
      setImportFile(null);
      setImportData(null);
      
    } catch (error) {
      console.error('Erro ao importar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao importar dados: ' + errorMessage);
    } finally {
      setImporting(false);
    }
  };

  if (adminLoading) {
    return <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>;
  }
  if (!isAdmin) return null;
  return <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <AdminSidebar />
        <SidebarInset className="flex-1 bg-white">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white border-gray-200 px-4 md:px-6">
            <SidebarTrigger />
            <h1 className="text-lg md:text-2xl font-bold text-gray-900">🛡️ Admin</h1>
            <Button variant="outline" size="sm" onClick={() => {
            const userRole = localStorage.getItem('userRole');
            navigate(userRole === 'artist' ? '/artist/dashboard' : '/musician/dashboard');
          }} className="ml-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para app
            </Button>
          </header>

          <main className="p-4 md:p-6 pb-20 md:pb-6 bg-gray-50">
            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-6">
              <Card className="bg-white border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Total de Usuários</CardTitle>
                  <Users className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
                </CardContent>
              </Card>
              <Card className="bg-white border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Total de Artistas</CardTitle>
                  <Music className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalArtists}</div>
                </CardContent>
              </Card>
              <Card className="bg-white border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Total de Músicos</CardTitle>
                  <Mic2 className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalMusicians}</div>
                </CardContent>
              </Card>
              <Card className="bg-white border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Total de Tickets</CardTitle>
                  <MessageCircle className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalTickets}</div>
                </CardContent>
              </Card>
            </div>

            {/* Content based on tab */}
            {currentTab === 'usuarios' && <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Usuários Cadastrados</CardTitle>
                  <div className="flex gap-2 mt-4 text-sm">
                    <Badge className="bg-yellow-100 text-yellow-800">⏳ Pendente</Badge>
                    <Badge className="bg-green-100 text-green-800">✓ Ativo</Badge>
                    <Badge className="bg-gray-100 text-gray-800">○ Inativo</Badge>
                    <Badge className="bg-red-100 text-red-800">✕ Cancelado</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    </div> : <>
                      <div className="rounded-md border overflow-x-auto border-gray-200">
                        <table className="w-full bg-white">
                          <thead>
                            <tr className="border-b bg-gray-50 border-gray-200">
                              <th className="p-2 md:p-3 text-left font-medium text-sm text-gray-900">Nome</th>
                              <th className="p-2 md:p-3 text-left font-medium text-sm text-gray-900 hidden md:table-cell">Email</th>
                              <th className="p-2 md:p-3 text-left font-medium text-sm text-gray-900">Status</th>
                              <th className="p-2 md:p-3 text-left font-medium text-sm text-gray-900 hidden sm:table-cell">Cancelado</th>
                              <th className="p-2 md:p-3 text-left font-medium text-sm text-gray-900 hidden lg:table-cell">ID</th>
                              <th className="p-2 md:p-3 text-left font-medium text-sm text-gray-900">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedUsers.map(user => <tr key={user.id} className="border-b hover:bg-gray-50 border-gray-200">
                                <td className="p-2 md:p-3">
                                  <div>
                                    <p className="font-medium text-sm text-gray-900">{user.name}</p>
                                    <p className="text-xs text-gray-600 md:hidden">{user.email}</p>
                                  </div>
                                </td>
                                <td className="p-2 md:p-3 hidden md:table-cell text-gray-700">{user.email}</td>
                                <td className="p-2 md:p-3">
                                  <div className="flex flex-wrap gap-1">
                                    {getStatusBadge(user.status_plano)}
                                    {getPlanTypeBadge(user.plan_type)}
                                  </div>
                                </td>
                                <td className="p-2 md:p-3 hidden sm:table-cell">
                                  {user.status_plano === 'cancelado' ? (
                                    <Badge className="bg-red-100 text-red-800 font-semibold">
                                      ✕ SIM
                                    </Badge>
                                  ) : (
                                    <span className="text-xs text-gray-500">Não</span>
                                  )}
                                </td>
                                <td className="p-2 md:p-3 hidden lg:table-cell">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-600 font-mono">
                                      {user.id.slice(0, 8)}...
                                    </span>
                                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(user.id)}>
                                      <Copy className="h-3 w-3 text-gray-600" />
                                    </Button>
                                  </div>
                                </td>
                                <td className="p-2 md:p-3">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-4 w-4 text-stone-950" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-white text-gray-900 border border-gray-200">
                                      <DropdownMenuItem className="hover:bg-gray-100" onClick={() => {
                                setEditingUser(user);
                                setEditName(user.name);
                                setShowEditDialog(true);
                              }}>
                                        Editar Nome
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="hover:bg-gray-100" onClick={() => {
                                setEditingUser(user);
                                setEditStatus(user.status_plano);
                                setEditPlanType(user.plan_type || '');
                                setShowStatusDialog(true);
                              }}>
                                        Gerenciar Plano
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="hover:bg-gray-100" onClick={() => copyToClipboard(user.id)}>
                                        Copiar ID
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>)}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-4">
                        <p className="text-xs md:text-sm text-gray-600">
                          Mostrando {(currentPage - 1) * usersPerPage + 1} a{' '}
                          {Math.min(currentPage * usersPerPage, users.length)} de {users.length}{' '}
                          usuários
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                            Anterior
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                            Próxima
                          </Button>
                        </div>
                      </div>
                    </>}
                </CardContent>
              </Card>}

            {currentTab === 'buscar' && <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Buscar por ID</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input ref={setSearchInputRef} placeholder="Cole o ID do usuário aqui..." value={searchId} onChange={e => setSearchId(e.target.value)} className="bg-white text-gray-900 border-gray-200 flex-1" />
                      <Button variant="outline" onClick={handlePasteClick} className="w-full sm:w-auto">
                        <Clipboard className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Colar</span>
                      </Button>
                      {(searchId || searchedUser) && <Button variant="outline" onClick={handleClearSearch} className="w-full sm:w-auto">
                          <X className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Limpar</span>
                        </Button>}
                      <Button onClick={handleSearchUser} disabled={searching} className="w-full sm:w-auto">
                        {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
                      </Button>
                    </div>

                    {searchedUser && <div className="space-y-4 pt-4 border-t border-gray-200">
                        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                          <Card className="bg-gray-50 border-gray-200">
                            <CardHeader>
                              <CardTitle className="text-sm text-gray-700">Informações Pessoais</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                <span className="font-medium text-gray-900 min-w-[140px]">Nome:</span>
                                <span className="text-gray-700 break-words">{searchedUser.name}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                <span className="font-medium text-gray-900 min-w-[140px]">Email:</span>
                                <span className="text-gray-700 break-all">{searchedUser.email}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                <span className="font-medium text-gray-900 min-w-[140px]">CPF:</span>
                                <span className="text-gray-700">{searchedUser.cpf || 'Não informado'}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                <span className="font-medium text-gray-900 min-w-[140px]">Telefone:</span>
                                <span className="text-gray-700">{searchedUser.phone || 'Não informado'}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                <span className="font-medium text-gray-900 min-w-[140px]">Data de Nascimento:</span>
                                <span className="text-gray-700">{searchedUser.birth_date || 'Não informado'}</span>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="bg-gray-50 border-gray-200">
                            <CardHeader>
                              <CardTitle className="text-sm text-gray-700">Status e Role</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                <span className="font-medium text-gray-900 min-w-[140px]">Status do Plano:</span>
                                <span className="flex flex-wrap gap-1">
                                  {getStatusBadge(searchedUser.status_plano)}
                                  {getPlanTypeBadge(searchedUser.plan_type)}
                                </span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                <span className="font-medium text-gray-900 min-w-[140px]">Role:</span>
                                <span>
                                  <Badge className="bg-purple-100 text-purple-800">
                                    {searchedUser.role || 'Não definido'}
                                  </Badge>
                                </span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                <span className="font-medium text-gray-900 min-w-[140px]">Cadastrado em:</span>
                                <span className="text-gray-700">
                                  {new Date(searchedUser.created_at).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                <span className="font-medium text-gray-900 min-w-[140px]">Último acesso:</span>
                                <span className="text-gray-700">
                                  {searchedUser.last_seen_at ? new Date(searchedUser.last_seen_at).toLocaleDateString('pt-BR') : 'Nunca'}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Resumo Financeiro */}
                        {(searchedUser.role === 'artist' || searchedUser.role === 'musician') && (userShows.length > 0 || userExpenses.length > 0) && (() => {
                    const userId = searchedUser.id;
                    const isArtist = searchedUser.role === 'artist';

                    // Cálculos para Artista
                    const totalReceita = isArtist ? userShows.reduce((sum, show) => sum + Number(show.fee), 0) : 0;

                    // Cálculos para Músico - quanto recebeu de participações
                    const totalRecebidoMusico = !isArtist ? userShows.reduce((sum, show) => {
                      const expenses = Array.isArray(show.expenses_team) ? show.expenses_team : [];
                      const myPayment = expenses.find((exp: any) => exp.musicianId === userId);
                      return sum + Number(myPayment?.cost || 0);
                    }, 0) : 0;
                    const totalDespesasEquipe = isArtist ? userShows.reduce((sum, show) => {
                      const expenses = Array.isArray(show.expenses_team) ? show.expenses_team : [];
                      return sum + expenses.reduce((expSum: number, exp: any) => expSum + Number(exp.cost || 0), 0);
                    }, 0) : 0;
                    const totalDespesasOutras = isArtist ? userShows.reduce((sum, show) => {
                      const expenses = Array.isArray(show.expenses_other) ? show.expenses_other : [];
                      return sum + expenses.reduce((expSum: number, exp: any) => expSum + Number(exp.amount || 0), 0);
                    }, 0) : 0;
                    const totalDespesasLocomocao = userExpenses.reduce((sum, exp) => sum + Number(exp.cost), 0);
                    const totalDespesas = totalDespesasEquipe + totalDespesasOutras + totalDespesasLocomocao;
                    const lucroLiquido = isArtist ? totalReceita - totalDespesas : totalRecebidoMusico - totalDespesasLocomocao;
                    const mediaShow = isArtist ? userShows.length > 0 ? totalReceita / userShows.length : 0 : userShows.length > 0 ? totalRecebidoMusico / userShows.length : 0;
                    return <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                              <CardHeader>
                                <CardTitle className="text-sm text-gray-900 flex items-center gap-2">
                                  💰 Resumo Financeiro {isArtist ? 'do Artista' : 'do Músico'}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                  {isArtist ? <>
                                      <div className="p-3 bg-white rounded-lg border border-green-200">
                                        <p className="text-xs text-gray-600 mb-1">Receita Total (Shows)</p>
                                        <p className="text-xl font-bold text-green-600">
                                          R$ {totalReceita.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {userShows.length} show{userShows.length !== 1 ? 's' : ''}
                                        </p>
                                      </div>

                                      <div className="p-3 bg-white rounded-lg border border-red-200">
                                        <p className="text-xs text-gray-600 mb-1">Despesas Totais</p>
                                        <p className="text-xl font-bold text-red-600">
                                          R$ {totalDespesas.toFixed(2)}
                                        </p>
                                        <div className="text-xs text-gray-500 mt-1 space-y-1">
                                          <div>Equipe: R$ {totalDespesasEquipe.toFixed(2)}</div>
                                          <div>Locomoção: R$ {totalDespesasLocomocao.toFixed(2)}</div>
                                          <div>Outras: R$ {totalDespesasOutras.toFixed(2)}</div>
                                        </div>
                                      </div>

                                      <div className="p-3 bg-white rounded-lg border border-blue-200 sm:col-span-2 lg:col-span-1">
                                        <p className="text-xs text-gray-600 mb-1">Lucro Líquido</p>
                                        <p className={`text-xl font-bold ${lucroLiquido >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                          R$ {lucroLiquido.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          Média/show: R$ {mediaShow.toFixed(2)}
                                        </p>
                                      </div>
                                    </> : <>
                                      <div className="p-3 bg-white rounded-lg border border-green-200">
                                        <p className="text-xs text-gray-600 mb-1">Total Recebido (Participações)</p>
                                        <p className="text-xl font-bold text-green-600">
                                          R$ {totalRecebidoMusico.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {userShows.length} participaç{userShows.length !== 1 ? 'ões' : 'ão'}
                                        </p>
                                      </div>

                                      <div className="p-3 bg-white rounded-lg border border-red-200">
                                        <p className="text-xs text-gray-600 mb-1">Despesas Locomoção</p>
                                        <p className="text-xl font-bold text-red-600">
                                          R$ {totalDespesasLocomocao.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {userExpenses.length} despesa{userExpenses.length !== 1 ? 's' : ''}
                                        </p>
                                      </div>

                                      <div className="p-3 bg-white rounded-lg border border-blue-200 sm:col-span-2 lg:col-span-1">
                                        <p className="text-xs text-gray-600 mb-1">Ganho Líquido</p>
                                        <p className={`text-xl font-bold ${lucroLiquido >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                          R$ {lucroLiquido.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          Média/show: R$ {mediaShow.toFixed(2)}
                                        </p>
                                      </div>
                                    </>}
                                </div>

                                {userExpenses.length > 0 && <div className="mt-4 pt-4 border-t border-green-200">
                                    <p className="text-xs font-medium text-gray-700 mb-2">
                                      Últimas Despesas de Locomoção ({userExpenses.length})
                                    </p>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                      {userExpenses.slice(0, 5).map(exp => <div key={exp.id} className="flex justify-between text-xs">
                                          <span className="text-gray-600">
                                            {exp.type.toUpperCase()} - {new Date(exp.created_at).toLocaleDateString('pt-BR')}
                                          </span>
                                          <span className="font-medium text-gray-900">R$ {Number(exp.cost).toFixed(2)}</span>
                                        </div>)}
                                    </div>
                                  </div>}
                              </CardContent>
                            </Card>;
                  })()}

                        {userShows.length > 0 && <Card className="bg-gray-50 border-gray-200">
                            <CardHeader>
                              <CardTitle className="text-sm text-gray-700">
                                {searchedUser.role === 'artist' ? `Shows (${userShows.length})` : `Participações em Shows (${userShows.length})`}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {userShows.map(show => {
                          const userId = searchedUser.id;
                          const isArtist = searchedUser.role === 'artist';

                          // Para músicos, buscar quanto recebeu - usar musicianId
                          let myPayment = 0;
                          if (!isArtist && Array.isArray(show.expenses_team)) {
                            const expense = show.expenses_team.find((exp: any) => exp.musicianId === userId);
                            myPayment = Number(expense?.cost || 0);
                          }
                          return <div key={show.id} className="p-3 bg-white rounded border border-gray-200">
                                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-900 break-words">{show.venue_name}</p>
                                          <p className="text-xs text-gray-600">
                                            {new Date(show.date_local).toLocaleDateString('pt-BR')} às {show.time_local}
                                          </p>
                                        </div>
                                        <Badge className="bg-green-100 text-green-800 self-start">
                                          {isArtist ? `Cachê: R$ ${Number(show.fee).toFixed(2)}` : `Recebido: R$ ${myPayment.toFixed(2)}`}
                                        </Badge>
                                      </div>
                                    </div>;
                        })}
                              </div>
                            </CardContent>
                          </Card>}

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button variant="outline" onClick={() => {
                      setEditingUser(searchedUser);
                      setEditName(searchedUser.name);
                      setShowEditDialog(true);
                    }} className="w-full sm:w-auto">
                            Editar Nome
                          </Button>
                          <Button variant="outline" onClick={() => {
                      setEditingUser(searchedUser);
                      setEditStatus(searchedUser.status_plano);
                      setShowStatusDialog(true);
                    }} className="w-full sm:w-auto">
                            Alterar Status
                          </Button>
                          <Button variant="outline" onClick={() => copyToClipboard(searchedUser.id)} className="w-full sm:w-auto">
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar ID
                          </Button>
                        </div>
                      </div>}
                  </div>
                </CardContent>
              </Card>}

            {currentTab === 'importacao' && (
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">📥 Importação Firebase</CardTitle>
                  <p className="text-sm text-gray-600 mt-2">
                    Importe seus shows, músicos e venues do Firebase para o Supabase
                  </p>
                </CardHeader>
                <CardContent>
                  {!importReport ? (
                    <div className="space-y-6">
                      {/* Upload do arquivo */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="firebase-json-upload"
                          disabled={importing}
                        />
                        <label
                          htmlFor="firebase-json-upload"
                          className="cursor-pointer block"
                        >
                          <div className="space-y-2">
                            <Download className="w-12 h-12 mx-auto text-gray-400" />
                            <p className="text-lg font-medium text-gray-900">
                              {importFile ? importFile.name : 'Selecione o arquivo JSON'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Clique para selecionar ou arraste o arquivo
                            </p>
                          </div>
                        </label>
                      </div>

                      {/* Preview dos dados */}
                      {importData && (
                        <div className="space-y-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold text-blue-900 mb-3">
                              Preview dos Dados
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              <div className="bg-white p-3 rounded border border-blue-200">
                                <p className="text-xs text-gray-600">Total de Shows</p>
                                <p className="text-2xl font-bold text-blue-600">
                                  {importData.length}
                                </p>
                              </div>
                              <div className="bg-white p-3 rounded border border-green-200">
                                <p className="text-xs text-gray-600">Receita Bruta</p>
                                <p className="text-2xl font-bold text-green-600">
                                  R$ {importData.reduce((sum: number, show: any) => sum + (show.fee || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                              <div className="bg-white p-3 rounded border border-red-200">
                                <p className="text-xs text-gray-600">Despesas Totais</p>
                                <p className="text-2xl font-bold text-red-600">
                                  R$ {(() => {
                                    try {
                                      return importData.reduce((sum: number, show: any) => {
                                        const despesasEquipe = (show.expenses?.team || []).reduce((s: number, exp: any) => s + (exp.cost || 0), 0);
                                        const despesasOutras = (show.expenses?.other || []).reduce((s: number, exp: any) => s + (exp.amount || exp.cost || 0), 0);
                                        return sum + despesasEquipe + despesasOutras;
                                      }, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                                    } catch (e) {
                                      return '0,00';
                                    }
                                  })()}
                                </p>
                              </div>
                              <div className="bg-white p-3 rounded border border-purple-200">
                                <p className="text-xs text-gray-600">Venues Únicos</p>
                                <p className="text-2xl font-bold text-purple-600">
                                  {new Set(importData.map((s: any) => s.venueName)).size}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Botão de importação */}
                          <div className="flex gap-3">
                            <Button
                              onClick={handleImport}
                              disabled={importing}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                              size="lg"
                            >
                              {importing ? (
                                <>
                                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                  Importando...
                                </>
                              ) : (
                                <>
                                  <Download className="w-5 h-5 mr-2" />
                                  Confirmar Importação
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => {
                                setImportFile(null);
                                setImportData(null);
                              }}
                              variant="outline"
                              disabled={importing}
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          </div>

                          {/* Barra de progresso */}
                          {importing && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <p className="text-sm text-yellow-800 mb-2">
                                🔄 Importando dados... Isso pode levar alguns segundos.
                              </p>
                              <div className="w-full bg-yellow-200 rounded-full h-2">
                                <div className="bg-yellow-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Relatório de importação
                    <div className="space-y-6">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">✅</span>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-green-900">
                              Importação Concluída!
                            </h3>
                            <p className="text-sm text-green-700">
                              Todos os dados foram importados com sucesso
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                          <div className="bg-white p-4 rounded-lg border border-green-200">
                            <p className="text-xs text-gray-600 mb-1">Shows Importados</p>
                            <p className="text-3xl font-bold text-green-600">
                              {importReport.shows_imported}
                            </p>
                          </div>
                          {importReport.shows_skipped > 0 && (
                            <div className="bg-white p-4 rounded-lg border border-yellow-200">
                              <p className="text-xs text-gray-600 mb-1">Shows Ignorados</p>
                              <p className="text-3xl font-bold text-yellow-600">
                                {importReport.shows_skipped}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">Sem data</p>
                            </div>
                          )}
                          <div className="bg-white p-4 rounded-lg border border-blue-200">
                            <p className="text-xs text-gray-600 mb-1">Músicos Criados</p>
                            <p className="text-3xl font-bold text-blue-600">
                              {importReport.musicians_created}
                            </p>
                          </div>
                          <div className="bg-white p-4 rounded-lg border border-purple-200">
                            <p className="text-xs text-gray-600 mb-1">Venues Criados</p>
                            <p className="text-3xl font-bold text-purple-600">
                              {importReport.venues_created}
                            </p>
                          </div>
                          <div className="bg-white p-4 rounded-lg border border-green-200">
                            <p className="text-xs text-gray-600 mb-1">Receita Bruta</p>
                            <p className="text-2xl font-bold text-green-600">
                              R$ {importReport.receita_bruta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="bg-white p-4 rounded-lg border border-red-200">
                            <p className="text-xs text-gray-600 mb-1">Despesas Totais</p>
                            <p className="text-2xl font-bold text-red-600">
                              R$ {importReport.despesas_totais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="bg-white p-4 rounded-lg border border-blue-200">
                            <p className="text-xs text-gray-600 mb-1">Lucro Líquido</p>
                            <p className="text-2xl font-bold text-blue-600">
                              R$ {importReport.lucro_liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => navigate('/artist/dashboard')}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          Ver Dashboard
                        </Button>
                        <Button
                          onClick={() => {
                            setImportReport(null);
                            setImportFile(null);
                            setImportData(null);
                          }}
                          variant="outline"
                        >
                          Nova Importação
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {currentTab === 'administradores' && (
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">🛡️ Gerenciar Permissões</CardTitle>
                  <p className="text-sm text-gray-600 mt-2">
                    Adicione ou remova permissões de Administrador e Suporte para usuários do sistema
                  </p>
                </CardHeader>
                <CardContent>
                  {loadingAdmins ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    </div>
                  ) : (
                    <>
                      {/* Header com busca e botão de refresh */}
                      <div className="mb-6 space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Buscar por nome, email, CPF, telefone ou ID..."
                            value={adminSearchQuery}
                            onChange={(e) => setAdminSearchQuery(e.target.value)}
                            className="bg-white text-gray-900 border-gray-200 flex-1"
                          />
                          <Button
                            variant="outline"
                            onClick={() => {
                              fetchAdminUsers();
                              toast.success('Lista atualizada!');
                            }}
                            className="shrink-0"
                          >
                            <Loader2 className="w-4 h-4 mr-2" />
                            Atualizar
                          </Button>
                        </div>
                        {lastUpdate && (
                          <p className="text-xs text-gray-500">
                            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
                          </p>
                        )}
                      </div>

                      <div className="space-y-4">
                        {/* Usuários com permissões especiais */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">
                            Usuários com Permissões Especiais ({adminUsers.filter((u: any) => {
                              if (!u.isAdmin && !u.isSupport) return false;
                              if (!adminSearchQuery) return true;
                              const query = adminSearchQuery.toLowerCase();
                              return (
                                u.name.toLowerCase().includes(query) ||
                                u.email.toLowerCase().includes(query) ||
                                u.id.toLowerCase().includes(query) ||
                                (u.cpf && u.cpf.includes(query)) ||
                                (u.phone && u.phone.includes(query))
                              );
                            }).length})
                          </h3>
                          <div className="space-y-2">
                            {adminUsers.filter((u: any) => {
                              if (!u.isAdmin && !u.isSupport) return false;
                              if (!adminSearchQuery) return true;
                              const query = adminSearchQuery.toLowerCase();
                              return (
                                u.name.toLowerCase().includes(query) ||
                                u.email.toLowerCase().includes(query) ||
                                u.id.toLowerCase().includes(query) ||
                                (u.cpf && u.cpf.includes(query)) ||
                                (u.phone && u.phone.includes(query))
                              );
                            }).map((user: any) => (
                              <div
                                key={user.id}
                                className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{user.name}</p>
                                  <p className="text-xs text-gray-600">{user.email}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {user.isAdmin && (
                                    <Badge className="bg-purple-100 text-purple-800">
                                      👑 Admin
                                    </Badge>
                                  )}
                                  {user.isSupport && (
                                    <Badge className="bg-blue-100 text-blue-800">
                                      🎧 Suporte
                                    </Badge>
                                  )}
                                  <div className="flex gap-1">
                                    {user.isAdmin && user.email !== 'ghabriellreis@gmail.com' && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRevokeAdmin(user.id, user.name)}
                                        className="text-red-600 hover:text-red-700 text-xs"
                                      >
                                        Remover Admin
                                      </Button>
                                    )}
                                    {user.isSupport && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRevokeSupport(user.id, user.name)}
                                        className="text-red-600 hover:text-red-700 text-xs"
                                      >
                                        Remover Suporte
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Usuários que podem ser promovidos */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">
                            Usuários do Sistema ({adminUsers.filter((u: any) => {
                              if (u.isAdmin || u.isSupport) return false;
                              if (!adminSearchQuery) return true;
                              const query = adminSearchQuery.toLowerCase();
                              return (
                                u.name.toLowerCase().includes(query) ||
                                u.email.toLowerCase().includes(query) ||
                                u.id.toLowerCase().includes(query) ||
                                (u.cpf && u.cpf.includes(query)) ||
                                (u.phone && u.phone.includes(query))
                              );
                            }).length})
                          </h3>
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {adminUsers.filter((u: any) => {
                              if (u.isAdmin || u.isSupport) return false;
                              if (!adminSearchQuery) return true;
                              const query = adminSearchQuery.toLowerCase();
                              return (
                                u.name.toLowerCase().includes(query) ||
                                u.email.toLowerCase().includes(query) ||
                                u.id.toLowerCase().includes(query) ||
                                (u.cpf && u.cpf.includes(query)) ||
                                (u.phone && u.phone.includes(query))
                              );
                            }).map((user: any) => (
                              <div
                                key={user.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{user.name}</p>
                                  <p className="text-xs text-gray-600">{user.email}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {getStatusBadge(user.status_plano)}
                                  <div className="flex gap-1">
                                    {!user.isAdmin && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePromoteToAdmin(user.id, user.name)}
                                        className="text-purple-600 hover:text-purple-700 text-xs"
                                      >
                                        👑 Admin
                                      </Button>
                                    )}
                                    {!user.isSupport && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePromoteToSupport(user.id, user.name)}
                                        className="text-blue-600 hover:text-blue-700 text-xs"
                                      >
                                        🎧 Suporte
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {currentTab === 'financeiro' && <div className="space-y-6">
                {/* Configuração de Taxas */}
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Configuração de Taxas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="google-tax" className="text-gray-900">Taxa Google Play (%)</Label>
                          <Input id="google-tax" type="number" value={googleTax} onChange={e => setGoogleTax(Number(e.target.value))} className="bg-white text-gray-900 border-gray-200" min="0" max="100" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="apple-tax" className="text-gray-900">Taxa Apple Store (%)</Label>
                          <Input id="apple-tax" type="number" value={appleTax} onChange={e => setAppleTax(Number(e.target.value))} className="bg-white text-gray-900 border-gray-200" min="0" max="100" />
                        </div>
                      </div>
                      <Button onClick={handleSaveTax} disabled={savingTax} className="w-full md:w-auto">
                        {savingTax ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Salvar Configuração
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Resumo Financeiro */}
                <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900">💰 Resumo de Receita Mensal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Usuários Ativos</p>
                        <p className="text-2xl font-bold text-purple-600">{activeUsersCount}</p>
                      </div>

                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Receita Bruta</p>
                        <p className="text-2xl font-bold text-green-600">
                          R$ {(activeUsersCount * 29.90).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">R$ 29,90 × {activeUsersCount}</p>
                      </div>

                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Taxa Apple ({appleTax}%)</p>
                        <p className="text-2xl font-bold text-red-600">
                          - R$ {(activeUsersCount * 29.90 * (appleTax / 100)).toFixed(2)}
                        </p>
                      </div>

                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Taxa Google ({googleTax}%)</p>
                        <p className="text-2xl font-bold text-red-600">
                          - R$ {(activeUsersCount * 29.90 * (googleTax / 100)).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-white rounded-lg border-2 border-purple-300">
                      <p className="text-sm text-gray-600 mb-1">Receita Líquida Estimada</p>
                      <p className="text-3xl font-bold text-purple-600">
                        R$ {(activeUsersCount * 29.90 * (1 - appleTax / 100 - googleTax / 100)).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Após taxas Apple e Google
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>}

            {currentTab === 'notificacoes' && <div className="space-y-6">
                {/* Formulário de Envio */}
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900">📢 Enviar Notificação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="notif-title" className="text-gray-900">Título</Label>
                        <Input id="notif-title" placeholder="Ex: Nova atualização disponível" value={notificationTitle} onChange={e => setNotificationTitle(e.target.value)} className="bg-white text-gray-900 border-gray-200" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notif-message" className="text-gray-900">Mensagem</Label>
                        <Textarea id="notif-message" placeholder="Escreva sua mensagem aqui..." value={notificationMessage} onChange={e => setNotificationMessage(e.target.value)} className="bg-white text-gray-900 border-gray-200 min-h-[100px]" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notif-link" className="text-gray-900">Link (Opcional)</Label>
                        <div className="flex gap-2">
                          <Input id="notif-link" placeholder="https://... ou /artist/dashboard" value={notificationLink} onChange={e => setNotificationLink(e.target.value)} className="bg-white text-gray-900 border-gray-200 flex-1" />
                          <Button type="button" variant="outline" onClick={() => setShowRouteSelector(true)} className="flex-shrink-0">
                            <LinkIcon className="w-4 h-4 mr-2" />
                            Páginas
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Clique em "Páginas" para selecionar uma página do app ou digite um link externo
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notif-filter" className="text-gray-900">Destinatários</Label>
                        <Select value={notificationFilter} onValueChange={setNotificationFilter}>
                          <SelectTrigger className="bg-white text-gray-900 border-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white text-gray-900 border border-gray-200">
                            <SelectItem value="todos">Todos os usuários</SelectItem>
                            <SelectItem value="artistas">Apenas Artistas</SelectItem>
                            <SelectItem value="musicos">Apenas Músicos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button onClick={handleSendNotification} disabled={sendingNotification} className="w-full text-slate-50">
                        {sendingNotification ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                        Enviar Notificação
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Histórico */}
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Histórico de Notificações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {notifications.length === 0 ? <p className="text-gray-500 text-center py-4">Nenhuma notificação enviada ainda</p> : notifications.map(notif => <div key={notif.id} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-gray-900">{notif.title}</h3>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  {new Date(notif.created_at).toLocaleDateString('pt-BR')}
                                </span>
                                <Button variant="ghost" size="sm" onClick={() => {
                          setDeletingNotificationId(notif.id);
                          setShowDeleteDialog(true);
                        }} className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0">
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{notif.message}</p>
                            {notif.link && <a href={notif.link} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-600 hover:underline">
                                {notif.link}
                              </a>}
                          </div>)}
                    </div>
                  </CardContent>
                </Card>
              </div>}

            {currentTab === 'push-mobile' && <div className="space-y-6">
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-gray-900">📱 Enviar Push Notification</CardTitle>
                        <p className="text-sm text-gray-500 mt-2">
                          Envie notificações push em massa para usuários do app mobile
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {loadingFcmCount ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        ) : (
                          <>
                            {fcmUsersCount > 0 ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                ✓ {fcmUsersCount} com app instalado
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                ⚠ Nenhum usuário com app
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Status Info */}
                      {fcmUsersCount === 0 && !loadingFcmCount && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex gap-3">
                            <div className="text-yellow-600 mt-0.5">⚠️</div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-yellow-900 mb-1">
                                Nenhum usuário instalou o app mobile ainda
                              </p>
                              <p className="text-xs text-yellow-700">
                                Após instalarem o APK e aceitarem notificações, eles aparecerão aqui.
                                A notificação ainda será salva e ficará visível no app web.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {fcmUsersCount > 0 && !loadingFcmCount && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex gap-3">
                            <div className="text-green-600 mt-0.5">✓</div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-green-900">
                                {fcmUsersCount} usuário(s) receberão esta notificação push
                              </p>
                              <p className="text-xs text-green-700 mt-1">
                                Todos os demais verão a notificação no sino do app web
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Filtro de destinatários */}
                      <div className="space-y-2">
                        <Label htmlFor="push-filter" className="text-gray-900">Destinatários</Label>
                        <Select 
                          value={pushUserSearch} 
                          onValueChange={(value) => {
                            setPushUserSearch(value);
                            // Atualizar contagem quando mudar filtro
                            setTimeout(() => fetchFcmUsersCount(), 100);
                          }}
                        >
                          <SelectTrigger className="bg-white text-gray-900 border-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white text-gray-900 border border-gray-200">
                            <SelectItem value="todos">Todos os usuários</SelectItem>
                            <SelectItem value="artistas">Apenas Artistas</SelectItem>
                            <SelectItem value="musicos">Apenas Músicos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Título */}
                      <div className="space-y-2">
                        <Label htmlFor="push-title" className="text-gray-900">Título</Label>
                        <Input
                          id="push-title"
                          placeholder="Ex: Nova atualização disponível"
                          value={pushTitle}
                          onChange={e => setPushTitle(e.target.value)}
                          className="bg-white text-gray-900 border-gray-200"
                        />
                      </div>

                      {/* Mensagem */}
                      <div className="space-y-2">
                        <Label htmlFor="push-message" className="text-gray-900">Mensagem</Label>
                        <Textarea
                          id="push-message"
                          placeholder="Escreva sua mensagem aqui..."
                          value={pushMessage}
                          onChange={e => setPushMessage(e.target.value)}
                          className="bg-white text-gray-900 border-gray-200 min-h-[100px]"
                        />
                      </div>

                      {/* Link */}
                      <div className="space-y-2">
                        <Label htmlFor="push-link" className="text-gray-900">Link (Opcional)</Label>
                        <Input
                          id="push-link"
                          placeholder="/artist/dashboard ou URL externa"
                          value={pushLink}
                          onChange={e => setPushLink(e.target.value)}
                          className="bg-white text-gray-900 border-gray-200"
                        />
                      </div>

                      {/* Botão de envio */}
                      <Button
                        onClick={async () => {
                          if (!pushTitle.trim() || !pushMessage.trim()) {
                            toast.error('Preencha título e mensagem');
                            return;
                          }

                          try {
                            setSendingPush(true);

                            // Buscar TODOS os usuários elegíveis (com ou sem FCM token)
                            let allUsersQuery = supabase
                              .from('profiles')
                              .select('id, name');

                            // Filtrar por role se necessário
                            if (pushUserSearch === 'artistas' || pushUserSearch === 'musicos') {
                              const role = pushUserSearch === 'artistas' ? 'artist' : 'musician';
                              const { data: roleUsers } = await supabase
                                .from('user_roles')
                                .select('user_id')
                                .eq('role', role);
                              
                              if (roleUsers && roleUsers.length > 0) {
                                const userIds = roleUsers.map(r => r.user_id);
                                allUsersQuery = allUsersQuery.in('id', userIds);
                              }
                            }

                            const { data: allUsers, error: fetchError } = await allUsersQuery;

                            if (fetchError) throw fetchError;

                            if (!allUsers || allUsers.length === 0) {
                              toast.error('Nenhum usuário encontrado');
                              return;
                            }

                            console.log(`📱 Criando notificação para ${allUsers.length} usuários...`);

                            // Criar uma notificação global no banco
                            const { data: notification, error: notifError } = await supabase
                              .from('notifications')
                              .insert({
                                title: pushTitle,
                                message: pushMessage,
                                link: pushLink || null,
                                created_by: null, // Notificação global
                              })
                              .select()
                              .single();

                            if (notifError) throw notifError;

                            console.log('✅ Notificação criada no banco:', notification.id);

                            // Agora buscar usuários COM FCM token para enviar push
                            let fcmQuery = supabase
                              .from('profiles')
                              .select('id, name, fcm_token')
                              .not('fcm_token', 'is', null);

                            if (pushUserSearch === 'artistas' || pushUserSearch === 'musicos') {
                              const role = pushUserSearch === 'artistas' ? 'artist' : 'musician';
                              const { data: roleUsers } = await supabase
                                .from('user_roles')
                                .select('user_id')
                                .eq('role', role);
                              
                              if (roleUsers && roleUsers.length > 0) {
                                const userIds = roleUsers.map(r => r.user_id);
                                fcmQuery = fcmQuery.in('id', userIds);
                              }
                            }

                            const { data: fcmUsers } = await fcmQuery;

                            let pushSuccessCount = 0;
                            let pushErrorCount = 0;

                            // Enviar push apenas para quem tem FCM token
                            if (fcmUsers && fcmUsers.length > 0) {
                              console.log(`📤 Enviando push para ${fcmUsers.length} usuários com app instalado...`);

                              for (const user of fcmUsers) {
                                try {
                                  const { error } = await supabase.functions.invoke('send-push-notification', {
                                    body: {
                                      userId: user.id,
                                      title: pushTitle,
                                      body: pushMessage,
                                      link: pushLink || null,
                                    }
                                  });

                                  if (error) {
                                    console.error(`Erro ao enviar push para ${user.name}:`, error);
                                    pushErrorCount++;
                                  } else {
                                    pushSuccessCount++;
                                  }
                                } catch (err) {
                                  console.error(`Erro ao enviar push para ${user.name}:`, err);
                                  pushErrorCount++;
                                }
                              }
                            }

                            // Mensagem de sucesso detalhada
                            const webOnlyUsers = allUsers.length - (fcmUsers?.length || 0);
                            if (pushSuccessCount > 0) {
                              toast.success(
                                `✅ Notificação enviada! ${pushSuccessCount} via push mobile, ${webOnlyUsers} via web app`,
                                { duration: 5000 }
                              );
                            } else {
                              toast.success(
                                `✅ Notificação salva! Visível para ${allUsers.length} usuário(s) no app web`,
                                { duration: 5000 }
                              );
                            }

                            if (pushErrorCount > 0) {
                              toast.error(`⚠️ ${pushErrorCount} push(es) falharam (notificação web ainda funcionará)`);
                            }

                            setPushTitle('');
                            setPushMessage('');
                            setPushLink('');
                            await fetchFcmUsersCount();
                          } catch (error) {
                            console.error('Erro ao enviar notificação:', error);
                            toast.error('Erro ao enviar notificação');
                          } finally {
                            setSendingPush(false);
                          }
                        }}
                        disabled={sendingPush}
                        className="w-full text-slate-50"
                      >
                        {sendingPush ? (
                          <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Enviando...</>
                        ) : (
                          <><Send className="w-4 h-4 mr-2" /> Enviar Notificação</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>}

            {currentTab === 'contatos' && <Card className="bg-white border-gray-200">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <CardTitle className="text-gray-900">📱 Contatos WhatsApp</CardTitle>
                    <Button onClick={handleExportContacts} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Exportar XLSX</span>
                      <span className="sm:hidden">Exportar</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Filtros */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Select value={contactFilter} onValueChange={setContactFilter}>
                        <SelectTrigger className="bg-white text-gray-900 border-gray-200 w-full sm:w-[200px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-gray-900 border border-gray-200">
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="ativos">Planos Ativos</SelectItem>
                          <SelectItem value="inativos">Planos Inativos</SelectItem>
                          <SelectItem value="artistas">Artistas</SelectItem>
                          <SelectItem value="musicos">Músicos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Lista de Contatos */}
                    {loadingContacts ? <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                      </div> : <>
                        {/* Versão Mobile - Cards */}
                        <div className="md:hidden space-y-3">
                          {contacts.filter(contact => {
                            if (contactFilter === 'todos') return true;
                            if (contactFilter === 'ativos') return contact.status_plano === 'ativo';
                            if (contactFilter === 'inativos') return contact.status_plano === 'inativo';
                            if (contactFilter === 'artistas') return contact.role === 'artist';
                            if (contactFilter === 'musicos') return contact.role === 'musician';
                            return true;
                          }).map(contact => <Card key={contact.id} className="bg-white border-gray-200">
                              <CardContent className="p-4 space-y-3">
                                <div className="flex justify-between items-start gap-2">
                                  <h3 className="font-semibold text-gray-900 flex-1">{contact.name}</h3>
                                  {getStatusBadge(contact.status_plano)}
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-500 min-w-[70px]">Telefone:</span>
                                    {contact.phone ? <a href={`https://wa.me/55${contact.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-mono">
                                        {contact.phone}
                                      </a> : <span className="text-gray-400">Não informado</span>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-500 min-w-[70px]">Tipo:</span>
                                    <Badge className="bg-purple-100 text-purple-800">
                                      {contact.role}
                                    </Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>)}
                        </div>

                        {/* Versão Desktop - Tabela */}
                        <div className="hidden md:block rounded-md border overflow-x-auto border-gray-200">
                          <table className="w-full bg-white">
                            <thead>
                              <tr className="border-b bg-gray-50 border-gray-200">
                                <th className="p-3 text-left font-medium text-sm text-gray-900">Nome</th>
                                <th className="p-3 text-left font-medium text-sm text-gray-900">Telefone</th>
                                <th className="p-3 text-left font-medium text-sm text-gray-900">Role</th>
                                <th className="p-3 text-left font-medium text-sm text-gray-900">Plano</th>
                              </tr>
                            </thead>
                            <tbody>
                              {contacts.filter(contact => {
                                if (contactFilter === 'todos') return true;
                                if (contactFilter === 'ativos') return contact.status_plano === 'ativo';
                                if (contactFilter === 'inativos') return contact.status_plano === 'inativo';
                                if (contactFilter === 'artistas') return contact.role === 'artist';
                                if (contactFilter === 'musicos') return contact.role === 'musician';
                                return true;
                              }).map(contact => <tr key={contact.id} className="border-b hover:bg-gray-50 border-gray-200">
                                    <td className="p-3 text-gray-900">{contact.name}</td>
                                    <td className="p-3">
                                      {contact.phone ? <a href={`https://wa.me/55${contact.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-mono text-sm">
                                          {contact.phone}
                                        </a> : <span className="text-gray-500 text-sm">Não informado</span>}
                                    </td>
                                    <td className="p-3">
                                      <Badge className="bg-purple-100 text-purple-800">
                                        {contact.role}
                                      </Badge>
                                    </td>
                                    <td className="p-3">{getStatusBadge(contact.status_plano)}</td>
                                  </tr>)}
                            </tbody>
                          </table>
                        </div>
                      </>}
                  </div>
                </CardContent>
              </Card>}

            {/* Suporte */}
            {currentTab === 'suporte' && <Card className="bg-white border-gray-200">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle className="text-gray-900">🎧 Tickets de Suporte</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">Gerencie solicitações de suporte dos usuários</p>
                    </div>
                    <div className="flex gap-2">
                      <Select value={supportFilter} onValueChange={setSupportFilter}>
                        <SelectTrigger className="bg-white text-gray-900 border-gray-200 w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-gray-900 border border-gray-200">
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="open">Abertos</SelectItem>
                          <SelectItem value="in_progress">Em Andamento</SelectItem>
                          <SelectItem value="closed">Fechados</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={fetchSupportTickets} variant="outline" size="sm" disabled={loadingSupportTickets}>
                        {loadingSupportTickets ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Atualizar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingSupportTickets ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {supportTickets
                        .filter(ticket => supportFilter === 'all' || ticket.status === supportFilter)
                        .map((ticket) => {
                          const getStatusColor = (status: string) => {
                            switch (status) {
                              case 'open': return 'bg-green-100 text-green-800 border-green-200';
                              case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                              case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
                              default: return 'bg-blue-100 text-blue-800 border-blue-200';
                            }
                          };

                          const getStatusLabel = (status: string) => {
                            switch (status) {
                              case 'open': return 'Aberto';
                              case 'in_progress': return 'Em Andamento';
                              case 'closed': return 'Fechado';
                              default: return status;
                            }
                          };

                          const getPriorityColor = (priority: string) => {
                            switch (priority) {
                              case 'high': return 'text-red-600';
                              case 'medium': return 'text-yellow-600';
                              case 'low': return 'text-green-600';
                              default: return 'text-gray-600';
                            }
                          };

                          const getPriorityLabel = (priority: string) => {
                            switch (priority) {
                              case 'high': return 'Alta';
                              case 'medium': return 'Média';
                              case 'low': return 'Baixa';
                              default: return priority;
                            }
                          };

                          return (
                            <Card key={ticket.id} className="bg-white border-gray-200">
                              <CardContent className="p-4 bg-white">
                                <div className="space-y-3">
                                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                    <div className="flex-1">
                                      <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {ticket.profile?.name} ({ticket.profile?.email})
                                      </p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Badge className={getStatusColor(ticket.status)}>
                                        {getStatusLabel(ticket.status)}
                                      </Badge>
                                      <Badge variant="outline" className={`bg-white border-gray-300 ${getPriorityColor(ticket.priority)}`}>
                                        {getPriorityLabel(ticket.priority)}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <p className="text-sm text-gray-700">{ticket.message}</p>
                                  
                                  {ticket.attachment_url && (
                                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-gray-700">📎 Anexo:</span>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                          onClick={() => window.open(ticket.attachment_url, '_blank')}
                                        >
                                          Abrir em nova aba
                                        </Button>
                                      </div>
                                      <img 
                                        src={ticket.attachment_url} 
                                        alt="Anexo do ticket" 
                                        className="w-full max-h-64 object-contain rounded bg-white border border-gray-200"
                                        onError={(e) => {
                                          // Se falhar ao carregar a imagem, mostra apenas o link
                                          e.currentTarget.style.display = 'none';
                                          const parent = e.currentTarget.parentElement;
                                          if (parent && !parent.querySelector('.fallback-link')) {
                                            const link = document.createElement('a');
                                            link.href = ticket.attachment_url;
                                            link.target = '_blank';
                                            link.className = 'text-sm text-blue-600 hover:underline fallback-link';
                                            link.textContent = 'Clique para ver o arquivo';
                                            parent.appendChild(link);
                                          }
                                        }}
                                      />
                                    </div>
                                  )}
                                  
                                  <div className="flex gap-2 pt-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                      onClick={() => {
                                        setRespondingTicket(ticket);
                                        setShowResponseDialog(true);
                                      }}
                                    >
                                      💬 Responder
                                    </Button>
                                    {ticket.status !== 'closed' && (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                                        onClick={async () => {
                                          try {
                                            const { error } = await supabase
                                              .from('support_tickets')
                                              .update({ status: 'closed', updated_at: new Date().toISOString() })
                                              .eq('id', ticket.id);
                                            
                                            if (error) throw error;
                                            toast.success('Ticket fechado!');
                                            fetchSupportTickets();
                                          } catch (error) {
                                            console.error('Erro ao fechar ticket:', error);
                                            toast.error('Erro ao fechar ticket');
                                          }
                                        }}
                                      >
                                        ✓ Fechar
                                      </Button>
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-200">
                                    <span>
                                      Criado em: {new Date(ticket.created_at).toLocaleString('pt-BR')}
                                    </span>
                                    {ticket.updated_at !== ticket.created_at && (
                                      <span>
                                        Atualizado: {new Date(ticket.updated_at).toLocaleString('pt-BR')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      
                      {supportTickets.filter(ticket => supportFilter === 'all' || ticket.status === supportFilter).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          Nenhum ticket encontrado
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>}

            {/* Logs do Sistema */}
            {currentTab === 'logs' && <div className="space-y-6">
                {/* Seção 1: Atividades de Usuários */}
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <CardTitle className="text-gray-900">👥 Atividades de Usuários</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">Cadastros, shows e notificações recentes</p>
                      </div>
                      <Button onClick={fetchSystemLogs} variant="outline" size="sm" disabled={loadingLogs}>
                        {loadingLogs ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Atualizar
                      </Button>
                    </div>
                  </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Filtro de Logs */}
                    <div className="flex gap-2">
                      <Select value={logFilter} onValueChange={setLogFilter}>
                        <SelectTrigger className="bg-white text-gray-900 border-gray-200 w-full sm:w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-gray-900 border border-gray-200">
                          <SelectItem value="all">Todos os Logs</SelectItem>
                          <SelectItem value="user_created">Novos Usuários</SelectItem>
                          <SelectItem value="show_created">Novos Shows</SelectItem>
                          <SelectItem value="notification_sent">Notificações</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Lista de Logs */}
                    {loadingLogs ? <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                      </div> : <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {systemLogs
                          .filter(log => logFilter === 'all' || log.type === logFilter)
                          .map((log, idx) => {
                            const getSeverityColor = (severity: string) => {
                              switch (severity) {
                                case 'success': return 'bg-green-100 text-green-800 border-green-200';
                                case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                                case 'error': return 'bg-red-100 text-red-800 border-red-200';
                                default: return 'bg-blue-100 text-blue-800 border-blue-200';
                              }
                            };

                            return (
                              <Card key={idx} className={`border ${getSeverityColor(log.severity)}`}>
                                <CardContent className="p-3">
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
                                    <p className="text-sm font-medium flex-1 break-words">{log.message}</p>
                                    <span className="text-xs text-gray-600 sm:whitespace-nowrap">
                                      {new Date(log.timestamp).toLocaleString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        {systemLogs.filter(log => logFilter === 'all' || log.type === logFilter).length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            Nenhum log encontrado
                          </div>
                        )}
                      </div>}
                  </div>
                </CardContent>
              </Card>

              {/* Seção 2: Logs Técnicos do Sistema */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle className="text-gray-900">🔧 Logs Técnicos do Sistema</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">Erros, performance e alertas de segurança</p>
                    </div>
                    <Button onClick={fetchTechnicalLogs} variant="outline" size="sm" disabled={loadingTechnicalLogs}>
                      {loadingTechnicalLogs ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Atualizar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Alertas do Sistema */}
                    {systemAlerts.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-900">🚨 Alertas Importantes</h3>
                        {systemAlerts.map((alert, idx) => (
                          <Card key={idx} className={`border ${
                            alert.severity === 'error' ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'
                          }`}>
                            <CardContent className="p-3">
                              <p className={`text-sm font-medium ${
                                alert.severity === 'error' ? 'text-red-900' : 'text-yellow-900'
                              }`}>
                                {alert.message}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Filtro de Logs Técnicos */}
                    <div className="flex gap-2">
                      <Select value={technicalLogFilter} onValueChange={setTechnicalLogFilter}>
                        <SelectTrigger className="bg-white text-gray-900 border-gray-200 w-full sm:w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-gray-900 border border-gray-200">
                          <SelectItem value="all">Todos os Logs</SelectItem>
                          <SelectItem value="database">Banco de Dados</SelectItem>
                          <SelectItem value="auth">Autenticação</SelectItem>
                          <SelectItem value="edge_function">Edge Functions</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Lista de Logs Técnicos */}
                    {loadingTechnicalLogs ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {technicalLogs
                          .filter(log => technicalLogFilter === 'all' || log.type === technicalLogFilter)
                          .map((log, idx) => {
                            const getSeverityColor = (severity: string) => {
                              switch (severity) {
                                case 'error': return 'bg-red-100 text-red-800 border-red-200';
                                case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                                default: return 'bg-blue-100 text-blue-800 border-blue-200';
                              }
                            };

                            const getTypeIcon = (type: string) => {
                              switch (type) {
                                case 'database': return '🗄️';
                                case 'auth': return '🔐';
                                case 'edge_function': return '⚡';
                                default: return '📊';
                              }
                            };

                            return (
                              <Card key={idx} className={`border ${getSeverityColor(log.severity)}`}>
                                <CardContent className="p-3">
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
                                    <p className="text-sm font-medium flex-1 break-words">
                                      {getTypeIcon(log.type)} {log.message}
                                    </p>
                                    <span className="text-xs text-gray-600 sm:whitespace-nowrap">
                                      {new Date(log.timestamp).toLocaleString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        {technicalLogs.filter(log => technicalLogFilter === 'all' || log.type === technicalLogFilter).length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            {loadingTechnicalLogs ? 'Carregando logs...' : '✅ Nenhum problema detectado! Sistema operando normalmente.'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>}
          </main>
        </SidebarInset>
      </div>

      {/* Edit Name Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Editar Nome do Usuário</DialogTitle>
            <DialogDescription className="text-gray-600">Altere o nome do usuário abaixo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-900">Nome</Label>
              <Input id="name" value={editName} onChange={e => setEditName(e.target.value)} className="bg-white text-gray-900 border-gray-200" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="bg-[#9b5af2] text-red-50">
              Cancelar
            </Button>
            <Button onClick={handleUpdateName} className="text-red-50">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Gerenciar Plano do Usuário</DialogTitle>
            <DialogDescription className="text-gray-600">Configure o status e o tipo de plano.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-gray-900">Status do Plano</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger className="bg-white text-gray-900 border-gray-200">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900 border border-gray-200">
                  <SelectItem value="pendente" className="hover:bg-gray-100">Pendente</SelectItem>
                  <SelectItem value="ativo" className="hover:bg-gray-100">Ativo</SelectItem>
                  <SelectItem value="inativo" className="hover:bg-gray-100">Inativo</SelectItem>
                  <SelectItem value="cancelado" className="hover:bg-gray-100">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="planType" className="text-gray-900">Tipo de Plano</Label>
              <Select value={editPlanType} onValueChange={setEditPlanType}>
                <SelectTrigger className="bg-white text-gray-900 border-gray-200">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900 border border-gray-200">
                  <SelectItem value="" className="hover:bg-gray-100">Nenhum</SelectItem>
                  <SelectItem value="monthly" className="hover:bg-gray-100">💳 Mensal</SelectItem>
                  <SelectItem value="annual" className="hover:bg-gray-100">🌟 Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowStatusDialog(false)} className="text-gray-50 bg-[#ad5af2]">
              Cancelar
            </Button>
            <Button onClick={handleUpdateStatus} className="text-gray-50">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Notification Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Remover Notificação</DialogTitle>
            <DialogDescription className="text-gray-600">
              Tem certeza que deseja remover esta notificação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => {
            setShowDeleteDialog(false);
            setDeletingNotificationId(null);
          }}>
              Cancelar
            </Button>
            <Button onClick={handleDeleteNotification} className="bg-red-600 hover:bg-red-700 text-white">
              Remover
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="bg-white text-gray-900 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Responder Ticket</DialogTitle>
            <DialogDescription className="text-gray-600">
              {respondingTicket && `Respondendo: ${respondingTicket.subject}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="response" className="text-gray-900">Mensagem</Label>
              <Textarea 
                id="response" 
                value={responseMessage} 
                onChange={e => setResponseMessage(e.target.value)} 
                className="bg-white text-gray-900 border-gray-200 min-h-[150px]" 
                placeholder="Digite sua resposta aqui..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowResponseDialog(false);
                setResponseMessage('');
                setRespondingTicket(null);
              }}
              disabled={sendingResponse}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleRespondTicket} 
              disabled={sendingResponse || !responseMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {sendingResponse ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Resposta
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <RouteSelector open={showRouteSelector} onOpenChange={setShowRouteSelector} onSelectRoute={path => setNotificationLink(path)} />
    </SidebarProvider>;
}