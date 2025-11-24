import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Music, Calendar, DollarSign, Users, TrendingUp, Sparkles, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';

const Landing = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, session, loading: authLoading } = useAuth();

  // Redireciona usuários autenticados automaticamente
  useEffect(() => {
    if (!authLoading && user && session) {
      console.log('[Landing] User authenticated, redirecting to /app');
      navigate('/app');
    }
  }, [user, session, authLoading, navigate]);

  useEffect(() => {
    if (isMobile && !user) {
      navigate('/login');
    }
  }, [isMobile, user, navigate]);

  // Mostra loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-32">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Plataforma Completa de Gestão</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-heading font-bold tracking-tight">
            Gerencie sua carreira
            <span className="block gradient-primary mt-2">
              como um profissional
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
            A plataforma definitiva para artistas e músicos organizarem shows, equipes, 
            finanças e muito mais em um só lugar.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/register')}
              className="text-lg px-8 shadow-primary hover:shadow-xl transition-all"
            >
              Começar Gratuitamente
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/login')}
              className="text-lg px-8"
            >
              Já tenho conta
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 pb-32">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FeatureCard
            icon={<Calendar className="w-8 h-8" />}
            title="Agenda Inteligente"
            description="Visualize todos os seus shows em calendário e timeline com informações detalhadas"
          />
          <FeatureCard
            icon={<DollarSign className="w-8 h-8" />}
            title="Gestão Financeira"
            description="Controle cachês, despesas e lucros com relatórios completos e exportação"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="Equipe Organizada"
            description="Cadastre músicos, defina cachês e monte equipes para cada show"
          />
          <FeatureCard
            icon={<Music className="w-8 h-8" />}
            title="Locais Recorrentes"
            description="Salve seus bares e locais favoritos para agilizar cadastros"
          />
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Análises e Rankings"
            description="Veja os locais mais lucrativos e tome decisões baseadas em dados"
          />
          <FeatureCard
            icon={<Sparkles className="w-8 h-8" />}
            title="Mobile First"
            description="Use como app no celular com todas as funcionalidades"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 pb-32">
        <div className="glass-card rounded-3xl p-12 text-center max-w-4xl mx-auto border-2 border-primary/20">
          <h2 className="text-4xl font-heading font-bold mb-6">
            Pronto para transformar sua carreira?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Junte-se a centenas de artistas que já profissionalizaram sua gestão
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/register')}
            className="text-lg px-12 shadow-primary hover:shadow-xl transition-all"
          >
            Criar Conta Grátis
          </Button>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <div className="glass-card rounded-2xl p-6 hover:border-primary/40 transition-smooth group">
      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-smooth">
        {icon}
      </div>
      <h3 className="text-xl font-heading font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default Landing;
