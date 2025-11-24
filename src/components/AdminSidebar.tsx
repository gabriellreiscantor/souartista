import { Shield, Users, Search, DollarSign, Bell, MessageCircle } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
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
} from '@/components/ui/sidebar';
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
  const { state } = useSidebar();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'usuarios';

  const isCollapsed = state === 'collapsed';

  const isActive = (url: string) => {
    const tabParam = new URL(url, window.location.origin).searchParams.get('tab');
    return tabParam === currentTab;
  };

  return (
    <Sidebar className="border-r border-border/40" collapsible="icon">
      <SidebarContent className="bg-gradient-to-b from-purple-600 to-purple-800">
        <div className="px-4 py-6">
          <img
            src={logo}
            alt="Logo"
            className={`transition-all duration-300 ${
              isCollapsed ? 'w-8 h-8' : 'w-32 h-32'
            } mx-auto`}
          />
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-purple-100/70 px-4">
            <Shield className="w-4 h-4 mr-2 inline" />
            {!isCollapsed && 'Administração'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={`text-white/90 hover:text-white hover:bg-white/10 ${
                      isActive(item.url) ? 'bg-white/20 text-white font-semibold' : ''
                    }`}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="w-5 h-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
