import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
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
  return <div className="min-h-screen flex flex-col relative overflow-hidden" style={{
      background: '#1E082B',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      touchAction: 'none',
      overscrollBehavior: 'none',
      WebkitOverflowScrolling: 'auto'
    }}>
      {/* Glow central suave e sutil */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-[#B96FFF] opacity-[0.08] blur-[120px] rounded-full" />
      </div>
      
      {/* Vignette nas bordas */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at center, transparent 0%, rgba(30, 8, 43, 0.6) 100%)'
      }} />
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 60px,
            #5A1E90 60px,
            #5A1E90 61px
          ),
          repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 80px,
            #5A1E90 80px,
            #5A1E90 81px
          )
        `,
      }} />
      
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
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-center text-white mb-4 max-w-md animate-fade-in">
          Suas finanças musicais, organizadas.
        </h1>

        {/* Subheadline */}
        <p className="text-lg text-center text-gray-300 mb-12 max-w-sm animate-fade-in">
          Cuidamos da parte chata e você cuida da música.
        </p>

        {/* Action buttons */}
        <div className="w-full max-w-sm space-y-4 animate-fade-in">
          <Button size="lg" onClick={() => navigate('/register')} className="w-full rounded-full text-lg font-medium shadow-primary hover:scale-105 transition-transform">
            Criar minha conta agora
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>

          <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="w-full rounded-full text-lg font-medium border-primary/30 text-primary hover:text-primary hover:bg-primary/10">
            Já tenho uma conta
          </Button>

          <Button size="lg" variant="ghost" onClick={() => navigate('/demo')} className="w-full rounded-full text-lg font-medium text-gray-300 hover:text-white hover:bg-white/10">
            <Play className="mr-2 w-5 h-5" />
            Ver Demonstração
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative py-8 px-6 text-center space-y-2 animate-fade-in">
        <p className="text-xs text-gray-400">
          © 2025 SouArtista. Todos os direitos reservados.
        </p>
        <div className="flex justify-center gap-4 text-xs">
          <Link to="/terms" className="text-gray-400 hover:text-white transition-colors underline">
            Termos de Uso
          </Link>
          <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors underline">
            Política de Privacidade
          </Link>
        </div>
      </footer>
    </div>;
};
export default Landing;