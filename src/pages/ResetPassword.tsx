import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import logo from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Por favor, insira seu e-mail');
      return;
    }

    // Validação básica de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Por favor, insira um e-mail válido');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success('Verifique sua caixa de entrada para redefinir sua senha');
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      toast.error(error.message || 'Não foi possível enviar o e-mail. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

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
    }}>
      {/* Glow central suave e sutil */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-[#B96FFF] opacity-[0.08] blur-[120px] rounded-full" />
      </div>
      
      {/* Vignette nas bordas */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at center, transparent 0%, rgba(30, 8, 43, 0.6) 100%)'
      }} />

      {/* Botão Voltar */}
      <Link 
        to="/login" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all hover:scale-105"
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

      <div className="w-full max-w-md relative z-10">
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
            {!emailSent ? (
              <>
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-[#B96FFF]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-[#B96FFF]" />
                  </div>
                  <h1 className="text-3xl font-heading font-bold text-white">Redefinir Senha</h1>
                  <p className="text-[#C8BAD4]">Digite seu e-mail para receber o link de recuperação</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="h-11 bg-[#1B0D29] border-[#B96FFF] text-white placeholder:text-[#C8BAD4]"
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
                        Enviando...
                      </>
                    ) : (
                      'Enviar link de recuperação'
                    )}
                  </Button>
                </form>

                <div className="text-center text-sm text-[#C8BAD4]">
                  Lembrou da senha?{' '}
                  <Link to="/login" className="text-[#B96FFF] hover:underline font-medium">
                    Fazer login
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-heading font-bold text-white">E-mail enviado!</h2>
                <p className="text-[#C8BAD4]">
                  Enviamos um link de recuperação para <strong className="text-white">{email}</strong>
                </p>
                <p className="text-sm text-[#C8BAD4]">
                  Verifique sua caixa de entrada e spam. O link é válido por 1 hora.
                </p>
                <Button 
                  onClick={() => navigate('/login')}
                  className="w-full h-11"
                >
                  Voltar para o login
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
