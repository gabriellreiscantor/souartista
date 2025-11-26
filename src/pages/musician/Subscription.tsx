import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { MusicianSidebar } from '@/components/MusicianSidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { UserMenu } from '@/components/UserMenu';
import { NotificationBell } from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2, CreditCard, Calendar, DollarSign, Loader2, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Subscription = () => {
  const { userData, user, userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
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
        description: "Sua assinatura foi cancelada com sucesso.",
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
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'Ativa', variant: 'default' },
      pending: { label: 'Pendente', variant: 'secondary' },
      canceled: { label: 'Cancelada', variant: 'destructive' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
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
          <MusicianSidebar />
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
                  onClick={() => navigate('/musician/support')}
                  className="gap-2"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Ajuda</span>
                </Button>
                <NotificationBell />
                <UserMenu userName={userData?.name} userRole={userRole} />
              </div>
            </header>
            <main className="flex-1 p-6 pb-20">
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </main>
          </div>
          <MobileBottomNav role="musician" />
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#fafafa]">
        <MusicianSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Assinatura</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/musician/support')}
                className="gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Ajuda</span>
              </Button>
              <NotificationBell />
              <UserMenu userName={userData?.name} userRole={userRole} />
            </div>
          </header>

          <main className="flex-1 p-6 pb-20 md:pb-6">
            <div className="max-w-4xl mx-auto space-y-6">
            {!subscription ? (
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
                  <Button onClick={() => window.location.href = '/subscribe'}>
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

                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Método de Pagamento</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {getPaymentMethodName(subscription.payment_method)}
                          </p>
                        </div>
                      </div>

                      {subscription.next_due_date && (
                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Próxima Cobrança</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {format(new Date(subscription.next_due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {subscription.status === 'active' && (
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle className="text-gray-900">Cancelar Assinatura</CardTitle>
                      <CardDescription className="text-gray-600">
                        Ao cancelar, você perderá acesso aos recursos premium ao final do período atual. 
                        Seus dados permanecerão salvos e você poderá reativar sua assinatura quando quiser.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="destructive"
                        onClick={() => setShowCancelDialog(true)}
                        disabled={canceling}
                      >
                        {canceling ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cancelando...
                          </>
                        ) : (
                          'Cancelar Assinatura'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
            </div>
          </main>
        </div>
        <MobileBottomNav role="musician" />
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Tem certeza que deseja cancelar?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 space-y-2">
              <p>
                Ao cancelar, você perderá acesso aos recursos premium ao final do período atual.
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
            <AlertDialogAction
              onClick={handleCancelSubscription}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default Subscription;
