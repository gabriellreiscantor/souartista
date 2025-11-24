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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Users, Music, Mic2, Copy, MoreVertical, Loader2 } from 'lucide-react';

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
}

interface Stats {
  totalUsers: number;
  totalArtists: number;
  totalMusicians: number;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'usuarios';

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalArtists: 0, totalMusicians: 0 });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  const usersPerPage = 50;

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      toast.error('Acesso negado');
      const userRole = localStorage.getItem('userRole');
      if (userRole === 'artist') {
        navigate('/artist/dashboard');
      } else {
        navigate('/musician/dashboard');
      }
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
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: artistsCount } = await supabase
        .from('artists')
        .select('*', { count: 'exact', head: true });

      const { count: musiciansCount } = await supabase
        .from('musicians')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: usersCount || 0,
        totalArtists: artistsCount || 0,
        totalMusicians: musiciansCount || 0,
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

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
      const { error } = await supabase
        .from('profiles')
        .update({ name: editName })
        .eq('id', editingUser.id);

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
      const { error } = await supabase
        .from('profiles')
        .update({ status_plano: editStatus })
        .eq('id', editingUser.id);

      if (error) throw error;

      toast.success('Status atualizado com sucesso!');
      setShowStatusDialog(false);
      fetchUsers();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('ID copiado!');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { label: 'Pendente', icon: '⏳', className: 'bg-yellow-100 text-yellow-800' },
      ativo: { label: 'Ativo', icon: '✓', className: 'bg-green-100 text-green-800' },
      inativo: { label: 'Inativo', icon: '○', className: 'bg-gray-100 text-gray-800' },
      cancelado: { label: 'Cancelado', icon: '✕', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inativo;

    return (
      <Badge className={config.className}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
    );
  };

  const paginatedUsers = users.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );
  const totalPages = Math.ceil(users.length / usersPerPage);

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold">🛡️ Painel Administrativo</h1>
          </header>

          <main className="p-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Artistas</CardTitle>
                  <Music className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalArtists}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Músicos</CardTitle>
                  <Mic2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalMusicians}</div>
                </CardContent>
              </Card>
            </div>

            {/* Content based on tab */}
            {currentTab === 'usuarios' && (
              <Card>
                <CardHeader>
                  <CardTitle>Usuários Cadastrados</CardTitle>
                  <div className="flex gap-2 mt-4 text-sm">
                    <Badge className="bg-yellow-100 text-yellow-800">⏳ Pendente</Badge>
                    <Badge className="bg-green-100 text-green-800">✓ Ativo</Badge>
                    <Badge className="bg-gray-100 text-gray-800">○ Inativo</Badge>
                    <Badge className="bg-red-100 text-red-800">✕ Cancelado</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    </div>
                  ) : (
                    <>
                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="p-3 text-left font-medium">Nome</th>
                              <th className="p-3 text-left font-medium">Email</th>
                              <th className="p-3 text-left font-medium">Plano</th>
                              <th className="p-3 text-left font-medium">ID</th>
                              <th className="p-3 text-left font-medium">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedUsers.map((user) => (
                              <tr key={user.id} className="border-b hover:bg-muted/50">
                                <td className="p-3">{user.name}</td>
                                <td className="p-3">{user.email}</td>
                                <td className="p-3">{getStatusBadge(user.status_plano)}</td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground font-mono">
                                      {user.id.slice(0, 8)}...
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(user.id)}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setEditingUser(user);
                                          setEditName(user.name);
                                          setShowEditDialog(true);
                                        }}
                                      >
                                        Editar Nome
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setEditingUser(user);
                                          setEditStatus(user.status_plano);
                                          setShowStatusDialog(true);
                                        }}
                                      >
                                        Alterar Status do Plano
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          Mostrando {(currentPage - 1) * usersPerPage + 1} a{' '}
                          {Math.min(currentPage * usersPerPage, users.length)} de {users.length}{' '}
                          usuários
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            Anterior
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Próxima
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {currentTab === 'buscar' && (
              <Card>
                <CardHeader>
                  <CardTitle>Buscar por ID</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Em desenvolvimento...</p>
                </CardContent>
              </Card>
            )}

            {currentTab === 'financeiro' && (
              <Card>
                <CardHeader>
                  <CardTitle>Financeiro Global</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Em desenvolvimento...</p>
                </CardContent>
              </Card>
            )}

            {currentTab === 'notificacoes' && (
              <Card>
                <CardHeader>
                  <CardTitle>Notificações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Em desenvolvimento...</p>
                </CardContent>
              </Card>
            )}

            {currentTab === 'contatos' && (
              <Card>
                <CardHeader>
                  <CardTitle>Contatos WhatsApp</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Em desenvolvimento...</p>
                </CardContent>
              </Card>
            )}
          </main>
        </SidebarInset>
      </div>

      {/* Edit Name Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Nome do Usuário</DialogTitle>
            <DialogDescription>Altere o nome do usuário abaixo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateName}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Status do Plano</DialogTitle>
            <DialogDescription>Selecione o novo status do plano.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateStatus}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
