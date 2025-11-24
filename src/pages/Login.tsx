import { useState } from 'react';
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
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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
        navigate('/app');
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gradient-to-br from-[#070015] via-[#0d0020] to-[#050008]">
      {/* Camada de Efeitos - Blobs de Luz */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#A66CFF] opacity-40 blur-3xl rounded-full -translate-y-1/3 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#7C3AED] opacity-30 blur-3xl rounded-full translate-y-1/3 -translate-x-1/3" />
      
      {/* Camada Decorativa - Textura Sutil */}
      <div className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(167, 109, 255, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(124, 58, 237, 0.3) 0%, transparent 50%)',
      }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <img src={logo} alt="Sou Artista" className="h-32 w-auto drop-shadow-[0_0_25px_rgba(167,109,255,0.4)]" />
        </div>

        {/* Card */}
        <div className="bg-[#12001f]/80 backdrop-blur-xl border border-white/5 shadow-[0_0_40px_rgba(167,109,255,0.35)] rounded-3xl p-8 space-y-6">
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
              className="w-full h-11 bg-gradient-to-r from-[#A66CFF] to-[#C77DFF] hover:from-[#B57DFF] hover:to-[#D88DFF] text-white font-medium transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_10px_35px_rgba(167,109,255,0.5)]" 
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
  );
};

export default Login;
