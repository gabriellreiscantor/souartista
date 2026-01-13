import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Loader2, 
  RefreshCw, 
  User, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ExternalLink,
  Apple,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AppleSubscriber {
  id: string;
  user_id: string;
  status: string;
  payment_platform: string;
  apple_product_id: string | null;
  next_due_date: string | null;
  amount: number;
  plan_type: string;
  created_at: string;
  profile: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface RevenueCatData {
  original_app_user_id: string;
  first_seen: string;
  last_seen: string;
  active_entitlement: any;
  active_subscription: any;
  subscription_history: any[];
  raw_entitlements: any;
  raw_subscriptions: any;
}

interface SubscriberDetails {
  success: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
  localSubscription: any;
  revenueCat: RevenueCatData | null;
  revenueCatError: string | null;
}

interface RevenueCatDirectResult {
  success: boolean;
  found: boolean;
  searchedId: string;
  isAnonymousId: boolean;
  localUser: { id: string; name: string; email: string } | null;
  localSubscription: any;
  revenueCat: RevenueCatData | null;
  error?: string;
  message?: string;
}

export function RevenueCatTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [subscriberDetails, setSubscriberDetails] = useState<SubscriberDetails | null>(null);
  const [notFoundMessage, setNotFoundMessage] = useState<string | null>(null);
  
  // RevenueCat ID search
  const [revenueCatIdQuery, setRevenueCatIdQuery] = useState('');
  const [searchingRevenueCatId, setSearchingRevenueCatId] = useState(false);
  const [revenueCatDirectResult, setRevenueCatDirectResult] = useState<RevenueCatDirectResult | null>(null);
  
  const [appleSubscribers, setAppleSubscribers] = useState<AppleSubscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);
  
  const [showRawData, setShowRawData] = useState(false);
  const [syncingUser, setSyncingUser] = useState(false);

  useEffect(() => {
    fetchAppleSubscribers();
  }, []);

  const fetchAppleSubscribers = async () => {
    setLoadingSubscribers(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-revenuecat-subscriber', {
        body: { action: 'list-apple-subscribers' }
      });

      if (error) throw error;
      if (data?.success) {
        setAppleSubscribers(data.subscribers || []);
      }
    } catch (error: any) {
      console.error('Error fetching apple subscribers:', error);
      toast.error('Erro ao buscar assinantes Apple');
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Digite um email, nome ou user ID');
      return;
    }

    setSearching(true);
    setSubscriberDetails(null);
    setNotFoundMessage(null);
    setRevenueCatDirectResult(null);

    try {
      // Check if it's a UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchQuery.trim());
      
      const { data, error } = await supabase.functions.invoke('get-revenuecat-subscriber', {
        body: isUUID 
          ? { userId: searchQuery.trim() } 
          : { email: searchQuery.trim() }
      });

      if (error) throw error;
      
      if (data?.success && data?.found !== false) {
        setSubscriberDetails(data);
        toast.success('Dados encontrados!');
      } else if (data?.found === false) {
        setNotFoundMessage(data.message || 'Usuário não encontrado no banco local');
        toast.info('Usuário não encontrado no banco local');
      } else {
        toast.error(data?.error || 'Usuário não encontrado');
      }
    } catch (error: any) {
      console.error('Error searching:', error);
      toast.error(error.message || 'Erro ao buscar usuário');
    } finally {
      setSearching(false);
    }
  };

  const handleSearchRevenueCatId = async () => {
    if (!revenueCatIdQuery.trim()) {
      toast.error('Digite um ID do RevenueCat');
      return;
    }

    setSearchingRevenueCatId(true);
    setRevenueCatDirectResult(null);
    setSubscriberDetails(null);
    setNotFoundMessage(null);

    try {
      const { data, error } = await supabase.functions.invoke('get-revenuecat-subscriber', {
        body: { 
          action: 'search-by-revenuecat-id',
          revenueCatId: revenueCatIdQuery.trim() 
        }
      });

      if (error) throw error;
      
      if (data?.success && data?.found) {
        setRevenueCatDirectResult(data);
        toast.success('Dados encontrados no RevenueCat!');
      } else {
        toast.error(data?.error || 'ID não encontrado no RevenueCat');
      }
    } catch (error: any) {
      console.error('Error searching RevenueCat ID:', error);
      toast.error(error.message || 'Erro ao buscar no RevenueCat');
    } finally {
      setSearchingRevenueCatId(false);
    }
  };

  const handleViewSubscriber = async (userId: string) => {
    setSearchQuery(userId);
    setSearching(true);
    setSubscriberDetails(null);

    try {
      const { data, error } = await supabase.functions.invoke('get-revenuecat-subscriber', {
        body: { userId }
      });

      if (error) throw error;
      
      if (data?.success) {
        setSubscriberDetails(data);
      } else {
        toast.error(data?.error || 'Erro ao buscar dados');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Erro ao buscar dados');
    } finally {
      setSearching(false);
    }
  };

  const handleSyncUser = async () => {
    if (!subscriberDetails?.user?.id) return;

    setSyncingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-revenuecat-subscriptions', {
        body: { userId: subscriberDetails.user.id }
      });

      if (error) throw error;
      toast.success('Sincronização iniciada!');
      
      // Refresh the data
      setTimeout(() => handleViewSubscriber(subscriberDetails.user.id), 2000);
    } catch (error: any) {
      console.error('Error syncing:', error);
      toast.error(error.message || 'Erro ao sincronizar');
    } finally {
      setSyncingUser(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Ativo</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" /> Cancelado</Badge>;
      case 'expired':
        return <Badge className="bg-gray-500"><Clock className="h-3 w-3 mr-1" /> Expirado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" /> Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Apple className="h-6 w-6" />
            RevenueCat - Assinaturas Apple
          </h2>
          <p className="text-gray-600">Consulte e gerencie dados de assinantes do iOS</p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchAppleSubscribers}
          disabled={loadingSubscribers}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingSubscribers ? 'animate-spin' : ''}`} />
          Atualizar Lista
        </Button>
      </div>

      {/* Search by Email/Name (local database) */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900 text-lg">Buscar por Email/Nome (banco local)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Email, nome ou User ID (UUID)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="bg-white border-gray-200 text-gray-900"
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {notFoundMessage && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-amber-700 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {notFoundMessage}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search by RevenueCat ID (direct API) */}
      <Card className="bg-purple-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-900 text-lg flex items-center gap-2">
            <Apple className="h-5 w-5" />
            Buscar por ID do RevenueCat (direto na API)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-purple-700 text-sm">
            Use esta opção para buscar IDs anônimos ($RCAnonymousID:xxx) ou qualquer ID diretamente no RevenueCat.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="$RCAnonymousID:xxxx ou UUID do usuário"
              value={revenueCatIdQuery}
              onChange={(e) => setRevenueCatIdQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchRevenueCatId()}
              className="bg-white border-purple-200 text-gray-900"
            />
            <Button 
              onClick={handleSearchRevenueCatId} 
              disabled={searchingRevenueCatId}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {searchingRevenueCatId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="h-4 w-4 mr-1" />
                  Buscar RC
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RevenueCat Direct Result */}
      {revenueCatDirectResult && (
        <Card className="bg-white border-purple-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Apple className="h-5 w-5 text-purple-600" />
              Resultado do RevenueCat
              {revenueCatDirectResult.isAnonymousId && (
                <Badge className="bg-orange-500 ml-2">ID Anônimo</Badge>
              )}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRawData(!showRawData)}
            >
              {showRawData ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Raw Data
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Searched ID Info */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-purple-800 mb-2">ID Pesquisado</h4>
              <p className="text-purple-900 font-mono text-sm break-all">{revenueCatDirectResult.searchedId}</p>
            </div>

            {/* Local User (if found) */}
            {revenueCatDirectResult.localUser ? (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Usuário Vinculado no Sistema
                </h4>
                <div className="space-y-1">
                  <p className="text-green-900"><strong>Nome:</strong> {revenueCatDirectResult.localUser.name}</p>
                  <p className="text-green-900"><strong>Email:</strong> {revenueCatDirectResult.localUser.email}</p>
                  <p className="text-green-900 text-xs font-mono"><strong>ID:</strong> {revenueCatDirectResult.localUser.id}</p>
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <h4 className="text-sm font-medium text-orange-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Usuário Não Vinculado
                </h4>
                <p className="text-orange-700 text-sm">
                  Este ID do RevenueCat não está associado a nenhum usuário no sistema local.
                  {revenueCatDirectResult.isAnonymousId && (
                    <span className="block mt-1">
                      Este é um ID anônimo - o usuário comprou antes de fazer login no app.
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* RevenueCat Data */}
            {revenueCatDirectResult.revenueCat && (
              <>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-purple-800 mb-3">Dados RevenueCat</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-purple-600">App User ID (Original)</p>
                      <p className="text-purple-900 font-mono text-sm break-all">
                        {revenueCatDirectResult.revenueCat.original_app_user_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-600">Primeiro Acesso</p>
                      <p className="text-purple-900">{formatDate(revenueCatDirectResult.revenueCat.first_seen)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-600">Último Acesso</p>
                      <p className="text-purple-900">{formatDate(revenueCatDirectResult.revenueCat.last_seen)}</p>
                    </div>
                  </div>
                </div>

                {/* Active Subscription */}
                {revenueCatDirectResult.revenueCat.active_subscription && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Assinatura Ativa
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-green-600">Produto</p>
                        <p className="text-green-900 font-medium">{revenueCatDirectResult.revenueCat.active_subscription.product_id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600">Expira em</p>
                        <p className="text-green-900">{formatDate(revenueCatDirectResult.revenueCat.active_subscription.expires_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600">Compra</p>
                        <p className="text-green-900">{formatDate(revenueCatDirectResult.revenueCat.active_subscription.purchase_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600">Sandbox</p>
                        <p className="text-green-900">{revenueCatDirectResult.revenueCat.active_subscription.is_sandbox ? 'Sim' : 'Não'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subscription History */}
                {revenueCatDirectResult.revenueCat.subscription_history.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Histórico de Transações
                    </h4>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left p-2 text-gray-600">Produto</th>
                            <th className="text-left p-2 text-gray-600">Compra</th>
                            <th className="text-left p-2 text-gray-600">Expira</th>
                            <th className="text-left p-2 text-gray-600">Status</th>
                            <th className="text-left p-2 text-gray-600">Sandbox</th>
                          </tr>
                        </thead>
                        <tbody>
                          {revenueCatDirectResult.revenueCat.subscription_history.map((sub, idx) => (
                            <tr key={idx} className="border-t border-gray-200">
                              <td className="p-2 font-mono text-xs text-gray-900">{sub.product_id}</td>
                              <td className="p-2 text-gray-700">{formatDate(sub.purchase_date)}</td>
                              <td className="p-2 text-gray-700">{formatDate(sub.expires_date)}</td>
                              <td className="p-2">
                                {sub.is_active ? (
                                  <Badge className="bg-green-500 text-xs">Ativo</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">Expirado</Badge>
                                )}
                              </td>
                              <td className="p-2 text-gray-700">{sub.is_sandbox ? '🧪' : '💰'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Raw Data */}
                {showRawData && (
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <h4 className="text-white text-sm font-medium mb-2">Raw RevenueCat Response</h4>
                    <pre className="text-green-400 text-xs whitespace-pre-wrap">
                      {JSON.stringify(revenueCatDirectResult.revenueCat, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subscriber Details */}
      {subscriberDetails && (
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-gray-900">
              <User className="h-5 w-5 inline mr-2" />
              Detalhes do Assinante
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSyncUser}
                disabled={syncingUser}
              >
                {syncingUser ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sincronizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRawData(!showRawData)}
              >
                {showRawData ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Raw Data
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Dados do Usuário (Supabase)</h4>
                <div className="space-y-1">
                  <p className="text-gray-900"><strong>Nome:</strong> {subscriberDetails.user.name}</p>
                  <p className="text-gray-900"><strong>Email:</strong> {subscriberDetails.user.email}</p>
                  <p className="text-gray-900 text-xs font-mono"><strong>ID:</strong> {subscriberDetails.user.id}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Assinatura Local</h4>
                {subscriberDetails.localSubscription ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(subscriberDetails.localSubscription.status)}
                    </div>
                    <p className="text-gray-900"><strong>Plano:</strong> {subscriberDetails.localSubscription.plan_type}</p>
                    <p className="text-gray-900"><strong>Próx. Vencimento:</strong> {formatDate(subscriberDetails.localSubscription.next_due_date)}</p>
                    <p className="text-gray-900"><strong>Produto Apple:</strong> {subscriberDetails.localSubscription.apple_product_id || 'N/A'}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">Sem assinatura local</p>
                )}
              </div>
            </div>

            {/* RevenueCat Data */}
            {subscriberDetails.revenueCatError ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-700 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  {subscriberDetails.revenueCatError}
                </p>
              </div>
            ) : subscriberDetails.revenueCat ? (
              <>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-purple-800 mb-3 flex items-center gap-2">
                    <Apple className="h-4 w-4" />
                    Dados RevenueCat
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-purple-600">App User ID (Original)</p>
                      <p className="text-purple-900 font-mono text-sm break-all">
                        {subscriberDetails.revenueCat.original_app_user_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-600">Primeiro Acesso</p>
                      <p className="text-purple-900">{formatDate(subscriberDetails.revenueCat.first_seen)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-600">Último Acesso</p>
                      <p className="text-purple-900">{formatDate(subscriberDetails.revenueCat.last_seen)}</p>
                    </div>
                  </div>
                </div>

                {/* Active Subscription */}
                {subscriberDetails.revenueCat.active_subscription && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Assinatura Ativa no RevenueCat
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-green-600">Produto</p>
                        <p className="text-green-900 font-medium">{subscriberDetails.revenueCat.active_subscription.product_id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600">Expira em</p>
                        <p className="text-green-900">{formatDate(subscriberDetails.revenueCat.active_subscription.expires_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600">Compra</p>
                        <p className="text-green-900">{formatDate(subscriberDetails.revenueCat.active_subscription.purchase_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600">Sandbox</p>
                        <p className="text-green-900">{subscriberDetails.revenueCat.active_subscription.is_sandbox ? 'Sim' : 'Não'}</p>
                      </div>
                    </div>
                    {subscriberDetails.revenueCat.active_subscription.unsubscribe_detected_at && (
                      <p className="text-orange-600 text-sm mt-2">
                        ⚠️ Cancelamento detectado em: {formatDate(subscriberDetails.revenueCat.active_subscription.unsubscribe_detected_at)}
                      </p>
                    )}
                  </div>
                )}

                {/* Subscription History */}
                {subscriberDetails.revenueCat.subscription_history.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Histórico de Transações
                    </h4>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left p-2 text-gray-600">Produto</th>
                            <th className="text-left p-2 text-gray-600">Compra</th>
                            <th className="text-left p-2 text-gray-600">Expira</th>
                            <th className="text-left p-2 text-gray-600">Status</th>
                            <th className="text-left p-2 text-gray-600">Sandbox</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subscriberDetails.revenueCat.subscription_history.map((sub, idx) => (
                            <tr key={idx} className="border-t border-gray-200">
                              <td className="p-2 font-mono text-xs text-gray-900">{sub.product_id}</td>
                              <td className="p-2 text-gray-700">{formatDate(sub.purchase_date)}</td>
                              <td className="p-2 text-gray-700">{formatDate(sub.expires_date)}</td>
                              <td className="p-2">
                                {sub.is_active ? (
                                  <Badge className="bg-green-500 text-xs">Ativo</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">Expirado</Badge>
                                )}
                              </td>
                              <td className="p-2 text-gray-700">{sub.is_sandbox ? '🧪' : '💰'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Raw Data */}
                {showRawData && (
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <h4 className="text-white text-sm font-medium mb-2">Raw RevenueCat Response</h4>
                    <pre className="text-green-400 text-xs whitespace-pre-wrap">
                      {JSON.stringify(subscriberDetails.revenueCat, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Apple Subscribers List */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Assinantes Apple ({appleSubscribers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSubscribers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : appleSubscribers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum assinante Apple encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-gray-600">Usuário</th>
                    <th className="text-left p-3 text-gray-600">Produto</th>
                    <th className="text-left p-3 text-gray-600">Plano</th>
                    <th className="text-left p-3 text-gray-600">Status</th>
                    <th className="text-left p-3 text-gray-600">Próx. Vencimento</th>
                    <th className="text-left p-3 text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {appleSubscribers.map((sub) => (
                    <tr key={sub.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <p className="text-gray-900 font-medium">{sub.profile?.name || 'N/A'}</p>
                          <p className="text-gray-500 text-xs">{sub.profile?.email || sub.user_id}</p>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-xs text-gray-700">
                        {sub.apple_product_id || '-'}
                      </td>
                      <td className="p-3 text-gray-700">
                        {sub.plan_type === 'monthly' ? 'Mensal' : sub.plan_type === 'annual' ? 'Anual' : sub.plan_type}
                      </td>
                      <td className="p-3">
                        {getStatusBadge(sub.status)}
                      </td>
                      <td className="p-3 text-gray-700">
                        {formatDate(sub.next_due_date)}
                      </td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewSubscriber(sub.user_id)}
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        >
                          <Search className="h-4 w-4 mr-1" />
                          Ver no RevenueCat
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

      {/* Help Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <h4 className="text-blue-800 font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Sobre IDs Anônimos no RevenueCat
          </h4>
          <p className="text-blue-700 text-sm">
            Se o <code className="bg-blue-100 px-1 rounded">original_app_user_id</code> começa com <code className="bg-blue-100 px-1 rounded">$RCAnonymousID</code>, 
            significa que o usuário fez a compra antes de fazer login no app. O ID anônimo será mostrado até que o usuário 
            faça login, quando o SDK associará automaticamente os IDs.
          </p>
          <p className="text-blue-700 text-sm mt-2">
            Para verificar manualmente, compare o <code className="bg-blue-100 px-1 rounded">user_id</code> do Supabase 
            com o <code className="bg-blue-100 px-1 rounded">original_app_user_id</code> do RevenueCat.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}