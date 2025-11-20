import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const AppHub = () => {
  const { user, userData, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[AppHub] State:', { loading, user: user?.id, userData: !!userData, userRole, status_plano: userData?.status_plano });
    
    if (loading) return;

    if (!user) {
      console.log('[AppHub] No user, redirecting to login');
      navigate('/login');
      return;
    }

    if (!userData?.cpf) {
      console.log('[AppHub] No CPF, redirecting to complete-profile');
      navigate('/complete-profile');
      return;
    }

    if (!userRole) {
      console.log('[AppHub] No role, redirecting to select-role');
      navigate('/select-role');
      return;
    }

    if (userData?.status_plano !== 'active') {
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AppHub;
