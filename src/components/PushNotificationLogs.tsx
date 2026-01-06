import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, ChevronDown, ChevronUp, RefreshCw, Shield, CheckCircle2, XCircle, AlertTriangle, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PushLog {
  id: string;
  user_id: string;
  device_id: string | null;
  platform: string | null;
  fcm_token_preview: string | null;
  title: string;
  body: string;
  status: string;
  error_message: string | null;
  error_code: string | null;
  sent_at: string;
  source: string | null;
  user_name?: string;
}

interface TokenHistory {
  id: string;
  user_id: string;
  device_id: string;
  platform: string;
  device_name: string | null;
  fcm_token: string;
  action: string;
  old_token: string | null;
  created_at: string;
  user_name?: string;
}

interface PushStats {
  total: number;
  sent: number;
  failed: number;
  invalidToken: number;
  bySource: Record<string, number>;
}

export function PushNotificationLogs() {
  const [logs, setLogs] = useState<PushLog[]>([]);
  const [tokenHistory, setTokenHistory] = useState<TokenHistory[]>([]);
  const [stats, setStats] = useState<PushStats>({ total: 0, sent: 0, failed: 0, invalidToken: 0, bySource: {} });
  const [loading, setLoading] = useState(true);
  const [logsOpen, setLogsOpen] = useState(false);
  const [tokenHistoryOpen, setTokenHistoryOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch push logs (últimos 7 dias)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      let logsQuery = supabase
        .from('push_notification_logs')
        .select('*')
        .gte('sent_at', sevenDaysAgo.toISOString())
        .order('sent_at', { ascending: false })
        .limit(100);

      const { data: logsData, error: logsError } = await logsQuery;

      if (logsError) throw logsError;

      // Fetch user names for logs
      if (logsData && logsData.length > 0) {
        const userIds = [...new Set(logsData.map(l => l.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);
        const logsWithNames = logsData.map(log => ({
          ...log,
          user_name: profileMap.get(log.user_id) || 'Usuário desconhecido'
        }));
        setLogs(logsWithNames);

        // Calculate stats
        const total = logsData.length;
        const sent = logsData.filter(l => l.status === 'sent').length;
        const failed = logsData.filter(l => l.status === 'failed').length;
        const invalidToken = logsData.filter(l => l.status === 'invalid_token').length;
        
        // Stats by source
        const bySource: Record<string, number> = {};
        logsData.forEach(log => {
          const src = log.source || 'manual';
          bySource[src] = (bySource[src] || 0) + 1;
        });
        
        setStats({ total, sent, failed, invalidToken, bySource });
      } else {
        setLogs([]);
        setStats({ total: 0, sent: 0, failed: 0, invalidToken: 0, bySource: {} });
      }

      // Fetch token history (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: historyData, error: historyError } = await supabase
        .from('fcm_token_history')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (historyError) throw historyError;

      // Fetch user names for history
      if (historyData && historyData.length > 0) {
        const userIds = [...new Set(historyData.map(h => h.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);
        const historyWithNames = historyData.map(h => ({
          ...h,
          user_name: profileMap.get(h.user_id) || 'Usuário desconhecido'
        }));
        setTokenHistory(historyWithNames);
      } else {
        setTokenHistory([]);
      }
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800 text-xs"><CheckCircle2 className="w-3 h-3 mr-1" /> Enviado</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 text-xs"><XCircle className="w-3 h-3 mr-1" /> Falhou</Badge>;
      case 'invalid_token':
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs"><AlertTriangle className="w-3 h-3 mr-1" /> Token Inválido</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 text-xs">{status}</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'created':
        return <Badge className="bg-green-100 text-green-800 text-xs">Criado</Badge>;
      case 'updated':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Atualizado</Badge>;
      case 'deleted':
        return <Badge className="bg-red-100 text-red-800 text-xs">Deletado</Badge>;
      case 'backup_existing':
        return <Badge className="bg-purple-100 text-purple-800 text-xs">Backup</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 text-xs">{action}</Badge>;
    }
  };

  const successRate = stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;

  const getSourceBadge = (source: string | null) => {
    switch (source) {
      case 'marketing':
        return <Badge className="bg-purple-100 text-purple-800 text-xs">Marketing</Badge>;
      case 'show_reminder':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Show</Badge>;
      case 'engagement':
        return <Badge className="bg-orange-100 text-orange-800 text-xs">Engajamento</Badge>;
      case 'subscription':
        return <Badge className="bg-green-100 text-green-800 text-xs">Assinatura</Badge>;
      case 'manual':
      default:
        return <Badge className="bg-gray-100 text-gray-800 text-xs">Manual</Badge>;
    }
  };

  const filteredLogs = sourceFilter === 'all' 
    ? logs 
    : logs.filter(log => (log.source || 'manual') === sourceFilter);

  return (
    <div className="space-y-4 mt-6 w-full max-w-full overflow-hidden">
      {/* Estatísticas */}
      <Card className="bg-white border-gray-200 w-full">
        <CardHeader className="p-3 md:p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900 text-sm md:text-base flex items-center gap-2">
              📊 Estatísticas (7 dias)
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchData} 
              disabled={loading}
              className="h-7 text-xs shrink-0"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 md:p-4 pt-0">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 w-full">
              <div className="bg-gray-50 rounded-lg p-2 md:p-3 text-center min-w-0">
                <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-[10px] md:text-xs text-gray-500">Total</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2 md:p-3 text-center min-w-0">
                <p className="text-lg md:text-2xl font-bold text-green-600">{stats.sent}</p>
                <p className="text-[10px] md:text-xs text-gray-500">Enviados</p>
              </div>
              <div className="bg-red-50 rounded-lg p-2 md:p-3 text-center min-w-0">
                <p className="text-lg md:text-2xl font-bold text-red-600">{stats.failed}</p>
                <p className="text-[10px] md:text-xs text-gray-500">Falharam</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2 md:p-3 text-center min-w-0">
                <p className="text-lg md:text-2xl font-bold text-blue-600">{successRate}%</p>
                <p className="text-[10px] md:text-xs text-gray-500">Taxa Sucesso</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs Recentes */}
      <Collapsible open={logsOpen} onOpenChange={setLogsOpen}>
        <Card className="bg-white border-gray-200">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="p-3 md:p-4 cursor-pointer hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900 text-sm md:text-base flex items-center gap-2">
                  📝 Logs Recentes
                  <Badge className="bg-gray-100 text-gray-800 text-xs">{filteredLogs.length}</Badge>
                </CardTitle>
                {logsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-3 md:p-4 pt-0">
              {/* Filter by source */}
              <div className="flex flex-col gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500 shrink-0" />
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-40 h-8 text-xs">
                      <SelectValue placeholder="Filtrar por fonte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="show_reminder">Show Reminder</SelectItem>
                      <SelectItem value="engagement">Engajamento</SelectItem>
                      <SelectItem value="subscription">Assinatura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {Object.keys(stats.bySource).length > 0 && (
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {Object.entries(stats.bySource).map(([src, count]) => (
                      <Badge key={src} variant="outline" className="text-xs shrink-0">
                        {src}: {count}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {filteredLogs.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-4">Nenhum log encontrado</p>
                ) : (
                  <div className="space-y-2">
                    {filteredLogs.map(log => (
                      <div key={log.id} className="border border-gray-100 rounded-lg p-2 bg-gray-50">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {getStatusBadge(log.status)}
                              {getSourceBadge(log.source)}
                              <span className="text-xs text-gray-500">
                                {format(new Date(log.sent_at), "dd/MM HH:mm", { locale: ptBR })}
                              </span>
                              <Badge className="bg-gray-100 text-gray-600 text-xs">
                                {log.platform || '?'}
                              </Badge>
                            </div>
                            <p className="text-xs font-medium text-gray-900 mt-1 truncate">
                              {log.user_name}
                            </p>
                            <p className="text-xs text-gray-700 mt-0.5 truncate">
                              <strong>{log.title}</strong>: {log.body}
                            </p>
                            {log.error_message && (
                              <p className="text-xs text-red-600 mt-1">
                                ❌ {log.error_message}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Backup de Tokens */}
      <Collapsible open={tokenHistoryOpen} onOpenChange={setTokenHistoryOpen}>
        <Card className="bg-white border-gray-200">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="p-3 md:p-4 cursor-pointer hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900 text-sm md:text-base flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Backup de Tokens (30 dias)
                  <Badge className="bg-gray-100 text-gray-800 text-xs">{tokenHistory.length}</Badge>
                </CardTitle>
                {tokenHistoryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-3 md:p-4 pt-0 max-h-80 overflow-y-auto">
              {tokenHistory.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-4">Nenhum histórico encontrado</p>
              ) : (
                <div className="space-y-2">
                  {tokenHistory.map(h => (
                    <div key={h.id} className="border border-gray-100 rounded-lg p-2 bg-gray-50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getActionBadge(h.action)}
                            <span className="text-xs text-gray-500">
                              {format(new Date(h.created_at), "dd/MM HH:mm", { locale: ptBR })}
                            </span>
                            <Badge className="bg-gray-100 text-gray-600 text-xs">
                              {h.platform}
                            </Badge>
                          </div>
                          <p className="text-xs font-medium text-gray-900 mt-1 truncate">
                            {h.user_name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {h.device_name || h.device_id}
                          </p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">
                            Token: {h.fcm_token.substring(0, 30)}...
                          </p>
                          {h.old_token && (
                            <p className="text-xs text-gray-400 font-mono truncate">
                              Anterior: {h.old_token.substring(0, 30)}...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
