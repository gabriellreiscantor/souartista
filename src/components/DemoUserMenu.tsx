import { User, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

interface DemoUserMenuProps {
  userName?: string;
  userRole?: string;
}

export function DemoUserMenu({ userName, userRole }: DemoUserMenuProps) {
  const navigate = useNavigate();

  const handleProfile = () => {
    toast.info("Modo Demo", {
      description: "Esta função está disponível apenas na versão completa."
    });
  };

  const handleSettings = () => {
    toast.info("Modo Demo", {
      description: "Esta função está disponível apenas na versão completa."
    });
  };

  const handleLogout = () => {
    navigate('/');
  };

  const getInitials = (name: string = "Demo User") => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string = "demo") => {
    const labels: Record<string, string> = {
      artist: "Artista",
      musician: "Músico",
      demo: "Demo"
    };
    return labels[role] || "Demo";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full hover:bg-gray-100"
        >
          <Avatar className="h-10 w-10 border-2 border-purple-200">
            <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-white border-gray-200" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-gray-900">{userName || "Demo User"}</p>
            <p className="text-xs leading-none text-gray-500">
              {getRoleLabel(userRole)}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-200" />
        <DropdownMenuItem 
          onClick={handleProfile}
          className="cursor-pointer hover:bg-gray-100 text-gray-900"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleSettings}
          className="cursor-pointer hover:bg-gray-100 text-gray-900"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Configurações</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-200" />
        <DropdownMenuItem 
          onClick={handleLogout}
          className="cursor-pointer hover:bg-gray-100 text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair do Demo</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
