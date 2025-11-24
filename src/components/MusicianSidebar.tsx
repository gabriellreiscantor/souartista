import { Music, Calendar, BarChart3, Car, LogOut, LayoutDashboard, Mic2, HelpCircle, User, Settings } from 'lucide-react';
import logo from '@/assets/logo.png';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const mainItems = [
  { title: 'Dashboard', url: '/musician/dashboard', icon: LayoutDashboard },
  { title: 'Shows', url: '/musician/shows', icon: Music },
  { title: 'Calendário', url: '/musician/calendar', icon: Calendar },
  { title: 'Relatórios', url: '/musician/reports', icon: BarChart3 },
  { title: 'Locomoção', url: '/musician/transportation', icon: Car },
];

const settingsItems = [
  { title: 'Artistas', url: '/musician/artists', icon: Mic2 },
  { title: 'Suporte', url: '/musician/support', icon: HelpCircle },
  { title: 'Perfil', url: '/musician/profile', icon: User },
  { title: 'Ajustes', url: '/musician/settings', icon: Settings },
];

export function MusicianSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleSidebarClick = (e: React.MouseEvent) => {
    // Fecha o sidebar se clicar em área vazia (não em link ou botão) no mobile
    if (isMobile && e.target === e.currentTarget) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar
      className={collapsed ? 'w-14' : 'w-48 md:w-60'}
      collapsible="icon"
    >
      <SidebarContent className="bg-sidebar-background" onClick={handleSidebarClick}>
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border">
          {!collapsed ? (
            <img src={logo} alt="Sou Artista" className="h-12 w-auto mx-auto" />
          ) : (
            <img src={logo} alt="Sou Artista" className="h-8 w-auto mx-auto" />
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup className="mt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Navigation */}
        <SidebarGroup className="mt-auto border-t border-sidebar-border pt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* Sair button */}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  {!collapsed && <span>Sair</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
