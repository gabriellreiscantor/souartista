import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNativePlatform } from '@/hooks/useNativePlatform';
import { useAppleIAP } from '@/hooks/useAppleIAP';
import logo from '@/assets/logo.png';

const AppHub = () => {
  const { user, userData, userRole, loading, signOut, refetchUserData } = useAuth();
  const { isIOS, isNative } = useNativePlatform();
  const { checkSubscriptionStatus, isInitialized } = useAppleIAP();
  const navigate = useNavigate();
  const [checkingApple, setCheckingApple] = useState(false);
  const hasCheckedApple = useRef(false);

  // Verificação automática de assinatura Apple no iOS
  useEffect(() => {
    const checkAppleSubscription = async () => {
      // Só verificar no iOS nativo, quando usuário está logado, status não ativo, e não já verificou
      if (!isIOS || !isNative || !user || !userData || loading || hasCheckedApple.current) {
        return;
      }

      // Se já está ativo, não precisa verificar
      if (userData.status_plano === 'ativo') {
        return;
      }

      // Verificar se todas as outras condições para acessar /subscribe estão satisfeitas
      if (!userData.cpf || !user.email_confirmed_at || !userRole) {
        return;
      }

      console.log('[AppHub] iOS native detected, checking Apple subscription...');
      hasCheckedApple.current = true;
      setCheckingApple(true);

      try {
        const hasActiveSubscription = await checkSubscriptionStatus();
        
        if (hasActiveSubscription) {
          console.log('[AppHub] ✅ Active Apple subscription found! Refreshing user data...');
          await refetchUserData();
          // O useEffect principal vai redirecionar para o dashboard após refetch
        } else {
          console.log('[AppHub] No active Apple subscription found');
        }
      } catch (error) {
        console.error('[AppHub] Error checking Apple subscription:', error);
      } finally {
        setCheckingApple(false);
      }
    };

    // Aguardar mais tempo para o IAP inicializar (3 segundos)
    const timer = setTimeout(checkAppleSubscription, 3000);
    return () => clearTimeout(timer);
  }, [isIOS, isNative, user, userData, userRole, loading, checkSubscriptionStatus, refetchUserData]);

  useEffect(() => {
    console.log('[AppHub] State:', { loading, checkingApple, user: user?.id, userData: !!userData, userRole, status_plano: userData?.status_plano });
    
    if (loading || checkingApple) return;

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
  }, [user, userData, userRole, loading, checkingApple, navigate]);

  // Timeout de segurança - se ficar mais de 10 segundos carregando, mostra erro
  useEffect(() => {
    if (!loading && !checkingApple) return;
    
    const timeoutId = setTimeout(() => {
      console.error('[AppHub] Loading timeout after 10 seconds');
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [loading, checkingApple]);

  if (loading || checkingApple) {
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
          {checkingApple ? 'Verificando assinatura...' : 'Carregando...'}
        </p>
      </div>
    );
  }

  return null;
};

export default AppHub;
