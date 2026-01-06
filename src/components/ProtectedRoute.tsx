import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useSupport } from '@/hooks/useSupport';
import { LoadingScreen } from '@/components/LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'artist' | 'musician';
  allowedRoles?: ('admin' | 'support')[];
}

export function ProtectedRoute({ children, requiredRole, allowedRoles }: ProtectedRouteProps) {
  const { user, userRole, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { isSupport, loading: supportLoading } = useSupport();

  const loading = authLoading || (allowedRoles && (adminLoading || supportLoading));

  // Enquanto carrega, mostra tela de loading
  if (loading) {
    return <LoadingScreen />;
  }

  // Se não tem usuário, redireciona para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se requer roles específicos de admin/support
  if (allowedRoles) {
    const hasAccess = allowedRoles.some(role => {
      if (role === 'admin') return isAdmin;
      if (role === 'support') return isSupport;
      return false;
    });
    
    if (!hasAccess) {
      return <Navigate to="/app" replace />;
    }
  }

  // Se requer role específico de artista/músico
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
