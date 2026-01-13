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
  Clock,
  ChevronDown,
  ChevronUp,
  Smartphone,
  QrCode
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AsaasSubscriber {
  id: string;
  user_id: string;
  status: string;
  payment_platform: string;
  payment_method: string | null;
  asaas_subscription_id: string | null;
  asaas_customer_id: string | null;
  next_due_date: string | null;
  amount: number;
  plan_type: string;
  created_at: string;
  profiles: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface AsaasData {
  customer: any;
  subscription: any;
  subscriptions?: any[];
  payments: any[];
}

interface SubscriberDetails {
  success: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
  localSubscription: any;
  asaas: AsaasData | null;
}

interface AsaasDirectResult {
  success: boolean;
  found: boolean;
  searchedId: string;
  searchType: 'subscription' | 'customer' | null;
  localUser: { id: string; name: string; email: string } | null;
  localSubscription: any;
  asaas: AsaasData | null;
  error?: string;
  message?: string;
}

export function AsaasTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [subscriberDetails, setSubscriberDetails] = useState<SubscriberDetails | null>(null);
  const [notFoundMessage, setNotFoundMessage] = useState<string | null>(null);
  
  // Asaas ID search
  const [asaasIdQuery, setAsaasIdQuery] = useState('');
  const [searchingAsaasId, setSearchingAsaasId] = useState(false);
  const [asaasDirectResult, setAsaasDirectResult] = useState<AsaasDirectResult | null>(null);
  
  const [asaasSubscribers, setAsaasSubscribers] = useState<AsaasSubscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);
  
  const [showRawData, setShowRawData] = useState(false);
  const [syncingUser, setSyncingUser] = useState(false);

  useEffect(() => {
    fetchAsaasSubscribers();
  }, []);

  const fetchAsaasSubscribers = async () => {
    setLoadingSubscribers(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-asaas-subscriber', {
        body: { action: 'list-asaas-subscribers' }
      });

      if (error) throw error;
      if (data?.success) {
        setAsaasSubscribers(data.subscribers || []);
      }
    } catch (error: any) {
      console.error('Error fetching asaas subscribers:', error);
      toast.error('Erro ao buscar assinantes Asaas');
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
    setAsaasDirectResult(null);

    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchQuery.trim());
      
      const { data, error } = await supabase.functions.invoke('get-asaas-subscriber', {
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

  const handleSearchAsaasId = async () => {
    if (!asaasIdQuery.trim()) {
      toast.error('Digite um ID do Asaas');
      return;
    }

    setSearchingAsaasId(true);
    setAsaasDirectResult(null);
    setSubscriberDetails(null);
    setNotFoundMessage(null);

    try {
      const { data, error } = await supabase.functions.invoke('get-asaas-subscriber', {
        body: { 
          action: 'search-by-asaas-id',
          asaasId: asaasIdQuery.trim() 
        }
      });

      if (error) throw error;
      
      if (data?.success && data?.found) {
        setAsaasDirectResult(data);
        toast.success('Dados encontrados no Asaas!');
      } else {
        toast.error(data?.error || 'ID não encontrado no Asaas');
      }
    } catch (error: any) {
      console.error('Error searching Asaas ID:', error);
      toast.error(error.message || 'Erro ao buscar no Asaas');
    } finally {
      setSearchingAsaasId(false);
    }
  };

  const handleViewSubscriber = async (userId: string) => {
    setSearchQuery(userId);
    setSearching(true);
    setSubscriberDetails(null);

    try {
      const { data, error } = await supabase.functions.invoke('get-asaas-subscriber', {
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
      const { data, error } = await supabase.functions.invoke('sync-asaas-payments');

      if (error) throw error;
      toast.success('Sincronização iniciada!');
      
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

  const formatDateShort = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'ATIVO':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Ativo</Badge>;
      case 'CANCELLED':
      case 'CANCELED':
      case 'CANCELADO':
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" /> Cancelado</Badge>;
      case 'EXPIRED':
      case 'EXPIRADO':
        return <Badge className="bg-gray-500"><Clock className="h-3 w-3 mr-1" /> Expirado</Badge>;
      case 'PENDING':
      case 'PENDENTE':
        return <Badge className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" /> Pendente</Badge>;
      case 'OVERDUE':
      case 'VENCIDO':
        return <Badge className="bg-orange-500"><AlertTriangle className="h-3 w-3 mr-1" /> Vencido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'RECEIVED':
        return <Badge className="bg-green-500 text-xs">Confirmado</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-500 text-xs">Pendente</Badge>;
      case 'OVERDUE':
        return <Badge className="bg-orange-500 text-xs">Vencido</Badge>;
      case 'REFUNDED':
        return <Badge className="bg-purple-500 text-xs">Reembolsado</Badge>;
      case 'RECEIVED_IN_CASH':
        return <Badge className="bg-green-600 text-xs">Recebido</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const getPaymentMethodBadge = (method: string | null) => {
    switch (method) {
      case 'PIX':
        return <Badge className="bg-teal-500"><QrCode className="h-3 w-3 mr-1" /> PIX</Badge>;
      case 'CREDIT_CARD':
        return <Badge className="bg-blue-500"><CreditCard className="h-3 w-3 mr-1" /> Cartão</Badge>;
      case 'BOLETO':
        return <Badge className="bg-gray-600">Boleto</Badge>;
      default:
        return method ? <Badge variant="outline">{method}</Badge> : null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Smartphone className="h-6 w-6" />
            Asaas - Assinaturas Web/Android
          </h2>
          <p className="text-gray-600">Consulte e gerencie dados de assinantes via Asaas (PIX e Cartão)</p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchAsaasSubscribers}
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

      {/* Search by Asaas ID (direct API) */}
      <Card className="bg-teal-50 border-teal-200">
        <CardHeader>
          <CardTitle className="text-teal-900 text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Buscar por ID do Asaas (direto na API)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-teal-700 text-sm">
            Use esta opção para buscar diretamente na API do Asaas usando sub_xxx (assinatura) ou cus_xxx (cliente).
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="sub_xxx ou cus_xxx"
              value={asaasIdQuery}
              onChange={(e) => setAsaasIdQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchAsaasId()}
              className="bg-white border-teal-200 text-gray-900"
            />
            <Button 
              onClick={handleSearchAsaasId} 
              disabled={searchingAsaasId}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {searchingAsaasId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="h-4 w-4 mr-1" />
                  Buscar Asaas
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Asaas Direct Result */}
      {asaasDirectResult && (
        <Card className="bg-white border-teal-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-teal-600" />
              Resultado do Asaas
              <Badge className="bg-teal-500 ml-2">
                {asaasDirectResult.searchType === 'subscription' ? 'Assinatura' : 'Cliente'}
              </Badge>
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
            <div className="bg-teal-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-teal-800 mb-2">ID Pesquisado</h4>
              <p className="text-teal-900 font-mono text-sm break-all">{asaasDirectResult.searchedId}</p>
            </div>

            {/* Local User (if found) */}
            {asaasDirectResult.localUser ? (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Usuário Vinculado no Sistema
                </h4>
                <div className="space-y-1">
                  <p className="text-green-900"><strong>Nome:</strong> {asaasDirectResult.localUser.name}</p>
                  <p className="text-green-900"><strong>Email:</strong> {asaasDirectResult.localUser.email}</p>
                  <p className="text-green-900 text-xs font-mono"><strong>ID:</strong> {asaasDirectResult.localUser.id}</p>
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <h4 className="text-sm font-medium text-orange-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Usuário Não Vinculado
                </h4>
                <p className="text-orange-700 text-sm">
                  Este ID do Asaas não está associado a nenhum usuário no sistema local.
                </p>
              </div>
            )}

            {/* Asaas Customer Data */}
            {asaasDirectResult.asaas?.customer && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Dados do Cliente Asaas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Customer ID</p>
                    <p className="text-gray-900 font-mono text-sm">{asaasDirectResult.asaas.customer.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Nome</p>
                    <p className="text-gray-900">{asaasDirectResult.asaas.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-gray-900">{asaasDirectResult.asaas.customer.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">CPF/CNPJ</p>
                    <p className="text-gray-900">{asaasDirectResult.asaas.customer.cpfCnpj || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Asaas Subscription Data */}
            {asaasDirectResult.asaas?.subscription && (
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-teal-800 mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Assinatura Asaas
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-teal-600">Subscription ID</p>
                    <p className="text-teal-900 font-mono text-sm">{asaasDirectResult.asaas.subscription.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-teal-600">Status</p>
                    <div className="mt-1">{getStatusBadge(asaasDirectResult.asaas.subscription.status)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-teal-600">Valor</p>
                    <p className="text-teal-900 font-medium">{formatCurrency(asaasDirectResult.asaas.subscription.value)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-teal-600">Método</p>
                    <div className="mt-1">{getPaymentMethodBadge(asaasDirectResult.asaas.subscription.billingType)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-teal-600">Ciclo</p>
                    <p className="text-teal-900">{asaasDirectResult.asaas.subscription.cycle === 'MONTHLY' ? 'Mensal' : asaasDirectResult.asaas.subscription.cycle === 'YEARLY' ? 'Anual' : asaasDirectResult.asaas.subscription.cycle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-teal-600">Próximo Vencimento</p>
                    <p className="text-teal-900">{formatDateShort(asaasDirectResult.asaas.subscription.nextDueDate)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payments History */}
            {asaasDirectResult.asaas?.payments && asaasDirectResult.asaas.payments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Histórico de Pagamentos
                </h4>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-2 text-gray-600">Data</th>
                        <th className="text-left p-2 text-gray-600">Valor</th>
                        <th className="text-left p-2 text-gray-600">Status</th>
                        <th className="text-left p-2 text-gray-600">Método</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asaasDirectResult.asaas.payments.map((payment: any, idx: number) => (
                        <tr key={payment.id || idx} className="border-t border-gray-200">
                          <td className="p-2 text-gray-900">{formatDateShort(payment.paymentDate || payment.dueDate)}</td>
                          <td className="p-2 text-gray-900">{formatCurrency(payment.value)}</td>
                          <td className="p-2">{getPaymentStatusBadge(payment.status)}</td>
                          <td className="p-2">{getPaymentMethodBadge(payment.billingType)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Raw Data */}
            {showRawData && (
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-auto max-h-96">
                <pre className="text-xs">{JSON.stringify(asaasDirectResult.asaas, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subscriber Details (from email/name search) */}
      {subscriberDetails && (
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              Detalhes do Assinante
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncUser}
                disabled={syncingUser}
              >
                {syncingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
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
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-800 mb-3">Dados do Usuário</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Nome</p>
                  <p className="text-gray-900">{subscriberDetails.user.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-gray-900">{subscriberDetails.user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">User ID</p>
                  <p className="text-gray-900 font-mono text-xs">{subscriberDetails.user.id}</p>
                </div>
              </div>
            </div>

            {/* Local Subscription */}
            {subscriberDetails.localSubscription && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-3">Assinatura Local</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-blue-600">Status</p>
                    <div className="mt-1">{getStatusBadge(subscriberDetails.localSubscription.status)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">Plano</p>
                    <p className="text-blue-900">{subscriberDetails.localSubscription.plan_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">Valor</p>
                    <p className="text-blue-900">{formatCurrency(subscriberDetails.localSubscription.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">Método</p>
                    <div className="mt-1">{getPaymentMethodBadge(subscriberDetails.localSubscription.payment_method)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">Próximo Vencimento</p>
                    <p className="text-blue-900">{formatDateShort(subscriberDetails.localSubscription.next_due_date)}</p>
                  </div>
                  {subscriberDetails.localSubscription.asaas_subscription_id && (
                    <div>
                      <p className="text-xs text-blue-600">Asaas Subscription ID</p>
                      <p className="text-blue-900 font-mono text-xs">{subscriberDetails.localSubscription.asaas_subscription_id}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Asaas Data */}
            {subscriberDetails.asaas && (
              <>
                {subscriberDetails.asaas.customer && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-800 mb-3">Cliente Asaas</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Customer ID</p>
                        <p className="text-gray-900 font-mono text-sm">{subscriberDetails.asaas.customer.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-gray-900">{subscriberDetails.asaas.customer.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">CPF/CNPJ</p>
                        <p className="text-gray-900">{subscriberDetails.asaas.customer.cpfCnpj || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {subscriberDetails.asaas.subscription && (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-teal-800 mb-3">Assinatura Asaas</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-teal-600">Status</p>
                        <div className="mt-1">{getStatusBadge(subscriberDetails.asaas.subscription.status)}</div>
                      </div>
                      <div>
                        <p className="text-xs text-teal-600">Valor</p>
                        <p className="text-teal-900">{formatCurrency(subscriberDetails.asaas.subscription.value)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-teal-600">Próximo Vencimento</p>
                        <p className="text-teal-900">{formatDateShort(subscriberDetails.asaas.subscription.nextDueDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-teal-600">Método</p>
                        <div className="mt-1">{getPaymentMethodBadge(subscriberDetails.asaas.subscription.billingType)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {subscriberDetails.asaas.payments && subscriberDetails.asaas.payments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Histórico de Pagamentos</h4>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left p-2 text-gray-600">Data</th>
                            <th className="text-left p-2 text-gray-600">Valor</th>
                            <th className="text-left p-2 text-gray-600">Status</th>
                            <th className="text-left p-2 text-gray-600">Método</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subscriberDetails.asaas.payments.map((payment: any, idx: number) => (
                            <tr key={payment.id || idx} className="border-t border-gray-200">
                              <td className="p-2 text-gray-900">{formatDateShort(payment.paymentDate || payment.dueDate)}</td>
                              <td className="p-2 text-gray-900">{formatCurrency(payment.value)}</td>
                              <td className="p-2">{getPaymentStatusBadge(payment.status)}</td>
                              <td className="p-2">{getPaymentMethodBadge(payment.billingType)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* No Asaas Data */}
            {!subscriberDetails.asaas && subscriberDetails.localSubscription && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-700 text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Não foi possível buscar dados do Asaas. O usuário pode não ter assinatura Asaas configurada.
                </p>
              </div>
            )}

            {/* Raw Data */}
            {showRawData && (
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-auto max-h-96">
                <pre className="text-xs">{JSON.stringify(subscriberDetails, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subscribers List */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Lista de Assinantes Asaas ({asaasSubscribers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSubscribers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : asaasSubscribers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum assinante Asaas encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-3 text-gray-600">Usuário</th>
                    <th className="text-left p-3 text-gray-600">Método</th>
                    <th className="text-left p-3 text-gray-600">Status</th>
                    <th className="text-left p-3 text-gray-600">Valor</th>
                    <th className="text-left p-3 text-gray-600">Vencimento</th>
                    <th className="text-left p-3 text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {asaasSubscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <p className="text-gray-900 font-medium">{subscriber.profiles?.name || 'N/A'}</p>
                          <p className="text-gray-500 text-xs">{subscriber.profiles?.email || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        {getPaymentMethodBadge(subscriber.payment_method)}
                      </td>
                      <td className="p-3">
                        {getStatusBadge(subscriber.status)}
                      </td>
                      <td className="p-3 text-gray-900">
                        {formatCurrency(subscriber.amount)}
                      </td>
                      <td className="p-3 text-gray-900">
                        {formatDateShort(subscriber.next_due_date)}
                      </td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewSubscriber(subscriber.user_id)}
                        >
                          <Search className="h-4 w-4" />
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
    </div>
  );
}
