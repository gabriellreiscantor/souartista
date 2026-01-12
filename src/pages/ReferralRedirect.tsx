import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * Página de redirecionamento para links de indicação
 * URL: /r/:code
 * 
 * Captura o código de indicação da URL, salva no localStorage e redireciona para /register
 */
const ReferralRedirect = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      // Salvar código de indicação no localStorage
      localStorage.setItem('referral_code', code.toUpperCase());
      console.log('📨 Referral code captured:', code.toUpperCase());
    }

    // Redirecionar para página de registro
    // Pequeno delay para garantir que o localStorage foi atualizado
    setTimeout(() => {
      navigate('/register', { replace: true });
    }, 500);
  }, [code, navigate]);

  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{
        background: '#1E082B',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        <p className="text-purple-200 text-center">
          Preparando seu cadastro...<br />
          <span className="text-sm text-purple-400">Você foi indicado por um amigo!</span>
        </p>
      </div>
    </div>
  );
};

export default ReferralRedirect;
