import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
import { Users, Music, Mic2, Copy, MoreVertical, Loader2, ArrowLeft, Clipboard } from 'lucide-react';
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  birth_date: string | null;
  status_plano: string;
  created_at: string;
  plan_purchased_at: string | null;
  last_seen_at: string | null;
  role?: string;
}
interface Show {
  id: string;
  venue_name: string;
  date_local: string;
  time_local: string;
  fee: number;
}
interface Stats {
  totalUsers: number;
  totalArtists: number;
  totalMusicians: number;
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
    totalMusicians: 0
  });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchedUser, setSearchedUser] = useState<UserProfile | null>(null);
  const [userShows, setUserShows] = useState<Show[]>([]);
  const [pasteInputRef, setPasteInputRef] = useState<HTMLTextAreaElement | null>(null);
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
    }
  }, [isAdmin]);
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
      } = await supabase.from('artists').select('*', {
        count: 'exact',
        head: true
      });
      const {
        count: musiciansCount
      } = await supabase.from('musicians').select('*', {
        count: 'exact',
        head: true
      });
      setStats({
        totalUsers: usersCount || 0,
        totalArtists: artistsCount || 0,
        totalMusicians: musiciansCount || 0
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
        status_plano: editStatus
      }).eq('id', editingUser.id);
      if (error) throw error;
      toast.success('Status atualizado com sucesso!');
      setShowStatusDialog(false);
      fetchUsers();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
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

      // Buscar shows se for artista
      let shows: Show[] = [];
      if (roleData?.role === 'artist') {
        const {
          data: showsData
        } = await supabase.from('shows').select('id, venue_name, date_local, time_local, fee').eq('uid', searchId.trim()).order('date_local', {
          ascending: false
        });
        shows = showsData || [];
      }
      setSearchedUser({
        ...profile,
        role: roleData?.role
      });
      setUserShows(shows);
      toast.success('Usuário encontrado!');
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      toast.error('Usuário não encontrado');
      setSearchedUser(null);
      setUserShows([]);
    } finally {
      setSearching(false);
    }
  };
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('ID copiado!');
  };

  const handlePasteClick = () => {
    // Foca no input oculto para capturar o paste
    if (pasteInputRef) {
      pasteInputRef.value = '';
      pasteInputRef.focus();
      pasteInputRef.select();
      
      // Tenta executar paste (funciona em alguns navegadores)
      try {
        document.execCommand('paste');
      } catch (e) {
        // Se falhar, instrui o usuário
        toast.info('Cole o ID (Ctrl+V ou toque longo)');
      }
    }
  };

  const handlePasteCapture = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    if (text) {
      setSearchId(text);
      toast.success('ID colado!');
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
  const paginatedUsers = users.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);
  const totalPages = Math.ceil(users.length / usersPerPage);
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const userRole = localStorage.getItem('userRole');
                navigate(userRole === 'artist' ? '/artist/dashboard' : '/musician/dashboard');
              }}
              className="ml-auto"
            >
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
                              <th className="p-2 md:p-3 text-left font-medium text-sm text-gray-900">Plano</th>
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
                                <td className="p-2 md:p-3">{getStatusBadge(user.status_plano)}</td>
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
                                setShowStatusDialog(true);
                              }}>
                                        Alterar Status do Plano
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
                    {/* Input oculto para capturar paste */}
                    <textarea
                      ref={setPasteInputRef}
                      onPaste={handlePasteCapture}
                      className="absolute opacity-0 pointer-events-none"
                      style={{ position: 'absolute', left: '-9999px' }}
                    />
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input placeholder="Cole o ID do usuário aqui..." value={searchId} onChange={e => setSearchId(e.target.value)} className="bg-white text-gray-900 border-gray-200 flex-1" />
                      <Button variant="outline" onClick={handlePasteClick} className="w-full sm:w-auto">
                        <Clipboard className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Colar</span>
                      </Button>
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
                                <span>{getStatusBadge(searchedUser.status_plano)}</span>
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

                        {searchedUser.role === 'artist' && userShows.length > 0 && <Card className="bg-gray-50 border-gray-200">
                            <CardHeader>
                              <CardTitle className="text-sm text-gray-700">Shows ({userShows.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {userShows.map(show => <div key={show.id} className="p-3 bg-white rounded border border-gray-200">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900 break-words">{show.venue_name}</p>
                                        <p className="text-xs text-gray-600">
                                          {new Date(show.date_local).toLocaleDateString('pt-BR')} às {show.time_local}
                                        </p>
                                      </div>
                                      <Badge className="bg-green-100 text-green-800 self-start">
                                        R$ {Number(show.fee).toFixed(2)}
                                      </Badge>
                                    </div>
                                  </div>)}
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

            {currentTab === 'financeiro' && <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Financeiro Global</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Em desenvolvimento...</p>
                </CardContent>
              </Card>}

            {currentTab === 'notificacoes' && <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Notificações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Em desenvolvimento...</p>
                </CardContent>
              </Card>}

            {currentTab === 'contatos' && <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Contatos WhatsApp</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Em desenvolvimento...</p>
                </CardContent>
              </Card>}
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
            <DialogTitle className="text-gray-900">Alterar Status do Plano</DialogTitle>
            <DialogDescription className="text-gray-600">Selecione o novo status do plano.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-gray-900">Status</Label>
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
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowStatusDialog(false)} className="text-gray-50 bg-[#ad5af2]">
              Cancelar
            </Button>
            <Button onClick={handleUpdateStatus} className="text-gray-50">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>;
}