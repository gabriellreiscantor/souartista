import { useEffect, useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
import { UserMenu } from '@/components/UserMenu';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { NotificationBell } from '@/components/NotificationBell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Calendar, DollarSign, AlertCircle, HelpCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useNativePlatform } from '@/hooks/useNativePlatform';
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

const ArtistSubscription = () => {
  const { userData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isIOS, isNative } = useNativePlatform();
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    fetchSubscription();
  }, [userData]);

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
      case 'canceled':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getPlanName = (planType: string) => {
    return planType === 'monthly' ? 'Mensal' : 'Anual';
  };

  const getPaymentMethodName = (method: string) => {
    return method === 'CREDIT_CARD' ? 'Cartão de Crédito' : 'PIX';
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/artist/support')}
                  className="gap-2"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Ajuda</span>
                </Button>
                <NotificationBell />
                <UserMenu userName={userData?.name} userRole="artist" />
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/artist/support')}
                className="gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Ajuda</span>
              </Button>
              <NotificationBell />
              <UserMenu userName={userData?.name} userRole="artist" />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* iOS Native App - Show App Store message */}
              {isIOS && isNative ? (
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Gerenciar Assinatura</CardTitle>
                    <CardDescription className="text-gray-600">
                      As assinaturas feitas pelo iPhone são gerenciadas pela App Store.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Para visualizar, alterar ou cancelar sua assinatura, você precisa acessar as configurações de assinaturas do iOS.
                    </p>
                    <Button 
                      onClick={() => window.open('https://apps.apple.com/account/subscriptions', '_blank')}
                      className="w-full"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir Configurações da App Store
                    </Button>
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
                                {subscription.status === 'canceled' ? 'Acesso até' : 'Próxima Cobrança'}
                              </p>
                              <p className="text-lg font-semibold text-gray-900">
                                {formatDate(subscription.next_due_date)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle className="text-gray-900">Cancelar Assinatura</CardTitle>
                      <CardDescription className="text-gray-600">
                        {subscription.status === 'canceled' 
                          ? `Sua assinatura foi cancelada. Você pode continuar usando até ${formatDate(subscription.next_due_date)}.`
                          : 'Seus dados permanecerão salvos e você poderá reativar sua assinatura quando quiser.'
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {subscription.status === 'canceled' ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-sm text-orange-800">
                              <strong>Assinatura Cancelada</strong><br />
                              Você manterá acesso premium até <strong>{formatDate(subscription.next_due_date)}</strong>.
                              Após essa data, você perderá acesso às funcionalidades premium.
                            </p>
                          </div>
                          <Button 
                            onClick={() => navigate('/subscribe')} 
                            className="w-full"
                          >
                            Reativar Assinatura
                          </Button>
                        </div>
                      ) : (
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
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </main>
        </div>
        <MobileBottomNav role="artist" />
      </div>
    </SidebarProvider>
  );
};

export default ArtistSubscription;
