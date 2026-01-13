import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, RotateCcw, Loader2, Clock, User, Calendar, Copy, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DeletedUser {
  id: string;
  original_user_id: string;
  deleted_at: string;
  scheduled_permanent_delete_at: string;
  deleted_by: string;
  restored_at: string | null;
  restored_by: string | null;
  permanently_deleted_at: string | null;
  email: string;
  name: string;
  phone: string | null;
  plan_type: string | null;
  status_plano: string | null;
  status: string;
  user_roles: unknown;
}

export function DeletedUsersTab() {
  const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending_deletion' | 'restored' | 'permanently_deleted'>('pending_deletion');
  
  // Restore dialog
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [userToRestore, setUserToRestore] = useState<DeletedUser | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoredCredentials, setRestoredCredentials] = useState<{ email: string; password: string } | null>(null);
  
  // Permanent delete dialog
  const [showPermanentDeleteDialog, setShowPermanentDeleteDialog] = useState(false);
  const [userToPermanentDelete, setUserToPermanentDelete] = useState<DeletedUser | null>(null);
  const [permanentDeleteConfirmText, setPermanentDeleteConfirmText] = useState('');
  const [permanentDeleting, setPermanentDeleting] = useState(false);

  useEffect(() => {
    fetchDeletedUsers();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('deleted-users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deleted_users'
        },
        () => {
          fetchDeletedUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const fetchDeletedUsers = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('deleted_users')
        .select('*')
        .order('deleted_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDeletedUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários deletados:', error);
      toast.error('Erro ao carregar usuários deletados');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!userToRestore) return;

    try {
      setRestoring(true);
      
      const { data, error } = await supabase.functions.invoke('create-support-user', {
        body: {
          action: 'restore',
          deletedUserId: userToRestore.id
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setRestoredCredentials({
        email: userToRestore.email,
        password: data.tempPassword
      });
      
      toast.success(`Usuário ${userToRestore.name} restaurado com sucesso!`);
      fetchDeletedUsers();
    } catch (error: any) {
      console.error('Erro ao restaurar usuário:', error);
      toast.error(error.message || 'Erro ao restaurar usuário');
      setShowRestoreDialog(false);
    } finally {
      setRestoring(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!userToPermanentDelete || permanentDeleteConfirmText !== 'excluir permanentemente') return;

    try {
      setPermanentDeleting(true);
      
      const { data, error } = await supabase.functions.invoke('create-support-user', {
        body: {
          action: 'permanent_delete',
          deletedUserId: userToPermanentDelete.id
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Usuário ${userToPermanentDelete.name} excluído permanentemente`);
      setShowPermanentDeleteDialog(false);
      setUserToPermanentDelete(null);
      setPermanentDeleteConfirmText('');
      fetchDeletedUsers();
    } catch (error: any) {
      console.error('Erro ao excluir permanentemente:', error);
      toast.error(error.message || 'Erro ao excluir permanentemente');
    } finally {
      setPermanentDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const getDaysRemaining = (scheduledDate: string) => {
    const days = differenceInDays(new Date(scheduledDate), new Date());
    return Math.max(0, days);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_deletion':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ Aguardando exclusão</Badge>;
      case 'restored':
        return <Badge className="bg-green-100 text-green-800">✓ Restaurado</Badge>;
      case 'permanently_deleted':
        return <Badge className="bg-red-100 text-red-800">✕ Excluído permanentemente</Badge>;
      default:
        return null;
    }
  };

  const getRoleBadge = (roles: unknown) => {
    if (!roles || !Array.isArray(roles) || roles.length === 0) return null;
    const role = roles[0]?.role;
    if (role === 'artist') return <Badge className="bg-purple-100 text-purple-800">🎤 Artista</Badge>;
    if (role === 'musician') return <Badge className="bg-blue-100 text-blue-800">🎸 Músico</Badge>;
    return null;
  };

  const pendingCount = deletedUsers.filter(u => u.status === 'pending_deletion').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-red-500" />
            Usuários Deletados
          </h2>
          <p className="text-gray-500 mt-1">
            Usuários na lixeira são excluídos permanentemente após 30 dias
          </p>
        </div>
        
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-48 bg-white">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending_deletion">Aguardando exclusão ({pendingCount})</SelectItem>
            <SelectItem value="restored">Restaurados</SelectItem>
            <SelectItem value="permanently_deleted">Excluídos permanentemente</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-800 font-medium">Aguardando</span>
            </div>
            <p className="text-2xl font-bold text-yellow-900 mt-1">
              {deletedUsers.filter(u => u.status === 'pending_deletion').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">Restaurados</span>
            </div>
            <p className="text-2xl font-bold text-green-900 mt-1">
              {deletedUsers.filter(u => u.status === 'restored').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-medium">Excluídos</span>
            </div>
            <p className="text-2xl font-bold text-red-900 mt-1">
              {deletedUsers.filter(u => u.status === 'permanently_deleted').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card className="bg-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Carregando...</span>
            </div>
          ) : deletedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Trash2 className="h-12 w-12 mb-4 opacity-50" />
              <p>Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {deletedUsers.map((user) => (
                <div key={user.id} className="p-4 hover:bg-gray-50">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{user.name}</span>
                        {getRoleBadge(user.user_roles)}
                        {getStatusBadge(user.status)}
                      </div>
                      
                      <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Deletado em: {format(new Date(user.deleted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        
                        {user.status === 'pending_deletion' && (
                          <span className="flex items-center gap-1 text-orange-600 font-medium">
                            <Clock className="h-3 w-3" />
                            {getDaysRemaining(user.scheduled_permanent_delete_at)} dias restantes
                          </span>
                        )}
                        
                        {user.status === 'restored' && user.restored_at && (
                          <span className="flex items-center gap-1 text-green-600">
                            <RotateCcw className="h-3 w-3" />
                            Restaurado em: {format(new Date(user.restored_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                        
                        {user.status === 'permanently_deleted' && user.permanently_deleted_at && (
                          <span className="flex items-center gap-1 text-red-600">
                            <Trash2 className="h-3 w-3" />
                            Excluído em: {format(new Date(user.permanently_deleted_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {user.status === 'pending_deletion' && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUserToRestore(user);
                            setRestoredCredentials(null);
                            setShowRestoreDialog(true);
                          }}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restaurar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUserToPermanentDelete(user);
                            setPermanentDeleteConfirmText('');
                            setShowPermanentDeleteDialog(true);
                          }}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir Agora
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={(open) => {
        if (!open && !restoring) {
          setShowRestoreDialog(false);
          setUserToRestore(null);
          setRestoredCredentials(null);
        }
      }}>
        <DialogContent className="bg-white text-gray-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-600 flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Restaurar Usuário
            </DialogTitle>
          </DialogHeader>
          
          {restoredCredentials ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">✓ Usuário restaurado com sucesso!</p>
                <p className="text-green-700 text-sm mt-2">
                  Uma senha temporária foi gerada. O usuário deverá redefinir sua senha no próximo login.
                </p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-700">Email</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={restoredCredentials.email} readOnly className="bg-gray-50" />
                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(restoredCredentials.email)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-700">Senha Temporária</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={restoredCredentials.password} readOnly className="bg-gray-50 font-mono" />
                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(restoredCredentials.password)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                onClick={() => {
                  setShowRestoreDialog(false);
                  setUserToRestore(null);
                  setRestoredCredentials(null);
                }}
              >
                Fechar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <DialogDescription className="text-gray-600">
                Tem certeza que deseja restaurar o usuário <strong>{userToRestore?.name}</strong>?
              </DialogDescription>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <strong>O que será restaurado:</strong>
                </p>
                <ul className="text-blue-700 text-sm mt-2 space-y-1">
                  <li>• Perfil do usuário</li>
                  <li>• Shows cadastrados</li>
                  <li>• Músicos/Artistas</li>
                  <li>• Casas de show</li>
                  <li>• Gastos com transporte</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Uma nova senha temporária será gerada. O usuário deverá redefinir sua senha no próximo login.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowRestoreDialog(false);
                    setUserToRestore(null);
                  }}
                  disabled={restoring}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleRestore}
                  disabled={restoring}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {restoring ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Restaurando...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restaurar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Dialog */}
      <Dialog open={showPermanentDeleteDialog} onOpenChange={(open) => {
        if (!open && !permanentDeleting) {
          setShowPermanentDeleteDialog(false);
          setUserToPermanentDelete(null);
          setPermanentDeleteConfirmText('');
        }
      }}>
        <DialogContent className="bg-white text-gray-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Excluir Permanentemente
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!</p>
              <p className="text-red-700 text-sm mt-2">
                Ao excluir permanentemente, todos os dados do usuário serão perdidos e não poderão ser recuperados.
              </p>
            </div>
            
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-gray-700 text-sm">
                Usuário: <strong>{userToPermanentDelete?.name}</strong>
              </p>
              <p className="text-gray-500 text-sm">
                Email: {userToPermanentDelete?.email}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-900">
                Digite <span className="font-bold text-red-600">excluir permanentemente</span> para confirmar:
              </Label>
              <Input
                value={permanentDeleteConfirmText}
                onChange={(e) => setPermanentDeleteConfirmText(e.target.value.toLowerCase())}
                placeholder="excluir permanentemente"
                className="bg-white border-gray-300"
                disabled={permanentDeleting}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPermanentDeleteDialog(false);
                  setUserToPermanentDelete(null);
                  setPermanentDeleteConfirmText('');
                }}
                disabled={permanentDeleting}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={handlePermanentDelete}
                disabled={permanentDeleteConfirmText !== 'excluir permanentemente' || permanentDeleting}
                className="flex-1"
              >
                {permanentDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
