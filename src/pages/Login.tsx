import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Music, Loader2, ArrowLeft, Home } from 'lucide-react';
import logo from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';
import { useNativePlatform } from '@/hooks/useNativePlatform';
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { signIn, resendOtp, user, session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isNative } = useNativePlatform();

  // Redireciona automaticamente se já estiver logado
  useEffect(() => {
    const checkUserAndRedirect = async () => {
      if (!authLoading && user && session) {
        // Check if user is support staff
        const { data: supportRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'support')
          .maybeSingle();
        
        if (supportRole && !isNative) {
          // Support staff on web - redirect to support-tickets
          navigate('/support-tickets');
        } else {
          navigate('/app');
        }
      }
    };
    
    checkUserAndRedirect();
  }, [user, session, authLoading, navigate, isNative]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpar erros anteriores
    setEmailError('');
    setPasswordError('');
    
    // Validação inline
    let hasError = false;
    if (!email) {
      setEmailError('Por favor, preencha o e-mail');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Por favor, preencha a senha');
      hasError = true;
    }
    if (hasError) return;

    setLoading(true);

    // Timeout de segurança de 10 segundos
    const timeoutId = setTimeout(() => {
      console.error('[Login] Login timeout after 10 seconds');
      toast.error('O login está demorando muito. Tente novamente.');
      setLoading(false);
    }, 10000);

    try {
      const { error } = await signIn(email, password);

      clearTimeout(timeoutId);

      if (error) {
        
        // Mostrar erro inline nos campos
        if (error.message.includes('Invalid login credentials') || error.message.includes('invalid credentials')) {
          setEmailError('E-mail ou senha incorretos');
          setPasswordError('E-mail ou senha incorretos');
        } else if (error.message.includes('Email not confirmed')) {
          setEmailError('Verifique seu e-mail antes de fazer login');
        } else {
          // Para outros erros, usar toast
          toast.error(error.message);
        }
        setLoading(false);
      } else {
        // Check if email is confirmed
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (currentUser && !currentUser.email_confirmed_at) {
          // Send new OTP and redirect to verification page
          await resendOtp(email);
          toast.success('Enviamos um código para seu email.');
          navigate(`/verify-email?email=${encodeURIComponent(email)}`);
          setLoading(false);
          return;
        }
        // O redirecionamento será feito pelo useEffect acima
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[Login] Unexpected error:', error);
      toast.error('Algo deu errado. Tente novamente.');
      setLoading(false);
    }
  };

  // Mostra loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: '#1E082B',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        touchAction: 'none',
        overscrollBehavior: 'none'
      }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{
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
      {/* Botão Voltar para Home */}
      <Link 
        to="/" 
        className="absolute left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all hover:scale-105"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <ArrowLeft className="w-4 h-4 text-white" />
        <span className="text-white font-medium text-sm">Voltar</span>
      </Link>

      {/* Partículas discretas */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
        backgroundImage: `
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 80px,
            #B96FFF 80px,
            #B96FFF 81px
          ),
          repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 100px,
            #B96FFF 100px,
            #B96FFF 101px
          )
        `,
      }} />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8 relative">
          <img src={logo} alt="Sou Artista" className="h-32 w-auto relative z-10 drop-shadow-[0_0_25px_rgba(185,111,255,0.4)]" />
        </div>

        {/* Card com tema premium */}
        <div className="relative">
          <div className="absolute inset-0 bg-[#B96FFF] opacity-10 blur-[50px] rounded-3xl" />
          
          {/* Card */}
          <div className="relative z-10 rounded-3xl p-8 space-y-6 border border-[#B96FFF]/20" style={{
            background: 'rgba(42, 23, 56, 0.85)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px 0 rgba(185, 111, 255, 0.15)'
          }}>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-heading font-bold text-white">Bem-vindo de volta</h1>
            <p className="text-[#C8BAD4]">Entre com sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                disabled={loading}
                className={`h-11 bg-[#1B0D29] text-white placeholder:text-[#C8BAD4] ${
                  emailError ? 'border-red-500' : 'border-[#B96FFF]'
                }`}
              />
              {emailError && (
                <p className="text-red-500 text-xs mt-1">{emailError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Senha</Label>
              <PasswordInput
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                disabled={loading}
                className={`h-11 bg-[#1B0D29] text-white placeholder:text-[#C8BAD4] ${
                  passwordError ? 'border-red-500' : 'border-[#B96FFF]'
                }`}
              />
              {passwordError && (
                <p className="text-red-500 text-xs mt-1">{passwordError}</p>
              )}
              <div className="flex justify-end">
                <Link to="/reset-password" className="text-xs text-[#B96FFF] hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-[#C8BAD4]">
            Não tem uma conta?{' '}
            <Link to="/register" className="text-[#B96FFF] hover:underline font-medium">
              Criar conta
            </Link>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
