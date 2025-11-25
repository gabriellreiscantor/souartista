import { User, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserMenuProps {
  userName?: string;
  userRole?: string;
}

export function UserMenu({ userName, userRole }: UserMenuProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logout realizado com sucesso!');
      navigate('/login');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  const handleProfile = () => {
    if (userRole === 'artist') {
      navigate('/artist/profile');
    } else if (userRole === 'musician') {
      navigate('/musician/profile');
    }
  };

  const handleSettings = () => {
    if (userRole === 'artist') {
      navigate('/artist/settings');
    } else if (userRole === 'musician') {
      navigate('/musician/settings');
    }
  };

  const getRoleLabel = () => {
    if (userRole === 'artist') return 'Artista';
    if (userRole === 'musician') return 'Músico';
    return userRole;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full bg-purple-100">
          <User className="w-5 h-5 text-purple-600" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white border-gray-200 text-gray-900">
        <DropdownMenuLabel>
          <div>
            <p className="font-medium">{userName || 'Minha Conta'}</p>
            <p className="text-xs text-gray-500">{getRoleLabel()}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
          <User className="w-4 h-4 mr-2" />
          Perfil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
          <Settings className="w-4 h-4 mr-2" />
          Ajustes
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
