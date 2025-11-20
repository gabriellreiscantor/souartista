import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const AppHub = () => {
  const { user, userData, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    if (!userData?.cpf) {
      navigate('/complete-profile');
      return;
    }

    if (!userData?.role) {
      navigate('/select-role');
      return;
    }

    if (userData?.status_plano !== 'active') {
      navigate('/subscribe');
      return;
    }

    // All checks passed, redirect to dashboard
    navigate(`/${userData.role}/dashboard`);
  }, [user, userData, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
};

export default AppHub;
