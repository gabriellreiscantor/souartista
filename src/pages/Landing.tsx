import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Loader2, ArrowRight, Play } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Onboarding from '@/components/Onboarding';
import logo from '@/assets/logo.png';
const Landing = () => {
  const navigate = useNavigate();
  const {
    user,
    session,
    loading: authLoading
  } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    const hasCompleted = localStorage.getItem('hasCompletedOnboarding');
    if (!hasCompleted) {
      setShowOnboarding(true);
    }
  }, []);

  // Redirect authenticated users
  useEffect(() => {
    if (!authLoading && user && session) {
      console.log('[Landing] User authenticated, redirecting to /app');
      navigate('/app');
    }
  }, [user, session, authLoading, navigate]);

  // Loading state
  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>;
  }

  // Show onboarding if not completed
  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }
  return <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/10 pointer-events-none" />
      
      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-12">
        
        {/* Trial badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 border border-primary/30 mb-8 animate-fade-in">
          <DollarSign className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Experimente por 7 dias grâtis!    </span>
        </div>

        {/* Logo */}
        <div className="mb-8 animate-scale-in">
          <img src={logo} alt="SouArtista" className="h-32 w-auto drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]" />
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-center text-foreground mb-4 max-w-md animate-fade-in">
          Suas finanças musicais, organizadas.
        </h1>

        {/* Subheadline */}
        <p className="text-lg text-center text-muted-foreground mb-12 max-w-sm animate-fade-in">
          Cuidamos da parte chata e você cuida da música.
        </p>

        {/* Action buttons */}
        <div className="w-full max-w-sm space-y-4 animate-fade-in">
          <Button size="lg" onClick={() => navigate('/register')} className="w-full rounded-full text-lg font-medium shadow-primary hover:scale-105 transition-transform">
            Criar minha conta agora
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>

          <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="w-full rounded-full text-lg font-medium border-2 border-primary/30 hover:bg-primary/10">
            Já tenho uma conta
          </Button>

          <Button size="lg" variant="ghost" onClick={() => navigate('/app')} className="w-full rounded-full text-lg font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50">
            <Play className="mr-2 w-5 h-5" />
            Ver Demonstração
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative py-8 px-6 text-center space-y-2 animate-fade-in">
        <p className="text-xs text-muted-foreground">
          © 2025 SouArtista. Todos os direitos reservados.
        </p>
        <div className="flex justify-center gap-4 text-xs">
          <button onClick={() => navigate('/terms')} className="text-muted-foreground hover:text-foreground transition-colors underline">
            Termos de Uso
          </button>
          <button onClick={() => navigate('/privacy')} className="text-muted-foreground hover:text-foreground transition-colors underline">
            Política de Privacidade
          </button>
        </div>
      </footer>
    </div>;
};
export default Landing;