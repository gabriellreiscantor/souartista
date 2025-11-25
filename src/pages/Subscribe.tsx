import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Shield } from 'lucide-react';
import logo from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';

const Subscribe = () => {
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
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
    await updateUserData({ status_plano: 'active' });
    navigate('/app');
  };

  const plans = {
    monthly: {
      price: 'R$ 29,90',
      period: '/mês',
      total: '',
      features: [
        'Gerenciamento de shows ilimitado',
        'Controle financeiro completo',
        'Gestão de equipe e músicos',
        'Relatórios detalhados',
        'Suporte prioritário via tickets',
      ]
    },
    annual: {
      price: 'R$ 19,99',
      period: '/mês',
      total: 'Cobrado R$ 239,88 anualmente',
      savings: 'Economize R$ 119,00 por ano!',
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
        <div className="flex justify-center mb-8">
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
              className={`px-6 py-2.5 rounded-full transition-all font-medium flex items-center gap-2 ${
                billingCycle === 'annual'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Anual
              <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full font-bold">
                -33%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-8">
          {/* Monthly Plan */}
          <Card className={`glass-card rounded-2xl p-6 md:p-8 transition-all ${
            billingCycle === 'monthly' ? 'border-2 border-primary shadow-lg' : 'border border-border/50'
          }`}>
            <div className="mb-6">
              <h3 className="text-2xl font-heading font-bold mb-2">Plano Mensal</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ideal para começar e explorar os recursos.
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl md:text-5xl font-heading font-bold">
                  {plans.monthly.price}
                </span>
                <span className="text-muted-foreground">{plans.monthly.period}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {plans.monthly.features.map((feature, idx) => (
                <Feature key={idx} text={feature} />
              ))}
            </ul>

            <Button
              variant={billingCycle === 'monthly' ? 'default' : 'outline'}
              className="w-full h-12"
              onClick={() => handleSubscribe('monthly')}
            >
              Selecionar Plano Mensal
            </Button>
          </Card>

          {/* Annual Plan */}
          <Card className={`glass-card rounded-2xl p-6 md:p-8 transition-all relative ${
            billingCycle === 'annual' ? 'border-2 border-primary shadow-lg' : 'border border-border/50'
          }`}>
            {/* Popular Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-lg">
                ⭐ Mais Popular
              </span>
            </div>

            <div className="mb-6 mt-2">
              <h3 className="text-2xl font-heading font-bold mb-2">Plano Anual</h3>
              <p className="text-sm text-muted-foreground mb-4">
                A melhor opção para profissionais comprometidos.
              </p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl md:text-5xl font-heading font-bold">
                  {plans.annual.price}
                </span>
                <span className="text-muted-foreground">{plans.annual.period}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{plans.annual.total}</p>
              <p className="text-sm text-green-500 font-semibold">{plans.annual.savings}</p>
            </div>

            <ul className="space-y-3 mb-8">
              {plans.annual.features.map((feature, idx) => (
                <Feature key={idx} text={feature} />
              ))}
            </ul>

            <Button
              variant={billingCycle === 'annual' ? 'default' : 'outline'}
              className="w-full h-12"
              onClick={() => handleSubscribe('annual')}
            >
              Selecionar Plano Anual
            </Button>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Todos os planos incluem 7 dias de teste grátis. Cancele quando quiser.
        </p>
      </div>
    </div>
  );
};

const Feature = ({ text }: { text: string }) => (
  <li className="flex items-start gap-3">
    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Check className="w-3 h-3 text-primary" />
    </div>
    <span className="text-sm">{text}</span>
  </li>
);

export default Subscribe;
