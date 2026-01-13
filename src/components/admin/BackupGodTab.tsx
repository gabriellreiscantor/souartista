import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Database, Play, RefreshCw, CheckCircle, XCircle, Clock, HardDrive, Users, Table, FileBox, Loader2, Eye, AlertTriangle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BackupLog {
  id: string;
  executed_at: string;
  status: string;
  tables_copied: number;
  records_copied: number;
  files_copied: number;
  duration_seconds: number | null;
  error_message: string | null;
  details: any;
  created_at: string;
}

export function BackupGodTab() {
  const [backupLogs, setBackupLogs] = useState<BackupLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningBackup, setRunningBackup] = useState(false);
  const [selectedLog, setSelectedLog] = useState<BackupLog | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    fetchBackupLogs();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchBackupLogs, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchBackupLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('backup_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setBackupLogs(data || []);
    } catch (error) {
      console.error('Erro ao buscar logs de backup:', error);
      toast.error('Erro ao carregar histórico de backups');
    } finally {
      setLoading(false);
    }
  };

  const handleRunBackup = async () => {
    if (runningBackup) return;
    
    const confirmed = window.confirm(
      '⚠️ Executar backup manual agora?\n\nIsso pode levar alguns minutos. O backup automático já roda diariamente às 3h.'
    );
    
    if (!confirmed) return;

    setRunningBackup(true);
    toast.info('🔄 Iniciando backup... Isso pode levar alguns minutos.');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/database-backup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao executar backup');
      }

      toast.success(`✅ Backup concluído! ${result.summary?.total_records_copied || 0} registros copiados`);
      fetchBackupLogs();
    } catch (error: any) {
      console.error('Erro ao executar backup:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setRunningBackup(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Sucesso</Badge>;
      case 'completed_with_warnings':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Com avisos</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Em execução</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Falhou</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const lastBackup = backupLogs[0];
  const successfulBackups = backupLogs.filter(l => l.status === 'completed' || l.status === 'completed_with_warnings').length;
  const failedBackups = backupLogs.filter(l => l.status === 'failed').length;

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-6 flex justify-center items-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Último Backup</span>
            </div>
            {lastBackup ? (
              <p className="text-sm font-medium text-gray-900">
                {formatDistanceToNow(new Date(lastBackup.executed_at), { addSuffix: true, locale: ptBR })}
              </p>
            ) : (
              <p className="text-sm text-gray-500">Nenhum backup</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Database className="w-4 h-4" />
              <span className="text-xs">Status</span>
            </div>
            {lastBackup ? getStatusBadge(lastBackup.status) : <span className="text-gray-500">-</span>}
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs">Sucessos</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{successfulBackups}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <XCircle className="w-4 h-4" />
              <span className="text-xs">Falhas</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{failedBackups}</p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo do último backup */}
      {lastBackup && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">
              📊 Último Backup - {format(new Date(lastBackup.executed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Table className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600">Tabelas</p>
                  <p className="font-bold text-gray-900">{lastBackup.tables_copied}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-600">Registros</p>
                  <p className="font-bold text-gray-900">{lastBackup.records_copied.toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileBox className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-xs text-gray-600">Arquivos</p>
                  <p className="font-bold text-gray-900">{lastBackup.files_copied}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-600">Auth Users</p>
                  <p className="font-bold text-gray-900">{lastBackup.details?.auth_users_backed_up || 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base text-gray-900">🗂️ Histórico de Backups</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchBackupLogs}
                className="text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Atualizar
              </Button>
              <Button
                size="sm"
                onClick={handleRunBackup}
                disabled={runningBackup}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
              >
                {runningBackup ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Executando...
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 mr-1" />
                    Executar Backup Agora
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {backupLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum backup registrado ainda</p>
              <p className="text-sm">O backup automático roda diariamente às 3h</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 text-gray-600 font-medium">Data/Hora</th>
                    <th className="text-left py-2 px-2 text-gray-600 font-medium">Status</th>
                    <th className="text-center py-2 px-2 text-gray-600 font-medium hidden sm:table-cell">Tabelas</th>
                    <th className="text-center py-2 px-2 text-gray-600 font-medium hidden sm:table-cell">Registros</th>
                    <th className="text-center py-2 px-2 text-gray-600 font-medium hidden md:table-cell">Arquivos</th>
                    <th className="text-center py-2 px-2 text-gray-600 font-medium hidden md:table-cell">Auth</th>
                    <th className="text-center py-2 px-2 text-gray-600 font-medium hidden lg:table-cell">Duração</th>
                    <th className="text-right py-2 px-2 text-gray-600 font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {backupLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-2">
                        <div>
                          <p className="font-medium text-gray-900 text-xs">
                            {format(new Date(log.executed_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {format(new Date(log.executed_at), 'HH:mm:ss', { locale: ptBR })}
                          </p>
                        </div>
                      </td>
                      <td className="py-2 px-2">{getStatusBadge(log.status)}</td>
                      <td className="text-center py-2 px-2 hidden sm:table-cell">{log.tables_copied}</td>
                      <td className="text-center py-2 px-2 hidden sm:table-cell">{log.records_copied.toLocaleString('pt-BR')}</td>
                      <td className="text-center py-2 px-2 hidden md:table-cell">{log.files_copied}</td>
                      <td className="text-center py-2 px-2 hidden md:table-cell">{log.details?.auth_users_backed_up || 0}</td>
                      <td className="text-center py-2 px-2 hidden lg:table-cell">{formatDuration(log.duration_seconds)}</td>
                      <td className="text-right py-2 px-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetailsDialog(true);
                          }}
                          className="h-7 px-2 text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          <span className="hidden sm:inline">Detalhes</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info sobre backup automático */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Backup Automático</p>
              <p className="text-sm text-blue-700">
                O sistema executa backup automático todos os dias às <strong>3:00 AM (horário de Brasília)</strong>.
                São copiadas todas as tabelas, arquivos de storage e usuários de autenticação para o Supabase de backup.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de detalhes */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-white text-gray-900 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              Detalhes do Backup
            </DialogTitle>
            {selectedLog && (
              <DialogDescription className="text-gray-600">
                {format(new Date(selectedLog.executed_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
              </DialogDescription>
            )}
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              {/* Status e métricas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Status</p>
                  {getStatusBadge(selectedLog.status)}
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Duração</p>
                  <p className="font-medium">{formatDuration(selectedLog.duration_seconds)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Tabelas Copiadas</p>
                  <p className="font-medium">{selectedLog.tables_copied}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Registros Copiados</p>
                  <p className="font-medium">{selectedLog.records_copied.toLocaleString('pt-BR')}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Arquivos Copiados</p>
                  <p className="font-medium">{selectedLog.files_copied}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Usuários Auth</p>
                  <p className="font-medium">{selectedLog.details?.auth_users_backed_up || 0}</p>
                </div>
              </div>

              {/* Erro se houver */}
              {selectedLog.error_message && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-1">Erro:</p>
                  <p className="text-sm text-red-700">{selectedLog.error_message}</p>
                </div>
              )}

              {/* Detalhes JSON */}
              {selectedLog.details && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Detalhes Completos:</p>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto max-h-64">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
