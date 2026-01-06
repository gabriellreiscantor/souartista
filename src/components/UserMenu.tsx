import { User, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserMenuProps {
  userName?: string;
  userRole?: string;
  photoUrl?: string;
}

const getInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export function UserMenu({ userName, userRole, photoUrl }: UserMenuProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
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
        <Avatar className="h-9 w-9 cursor-pointer">
          <AvatarImage src={photoUrl} alt={userName} />
          <AvatarFallback className="bg-purple-100 text-purple-600 text-sm font-medium">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
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
