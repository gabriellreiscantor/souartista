import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Check, Shield, Mail, Building2, Copy, QrCode } from 'lucide-react';
import logo from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreditCardForm, CreditCardData } from '@/components/CreditCardForm';

const Subscribe = () => {
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showPixDialog, setShowPixDialog] = useState(false);
  const [pixData, setPixData] = useState<{ code: string; image: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [showCreditCardDialog, setShowCreditCardDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingPlanType, setPendingPlanType] = useState<'monthly' | 'annual' | null>(null);
  const { updateUserData, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('status_plano')
        .eq('id', user.id)
        .single();

      if (profile?.status_plano === 'ativo') {
        const userRole = localStorage.getItem('userRole');
        
        if (userRole === 'artist') {
          navigate('/artist/dashboard', { replace: true });
        } else if (userRole === 'musician') {
          navigate('/musician/dashboard', { replace: true });
        }
      }
    };

    checkUserStatus();
  }, [user, navigate]);

  const handleSubscribe = async (plan: 'monthly' | 'annual') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Você precisa estar logado para assinar um plano.');
        return;
      }

      // Se for cartão de crédito, abrir o modal do formulário
      if (paymentMethod === 'CREDIT_CARD') {
        setPendingPlanType(plan);
        setShowCreditCardDialog(true);
        return;
      }

      // Se for PIX, processar diretamente
      toast.loading('Gerando QR Code PIX...');

      const { data, error } = await supabase.functions.invoke('create-asaas-subscription', {
        body: { planType: plan, paymentMethod },
      });

      toast.dismiss();

      if (error) {
        console.error('Error creating subscription:', error);
        throw error;
      }

      if (data.success && data.billingType === 'PIX' && data.pixQrCode) {
        setPixData({
          code: data.pixQrCode,
          image: data.pixQrCodeImage,
        });
        setShowPixDialog(true);
        toast.success('QR Code PIX gerado!');
      } else {
        throw new Error('Failed to create subscription');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.dismiss();
      toast.error('Erro ao criar assinatura. Tente novamente.');
    }
  };

  const handleCreditCardSubmit = async (creditCardData: CreditCardData) => {
    if (!pendingPlanType) return;

    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Você precisa estar logado.');
        return;
      }

      toast.loading('Processando pagamento...');

      const { data, error } = await supabase.functions.invoke('create-asaas-subscription', {
        body: { 
          planType: pendingPlanType, 
          paymentMethod: 'CREDIT_CARD',
          creditCardData 
        }
      });

      toast.dismiss();

      if (error) {
        console.error('Error processing payment:', error);
        throw error;
      }

      if (data.success) {
        setShowCreditCardDialog(false);
        toast.success('Pagamento processado com sucesso!');
        
        // Redirecionar para dashboard após 2 segundos
        setTimeout(() => {
          const userRole = localStorage.getItem('userRole');
          if (userRole === 'artist') {
            navigate('/artist/dashboard');
          } else if (userRole === 'musician') {
            navigate('/musician/dashboard');
          } else {
            navigate('/app');
          }
        }, 2000);
      } else {
        throw new Error('Payment processing failed');
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast.dismiss();
      toast.error(error.message || 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyPixCode = () => {
    if (pixData?.code) {
      navigator.clipboard.writeText(pixData.code);
      toast.success('Código PIX copiado!');
    }
  };

  const plans = {
    monthly: {
      price: 'R$ 5,00',
      period: '/mês',
      total: '(Preço de teste - mínimo Asaas)',
      features: [
        'Gerenciamento de shows ilimitado',
        'Controle financeiro completo',
        'Gestão de equipe e músicos',
        'Relatórios detalhados',
        'Suporte prioritário via tickets',
      ]
    },
    annual: {
      price: 'R$ 10,00',
      period: '/ano',
      total: 'Cobrado R$ 10,00 anualmente (Preço de teste)',
      savings: '',
      features: [
        'Gerenciamento de shows ilimitado',
        'Controle financeiro completo',
        'Gestão de equipe e músicos',
        'Relatórios detalhados',
        'Suporte prioritário via tickets',
        'Pague uma vez, use o ano todo',
        'Suporte premium via WhatsApp',
      ]
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-primary/5 to-primary/10">
      <div className="w-full max-w-6xl">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <img src={logo} alt="Sou Artista" className="h-12 md:h-16 w-auto" />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-heading font-bold mb-3">
            Faça sua assinatura
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Libere todo o potencial da plataforma e organize sua carreira musical.
          </p>
        </div>

        {/* Trial Info Box */}
        <Card className="glass-card border-primary/20 bg-primary/5 p-6 mb-8 max-w-3xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-bold mb-2">
                Teste por 7 dias, sem compromisso!
              </h3>
              <p className="text-sm text-muted-foreground">
                Você não será cobrado hoje. É necessário um cartão de crédito para iniciar, mas você pode cancelar a qualquer momento durante o período de teste sem custos.
              </p>
            </div>
          </div>
        </Card>

        {/* Billing Toggle */}
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="inline-flex items-center gap-3 bg-muted/50 rounded-full p-1.5">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2.5 rounded-full transition-all font-medium ${
                billingCycle === 'monthly'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2.5 rounded-full transition-all font-medium relative ${
                billingCycle === 'annual'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Anual
              <span className="absolute -top-2 -right-2 text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold shadow-md">
                -33%
              </span>
            </button>
          </div>

          {/* Payment Method Selector */}
          <div className="w-full max-w-md">
            <label className="block text-sm font-medium text-foreground mb-3 text-center">
              Método de Pagamento
            </label>
            <div className="inline-flex items-center gap-3 bg-muted/50 rounded-full p-1.5 w-full">
              <button
                onClick={() => setPaymentMethod('PIX')}
                className={`flex-1 px-6 py-2.5 rounded-full transition-all font-medium ${
                  paymentMethod === 'PIX'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                PIX
              </button>
              <button
                onClick={() => setPaymentMethod('CREDIT_CARD')}
                className={`flex-1 px-6 py-2.5 rounded-full transition-all font-medium ${
                  paymentMethod === 'CREDIT_CARD'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Cartão de Crédito
              </button>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-4 lg:gap-6 max-w-5xl mx-auto mb-6">
          {/* Monthly Plan */}
          <Card className={`glass-card rounded-2xl p-6 transition-all ${
            billingCycle === 'monthly' 
              ? 'border-2 border-primary shadow-lg opacity-100' 
              : 'border border-border/30 opacity-50'
          }`}>
            <div className="mb-4">
              <h3 className="text-xl font-heading font-bold mb-1">Plano Mensal</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Ideal para começar e explorar os recursos.
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-heading font-bold">
                  {plans.monthly.price}
                </span>
                <span className="text-sm text-muted-foreground">{plans.monthly.period}</span>
              </div>
            </div>

            <ul className="space-y-2 mb-6">
              {plans.monthly.features.map((feature, idx) => (
                <Feature key={idx} text={feature} />
              ))}
            </ul>

            <Button
              variant={billingCycle === 'monthly' ? 'default' : 'outline'}
              className="w-full h-11"
              onClick={() => handleSubscribe('monthly')}
              disabled={billingCycle !== 'monthly'}
            >
              Selecionar Plano Mensal
            </Button>
          </Card>

          {/* Annual Plan */}
          <Card className={`glass-card rounded-2xl p-6 transition-all relative ${
            billingCycle === 'annual' 
              ? 'border-2 border-primary shadow-lg opacity-100' 
              : 'border border-border/30 opacity-50'
          }`}>
            {/* Badge */}
            {billingCycle === 'annual' && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-md">
                  ⭐ Mais Popular
                </span>
              </div>
            )}

            <div className="mb-4 mt-3">
              <h3 className="text-xl font-heading font-bold mb-1">Plano Anual</h3>
              <p className="text-xs text-muted-foreground mb-3">
                A melhor opção para profissionais comprometidos.
              </p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-heading font-bold">
                  {plans.annual.price}
                </span>
                <span className="text-sm text-muted-foreground">{plans.annual.period}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-0.5">{plans.annual.total}</p>
              <p className="text-xs text-green-500 font-semibold">{plans.annual.savings}</p>
            </div>

            <ul className="space-y-2 mb-6">
              {plans.annual.features.map((feature, idx) => (
                <Feature key={idx} text={feature} />
              ))}
            </ul>

            <Button
              variant={billingCycle === 'annual' ? 'default' : 'outline'}
              className="w-full h-11"
              onClick={() => handleSubscribe('annual')}
              disabled={billingCycle !== 'annual'}
            >
              Selecionar Plano Anual
            </Button>
          </Card>
        </div>

        {/* Enterprise Contact */}
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground">
            Precisa de mais? Tem uma produtora?{' '}
            <button 
              onClick={() => setShowContactDialog(true)}
              className="text-primary hover:underline font-medium"
            >
              Entre em contato.
            </button>
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Todos os planos incluem 7 dias de teste grátis. Cancele quando quiser.
        </p>
      </div>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="sm:max-w-md dark bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Plano Enterprise
            </DialogTitle>
            <DialogDescription>
              Entre em contato conosco para discutir as necessidades da sua produtora.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Email de Contato</p>
                <a 
                  href="mailto:contato@souartista.app" 
                  className="text-sm text-primary hover:underline font-medium"
                >
                  contato@souartista.app
                </a>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Nossa equipe entrará em contato em até 24 horas para apresentar uma proposta personalizada.
            </p>
          </div>

          <Button onClick={() => setShowContactDialog(false)} className="w-full">
            Fechar
          </Button>
        </DialogContent>
      </Dialog>

      {/* PIX Payment Dialog */}
      <Dialog open={showPixDialog} onOpenChange={setShowPixDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              Pagamento via PIX
            </DialogTitle>
            <DialogDescription>
              Escaneie o QR Code ou copie o código para pagar
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-6 py-4">
            {/* QR Code Image */}
            {pixData?.image && (
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg">
                  <img 
                    src={`data:image/png;base64,${pixData.image}`} 
                    alt="QR Code PIX" 
                    className="w-64 h-64"
                  />
                </div>
              </div>
            )}

            {/* PIX Code */}
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-white">
                <p className="text-xs font-medium mb-2 text-primary">Código PIX (Copia e Cola)</p>
                <p className="text-sm font-mono break-all text-black">{pixData?.code}</p>
              </div>

              <Button onClick={copyPixCode} className="w-full" variant="outline">
                <Copy className="w-4 h-4 mr-2" />
                Copiar Código PIX
              </Button>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Como pagar:</p>
              <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>Abra o app do seu banco</li>
                <li>Escolha "Pagar com PIX"</li>
                <li>Escaneie o QR Code ou cole o código</li>
                <li>Confirme o pagamento</li>
              </ol>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Após o pagamento, você será notificado e seu plano será ativado automaticamente.
            </p>
          </div>

          <Button onClick={() => setShowPixDialog(false)} className="w-full">
            Fechar
          </Button>
        </DialogContent>
      </Dialog>

      {/* Credit Card Payment Dialog */}
      <Dialog open={showCreditCardDialog} onOpenChange={setShowCreditCardDialog}>
        <DialogContent className="sm:max-w-lg dark bg-background border-border">
          <DialogHeader>
            <DialogTitle>Pagamento com Cartão de Crédito</DialogTitle>
            <DialogDescription>
              Preencha os dados do cartão para finalizar sua assinatura
            </DialogDescription>
          </DialogHeader>
          
          <CreditCardForm 
            onSubmit={handleCreditCardSubmit}
            isLoading={isProcessing}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Feature = ({ text }: { text: string }) => (
  <li className="flex items-start gap-2">
    <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Check className="w-2.5 h-2.5 text-primary" />
    </div>
    <span className="text-xs leading-relaxed">{text}</span>
  </li>
);

export default Subscribe;
