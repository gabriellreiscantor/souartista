import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Music, Loader2 } from 'lucide-react';
import logo from '@/assets/logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user, session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redireciona automaticamente se já estiver logado
  useEffect(() => {
    if (!authLoading && user && session) {
      console.log('[Login] User already authenticated, redirecting to /app');
      navigate('/app');
    }
  }, [user, session, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    console.log('[Login] Starting login process...');
    setLoading(true);

    // Timeout de segurança de 10 segundos
    const timeoutId = setTimeout(() => {
      console.error('[Login] Login timeout after 10 seconds');
      toast({
        title: 'Tempo esgotado',
        description: 'O login está demorando muito. Tente novamente.',
        variant: 'destructive',
      });
      setLoading(false);
    }, 10000);

    try {
      const { error } = await signIn(email, password);

      clearTimeout(timeoutId);

      if (error) {
        console.error('[Login] Login error:', error);
        toast({
          title: 'Erro ao fazer login',
          description: error.message || 'Verifique suas credenciais e tente novamente',
          variant: 'destructive',
        });
        setLoading(false);
      } else {
        console.log('[Login] Login successful, redirecting to /app');
        toast({
          title: 'Login realizado!',
          description: 'Bem-vindo de volta',
        });
        // O redirecionamento será feito pelo useEffect acima
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[Login] Unexpected error:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Algo deu errado. Tente novamente.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  // Mostra loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(to bottom, #110016 0%, #080010 45%, #040008 100%)'
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
      background: 'linear-gradient(to bottom, #110016 0%, #080010 45%, #040008 100%)'
    }}>
      {/* Linhas musicais abstratas - bem discretas */}
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

      <div className="w-full max-w-md relative z-10">
        {/* Glow atrás da logo */}
        <div className="flex items-center justify-center mb-8 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[260px] h-[260px] bg-[#A66CFF] opacity-20 blur-[80px] rounded-full" />
          </div>
          <img src={logo} alt="Sou Artista" className="h-32 w-auto relative z-10" />
        </div>

        {/* Glow atrás do card */}
        <div className="relative">
          <div className="absolute inset-0 bg-[#A66CFF] opacity-15 blur-[60px] rounded-3xl scale-105" />
          
          {/* Card */}
          <div className="glass-card rounded-3xl p-8 space-y-6 relative z-10">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-heading font-bold">Bem-vindo de volta</h1>
            <p className="text-muted-foreground">Entre com sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <PasswordInput
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="h-11"
              />
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

          <div className="text-center text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
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
