import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/logo.png';

const AppHub = () => {
  const { user, userData, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[AppHub] State:', { loading, user: user?.id, userData: !!userData, userRole, status_plano: userData?.status_plano });
    
    if (loading) return;

    if (!user) {
      console.log('[AppHub] No user, redirecting to login');
      navigate('/login');
      return;
    }

    // Se usuário está autenticado mas não tem profile, fazer logout
    // Isso acontece quando o trigger de criação de profile falha
    if (user && !userData) {
      console.error('[AppHub] User authenticated but no profile found. Forcing logout.');
      signOut().then(() => {
        navigate('/login');
      });
      return;
    }

    if (!userData?.cpf) {
      console.log('[AppHub] No CPF, redirecting to complete-profile');
      navigate('/complete-profile');
      return;
    }

    // Verificar se o email foi confirmado - redireciona para verify-email ao invés de logout
    if (!user.email_confirmed_at) {
      console.log('[AppHub] Email not confirmed, redirecting to verify-email');
      navigate(`/verify-email?email=${encodeURIComponent(user.email || '')}`);
      return;
    }

    if (!userRole) {
      console.log('[AppHub] No role, redirecting to select-role');
      navigate('/select-role');
      return;
    }

    if (userData?.status_plano !== 'ativo') {
      console.log('[AppHub] Plan not active, redirecting to subscribe');
      navigate('/subscribe');
      return;
    }

    // All checks passed, redirect to dashboard
    console.log('[AppHub] All checks passed, redirecting to dashboard:', `/${userRole}/dashboard`);
    navigate(`/${userRole}/dashboard`);
  }, [user, userData, userRole, loading, navigate]);

  // Timeout de segurança - se ficar mais de 10 segundos carregando, mostra erro
  useEffect(() => {
    if (!loading) return;
    
    const timeoutId = setTimeout(() => {
      console.error('[AppHub] Loading timeout after 10 seconds');
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [loading]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#1E082B] to-[#2A0C3A] flex flex-col items-center justify-center z-50">
        {/* Logo com glow effect */}
        <div className="relative mb-12">
          <div className="absolute inset-0 blur-3xl opacity-20 bg-[#A66CFF] scale-110"></div>
          <img 
            src={logo} 
            alt="SouArtista Logo" 
            className="relative w-[200px] md:w-[230px] h-auto"
          />
        </div>
        
        {/* Spinner premium */}
        <div className="relative w-12 h-12 mb-8">
          <div className="absolute inset-0 border-[3px] border-[#A66CFF]/20 rounded-full"></div>
          <div className="absolute inset-0 border-[3px] border-[#A66CFF] border-t-transparent rounded-full animate-spin" style={{ animationDuration: '1s' }}></div>
        </div>
        
        {/* Texto de carregamento */}
        <p className="text-white/80 text-sm font-light tracking-wide animate-pulse">
          Carregando...
        </p>
      </div>
    );
  }

  return null;
};

export default AppHub;
