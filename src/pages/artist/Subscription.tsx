import { useEffect, useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
import { UserMenu } from '@/components/UserMenu';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { NotificationBell } from '@/components/NotificationBell';
import { PaymentHistory } from '@/components/PaymentHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Calendar, DollarSign, AlertCircle, HelpCircle, ExternalLink, QrCode, Copy, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useNativePlatform } from '@/hooks/useNativePlatform';
import { useAppleIAP } from '@/hooks/useAppleIAP';
import { useLastSeen } from '@/hooks/useLastSeen';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Lista de contas de teste da Apple
const TEST_EMAILS = [
  'tester@souartista.com',
  'ester@souartista.com',
  'apple@souartista.com',
  'test@souartista.com'
];

const isTestAccount = (email?: string): boolean => {
  if (!email) return false;
  return TEST_EMAILS.some(testEmail => 
    email.toLowerCase() === testEmail.toLowerCase()
  );
};

const ArtistSubscription = () => {
  const { userData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isIOS, isNative } = useNativePlatform();
  const { restorePurchases, loading: iapLoading } = useAppleIAP();
  useLastSeen(); // Atualizar last_seen_at
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [showPixDialog, setShowPixDialog] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  
  // Detectar se é conta de teste
  const isDemo = isTestAccount(userData?.email);

  useEffect(() => {
    // Para contas de teste, não precisa carregar assinatura real
    if (isDemo) {
      setLoading(false);
      return;
    }
    fetchSubscription();
  }, [userData, isDemo]);

  useEffect(() => {
    if (subscription?.payment_method === 'PIX' && subscription?.status === 'active') {
      fetchPendingPayment();
    }
  }, [subscription]);

  const fetchSubscription = async () => {
    if (!userData?.id) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.asaas_subscription_id) return;

    setCanceling(true);
    try {
      const { error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId: subscription.asaas_subscription_id }
      });

      if (error) throw error;

      toast({
        title: "Assinatura cancelada",
        description: "Sua assinatura foi cancelada com sucesso. Você poderá usar até a data de vencimento.",
      });

      await fetchSubscription();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar a assinatura. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setCanceling(false);
      setShowCancelDialog(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ativa</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendente</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    // Extrair apenas a parte da data (YYYY-MM-DD) para evitar problemas de timezone
    const datePart = dateString.split('T')[0].split(' ')[0];
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`;
  };

  const getPlanName = (planType: string) => {
    return planType === 'monthly' ? 'Mensal' : 'Anual';
  };

  const getPaymentMethodName = (method: string) => {
    return method === 'CREDIT_CARD' ? 'Cartão de Crédito' : 'PIX';
  };

  const getDaysRemaining = (dateString: string) => {
    if (!dateString) return 0;
    const today = new Date();
    const targetDate = new Date(dateString);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const fetchPendingPayment = async () => {
    setLoadingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-pending-payment');
      
      if (error) throw error;
      
      setPendingPayment(data?.pendingPayment || null);
    } catch (error) {
      console.error('Error fetching pending payment:', error);
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleCheckPayment = async () => {
    setCheckingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { paymentId: pendingPayment.id }
      });

      if (error) throw error;

      if (data.status === 'CONFIRMED' || data.status === 'RECEIVED') {
        toast({
          title: "Pagamento confirmado!",
          description: "Seu pagamento foi confirmado com sucesso.",
        });
        setShowPixDialog(false);
        setPendingPayment(null);
        await fetchSubscription();
      } else {
        toast({
          title: "Pagamento ainda não confirmado",
          description: "Aguarde alguns instantes e tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking payment:', error);
      toast({
        title: "Erro ao verificar pagamento",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setCheckingPayment(false);
    }
  };

  const copyPixCode = () => {
    if (pendingPayment?.qrCode) {
      navigator.clipboard.writeText(pendingPayment.qrCode);
      toast({
        title: "Código copiado!",
        description: "O código PIX foi copiado para a área de transferência.",
      });
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-[#fafafa]">
          <ArtistSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Assinatura</h1>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <UserMenu userName={userData?.name} userRole="artist" photoUrl={userData?.photo_url} />
            </div>
            </header>
            <main className="flex-1 p-6 pb-20">
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </main>
          </div>
          <MobileBottomNav role="artist" />
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#fafafa]">
        <ArtistSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Assinatura</h1>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <UserMenu userName={userData?.name} userRole="artist" photoUrl={userData?.photo_url} />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Conta de Teste/Demo - Acesso total */}
              {isDemo ? (
                <Card className="bg-white border-green-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <CheckCircle2 className="h-5 w-5" />
                      Conta de Demonstração
                    </CardTitle>
                    <CardDescription className="text-green-700">
                      Esta é uma conta de teste com acesso total à plataforma.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-900">
                        <strong>Acesso Ilimitado!</strong><br />
                        Você tem acesso a todas as funcionalidades do app para fins de teste e avaliação.
                        Explore livremente os recursos disponíveis.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Plano</p>
                          <p className="font-medium">Premium Anual</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Status</p>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ativa</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : isIOS && isNative ? (
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Gerenciar Assinatura</CardTitle>
                    <CardDescription className="text-gray-600">
                      As assinaturas feitas pelo iPhone são gerenciadas pela App Store.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Para visualizar, alterar ou cancelar sua assinatura, você precisa acessar as configurações de assinaturas do iOS.
                    </p>
                    <div className="space-y-3">
                      <Button 
                        onClick={() => window.open('https://apps.apple.com/account/subscriptions', '_blank')}
                        className="w-full"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Abrir Configurações da App Store
                      </Button>
                      <Button 
                        onClick={restorePurchases}
                        variant="outline"
                        className="w-full"
                        disabled={iapLoading}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${iapLoading ? 'animate-spin' : ''}`} />
                        {iapLoading ? 'Restaurando...' : 'Restaurar Compras'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : !subscription ? (
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <AlertCircle className="h-5 w-5 text-gray-500" />
                      Nenhuma assinatura ativa
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Você não possui uma assinatura ativa no momento.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => navigate('/subscribe')}>
                      Assinar agora
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Warning Card - 7 days before due date (PIX only, no pending payment yet) */}
                  {subscription.payment_method === 'PIX' && 
                   !pendingPayment && 
                   subscription.status === 'active' && 
                   subscription.next_due_date && 
                   getDaysRemaining(subscription.next_due_date) <= 7 && 
                   getDaysRemaining(subscription.next_due_date) > 0 && (
                    <Card className="border-blue-500 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-800">
                          <Clock className="h-5 w-5" />
                          Pagamento se aproxima
                        </CardTitle>
                        <CardDescription className="text-blue-700">
                          Seu próximo pagamento vence em {getDaysRemaining(subscription.next_due_date)} dias
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="p-3 bg-blue-100 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-900">
                            <strong>Fique atento!</strong><br />
                            Seu pagamento PIX vence em <strong>{formatDate(subscription.next_due_date)}</strong>.
                            O QR Code para pagamento estará disponível em breve.
                          </p>
                        </div>
                        <Button 
                          onClick={fetchPendingPayment}
                          disabled={loadingPayment}
                          className="w-full"
                        >
                          {loadingPayment ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Verificando...
                            </>
                          ) : (
                            'Verificar Pagamento'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                   {/* Pending PIX Payment Card */}
                  {subscription.payment_method === 'PIX' && pendingPayment && (
                    <Card className={`${pendingPayment.status === 'OVERDUE' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}`}>
                      <CardHeader>
                        <CardTitle className={`flex items-center gap-2 ${pendingPayment.status === 'OVERDUE' ? 'text-red-800' : 'text-yellow-800'}`}>
                          <AlertCircle className="h-5 w-5" />
                          {pendingPayment.status === 'OVERDUE' ? 'Pagamento Atrasado' : 'Pagamento Pendente'}
                        </CardTitle>
                        <CardDescription className={pendingPayment.status === 'OVERDUE' ? 'text-red-700' : 'text-yellow-700'}>
                          {pendingPayment.status === 'OVERDUE' 
                            ? 'Seu pagamento está atrasado! Pague agora para não perder acesso.'
                            : `Seu próximo pagamento vence em ${getDaysRemaining(pendingPayment.dueDate)} dias`
                          }
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold ${pendingPayment.status === 'OVERDUE' ? 'text-red-900' : 'text-yellow-900'}`}>
                            Valor: R$ {pendingPayment.value.toFixed(2).replace('.', ',')}
                          </span>
                          <span className={`text-sm ${pendingPayment.status === 'OVERDUE' ? 'text-red-700' : 'text-yellow-700'}`}>
                            Vencimento: {formatDate(pendingPayment.dueDate)}
                          </span>
                        </div>
                        <Button 
                          onClick={() => setShowPixDialog(true)}
                          className={`w-full ${pendingPayment.status === 'OVERDUE' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          {pendingPayment.status === 'OVERDUE' ? 'Pagar Agora' : 'Pagar com PIX'}
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Credit Card Trial Period Info */}
                  {subscription.payment_method === 'CREDIT_CARD' && 
                   (subscription.status === 'pending' || subscription.status === 'active') && 
                   subscription.next_due_date &&
                   getDaysRemaining(subscription.next_due_date) <= 7 &&
                   getDaysRemaining(subscription.next_due_date) > 0 && (
                    <Card className="border-green-500 bg-green-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-800">
                          <CheckCircle2 className="h-5 w-5" />
                          Período de Teste Ativo
                        </CardTitle>
                        <CardDescription className="text-green-700">
                          Você está no período de teste de 7 dias
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="p-3 bg-green-100 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-900">
                            <strong>Aproveite todos os recursos!</strong><br />
                            Sua primeira cobrança será em <strong>{getDaysRemaining(subscription.next_due_date)} dias</strong> ({formatDate(subscription.next_due_date)}).
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-800">
                          <AlertCircle className="h-4 w-4" />
                          <span>Cancele a qualquer momento sem custos durante o período de teste.</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="bg-white">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-gray-900">Status da Assinatura</CardTitle>
                        {getStatusBadge(subscription.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <CreditCard className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Plano</p>
                            <p className="text-lg font-semibold text-gray-900">Plano {getPlanName(subscription.plan_type)}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Valor</p>
                            <p className="text-lg font-semibold text-gray-900">
                              R$ {subscription.amount.toFixed(2).replace('.', ',')}
                            </p>
                          </div>
                        </div>

                        {subscription.payment_method && (
                          <div className="flex items-start gap-3">
                            <CreditCard className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-600">Método de Pagamento</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {getPaymentMethodName(subscription.payment_method)}
                              </p>
                            </div>
                          </div>
                        )}

                        {subscription.next_due_date && (
                          <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-600">
                                {subscription.status === 'cancelled' ? 'Acesso até' : 'Próxima Cobrança'}
                              </p>
                              <p className="text-lg font-semibold text-gray-900">
                                {subscription.status === 'cancelled' 
                                  ? `Faltam ${getDaysRemaining(subscription.next_due_date)} dias (${formatDate(subscription.next_due_date)})`
                                  : `Em ${getDaysRemaining(subscription.next_due_date)} dias (${formatDate(subscription.next_due_date)})`
                                }
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cancelled Subscription Info Card */}
                  {subscription.status === 'cancelled' && (
                    <Card className="border-red-500 bg-red-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-800">
                          <AlertCircle className="h-5 w-5" />
                          Assinatura Cancelada
                        </CardTitle>
                        <CardDescription className="text-red-700">
                          Você poderá usar o Sou Artista até o fim do período pago
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 bg-red-100 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-900">
                            <strong>Acesso garantido até:</strong><br />
                            <span className="text-lg font-bold">{formatDate(subscription.next_due_date)}</span><br />
                            <span className="text-base">Faltam <strong>{getDaysRemaining(subscription.next_due_date)} dias</strong> de acesso</span>
                          </p>
                        </div>
                        <div className="p-3 bg-white border border-red-200 rounded-lg">
                          <p className="text-sm text-gray-700">
                            💡 <strong>Quer assinar novamente?</strong><br />
                            Aguarde o término do período atual e você poderá criar uma nova assinatura.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Cancel Subscription Card - Only show if not cancelled */}
                  {subscription.status !== 'cancelled' && (
                    <Card className="bg-white">
                      <CardHeader>
                        <CardTitle className="text-gray-900">Cancelar Assinatura</CardTitle>
                        <CardDescription className="text-gray-600">
                          Seus dados permanecerão salvos e você poderá reativar sua assinatura quando quiser.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full">
                              Cancelar Assinatura
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-gray-900">Tem certeza que deseja cancelar?</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-600 space-y-2">
                                <p>
                                  Ao cancelar, você manterá acesso aos recursos premium até {formatDate(subscription.next_due_date)}.
                                </p>
                                <p className="font-medium text-gray-700">
                                  ✓ Seus dados permanecerão salvos e seguros
                                </p>
                                <p className="font-medium text-gray-700">
                                  ✓ Você pode reativar sua assinatura a qualquer momento
                                </p>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Voltar</AlertDialogCancel>
                              <Button
                                variant="destructive"
                                onClick={handleCancelSubscription}
                                disabled={canceling}
                              >
                                {canceling ? 'Cancelando...' : 'Sim, cancelar'}
                              </Button>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardContent>
                    </Card>
                  )}

                  {/* Histórico de Pagamentos */}
                  {subscription && (
                    <PaymentHistory 
                      subscription_id={subscription.id}
                      paymentMethod={subscription.payment_method}
                      subscriptionStatus={subscription.status}
                    />
                  )}

                  {/* Card de Ajuda */}
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900">
                        <HelpCircle className="h-5 w-5 text-primary" />
                        Precisa de ajuda?
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Nossa equipe está pronta para te ajudar com qualquer dúvida sobre assinatura.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => navigate('/artist/support')}
                        variant="outline"
                        className="w-full"
                      >
                        Falar com Suporte
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </main>
        </div>
        <MobileBottomNav role="artist" />
      </div>

      {/* PIX Payment Dialog */}
      <Dialog open={showPixDialog} onOpenChange={setShowPixDialog}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Pagar com PIX</DialogTitle>
            <DialogDescription className="text-gray-600">
              Escaneie o QR Code ou copie o código para pagar
            </DialogDescription>
          </DialogHeader>
          
          {pendingPayment && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                <img 
                  src={`data:image/png;base64,${pendingPayment.encodedImage}`} 
                  alt="QR Code PIX" 
                  className="w-64 h-64"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Código PIX (Copia e Cola)</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pendingPayment.qrCode}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50"
                  />
                  <Button onClick={copyPixCode} variant="outline" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Valor:</strong> R$ {pendingPayment.value.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Vencimento:</strong> {formatDate(pendingPayment.dueDate)}
                </p>
              </div>

              <Button 
                onClick={handleCheckPayment} 
                disabled={checkingPayment}
                className="w-full"
              >
                {checkingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Já paguei, verificar'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default ArtistSubscription;
