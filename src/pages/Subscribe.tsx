import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Music, Check } from 'lucide-react';
import logo from '@/assets/logo.png';

const Subscribe = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const { updateUserData } = useAuth();
  const navigate = useNavigate();

  // Simulação - em produção, integraria com Monetizze
  const handleSubscribe = async (plan: string) => {
    // Por enquanto, ativamos direto para fins de desenvolvimento
    await updateUserData({ status_plano: 'active' });
    navigate('/app');
  };

  const monthlyPrice = 'R$ 29,90';
  const annualPrice = 'R$ 299,00';
  const annualMonthlyPrice = 'R$ 24,92';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-5xl">
        {/* Logo */}
        <div className="flex items-center justify-center mb-12">
          <img src={logo} alt="Sou Artista" className="h-16 w-auto" />
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold mb-4">
            Escolha seu plano
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Profissionalize sua gestão artística
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-muted/50 rounded-full p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-full transition-all ${
                billingCycle === 'annual'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              Anual
              <span className="ml-2 text-xs">-17%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className="glass-card rounded-2xl p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-heading font-bold mb-2">Grátis</h3>
              <div className="text-4xl font-heading font-bold mb-4">R$ 0</div>
              <p className="text-muted-foreground">
                Teste todas as funcionalidades
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              <Feature text="Até 5 shows por mês" />
              <Feature text="Gestão básica de equipe" />
              <Feature text="Relatórios simples" />
              <Feature text="Calendário de eventos" />
            </ul>

            <Button
              variant="outline"
              className="w-full h-11"
              onClick={() => handleSubscribe('free')}
            >
              Continuar grátis
            </Button>
          </Card>

          {/* Pro Plan */}
          <Card className="glass-card rounded-2xl p-8 border-2 border-primary shadow-primary">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                Recomendado
              </div>
              <h3 className="text-2xl font-heading font-bold mb-2">Pro</h3>
              <div className="text-4xl font-heading font-bold mb-2">
                {billingCycle === 'monthly' ? monthlyPrice : annualMonthlyPrice}
                <span className="text-lg text-muted-foreground">/mês</span>
              </div>
              {billingCycle === 'annual' && (
                <p className="text-sm text-muted-foreground mb-2">
                  {annualPrice} cobrado anualmente
                </p>
              )}
              <p className="text-muted-foreground">
                Para profissionais sérios
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              <Feature text="Shows ilimitados" />
              <Feature text="Equipe completa ilimitada" />
              <Feature text="Relatórios avançados com exportação" />
              <Feature text="Gestão de despesas completa" />
              <Feature text="Rankings e análises" />
              <Feature text="Suporte prioritário" />
            </ul>

            <Button
              className="w-full h-11"
              onClick={() => handleSubscribe('pro')}
            >
              Assinar agora
            </Button>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
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
