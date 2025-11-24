import { Shield, Users, Search, DollarSign, Bell, MessageCircle, LogOut } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

const mainItems = [
  {
    title: 'Usuários',
    url: '/admin?tab=usuarios',
    icon: Users,
  },
  {
    title: 'Buscar por ID',
    url: '/admin?tab=buscar',
    icon: Search,
  },
  {
    title: 'Financeiro Global',
    url: '/admin?tab=financeiro',
    icon: DollarSign,
  },
  {
    title: 'Notificações',
    url: '/admin?tab=notificacoes',
    icon: Bell,
  },
  {
    title: 'Contatos WhatsApp',
    url: '/admin?tab=contatos',
    icon: MessageCircle,
  },
];

export function AdminSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'usuarios';

  const isCollapsed = state === 'collapsed';

  const isActive = (url: string) => {
    const tabParam = new URL(url, window.location.origin).searchParams.get('tab');
    return tabParam === currentTab;
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logout realizado com sucesso!');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const handleSidebarClick = (e: React.MouseEvent) => {
    if (isMobile && e.target === e.currentTarget) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar 
      className={`${isCollapsed ? 'w-14' : 'w-48 md:w-60'} border-r-0`}
      collapsible="icon"
      onClick={handleSidebarClick}
    >
      <SidebarHeader className="h-16 md:h-auto bg-gradient-to-b from-purple-600 to-purple-700">
        <div className="flex items-center justify-center py-4 md:py-6 px-2 md:px-4">
          <img
            src={logo}
            alt="Logo"
            className={`transition-all duration-300 ${
              isCollapsed ? 'w-8 h-8' : 'w-24 h-24 md:w-32 md:h-32'
            }`}
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-gradient-to-b from-purple-700 to-purple-800">
        <SidebarGroup>
          <SidebarGroupLabel className="text-purple-100/80 px-3 md:px-4 text-xs font-semibold uppercase tracking-wider">
            <Shield className="w-4 h-4 mr-2 inline" />
            {!isCollapsed && 'Administração'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`text-white/90 hover:text-white hover:bg-white/10 transition-all mx-2 rounded-lg ${
                        isActive(item.url) ? 'bg-white/20 text-white font-semibold shadow-lg' : ''
                      }`}
                    >
                      <NavLink 
                        to={item.url}
                        onClick={() => isMobile && setOpenMobile(false)}
                      >
                        <Icon className="w-5 h-5" />
                        {!isCollapsed && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-gradient-to-b from-purple-800 to-purple-900 border-t border-purple-600/30 mt-auto p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="text-white/90 hover:text-white hover:bg-white/10 transition-all mx-2 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
              {!isCollapsed && <span className="text-sm">Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
