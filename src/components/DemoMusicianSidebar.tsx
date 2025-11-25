import { Music, Calendar, BarChart3, Car, LogOut, LayoutDashboard, Mic2, HelpCircle, User, Settings } from 'lucide-react';
import logo from '@/assets/logo.png';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
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
  { title: 'Dashboard', url: '/demo/musician/dashboard', icon: LayoutDashboard },
  { title: 'Shows', url: '/demo/musician/shows', icon: Music },
  { title: 'Artistas', url: '/demo/musician/artists', icon: Mic2 },
  { title: 'Calendário', url: '/demo/musician/calendar', icon: Calendar },
  { title: 'Relatórios', url: '/demo/musician/reports', icon: BarChart3 },
  { title: 'Locomoção', url: '/demo/musician/transportation', icon: Car },
];

const settingsItems = [
  { title: 'Suporte', url: '/demo/musician/support', icon: HelpCircle },
  { title: 'Perfil', url: '/demo/musician/profile', icon: User },
  { title: 'Ajustes', url: '/demo/musician/settings', icon: Settings },
];

export function DemoMusicianSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const handleSignOut = () => {
    navigate('/');
  };

  const handleSidebarClick = (e: React.MouseEvent) => {
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
