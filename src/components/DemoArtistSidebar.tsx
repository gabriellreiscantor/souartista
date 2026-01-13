import { LayoutDashboard, Music, Calendar, BarChart3, Truck, Receipt, Calculator, HelpCircle, User, Settings, LogOut } from 'lucide-react';
import logo from '@/assets/logo.png';
import logoIcon from '@/assets/logo_icon.png';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useNativePlatform } from '@/hooks/useNativePlatform';
import { DemoLockedModal } from '@/components/DemoLockedModal';

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
  { title: 'Dashboard', url: '/demo/artist/dashboard', icon: LayoutDashboard },
  { title: 'Shows', url: '/demo/artist/shows', icon: Music },
  { title: 'Calendário', url: '/demo/artist/calendar', icon: Calendar },
  { title: 'Relatórios', url: '/demo/artist/reports', icon: BarChart3 },
  { title: 'Locomoção', url: '/demo/artist/transportation', icon: Truck },
  { title: 'Despesas', url: '/demo/artist/expenses', icon: Receipt },
  { title: 'Simular NF', url: '/demo/artist/invoice-simulator', icon: Calculator },
];

const settingsItems = [
  { title: 'Suporte', url: '/demo/artist/support', icon: HelpCircle },
  { title: 'Perfil', url: '/demo/artist/profile', icon: User },
  { title: 'Ajustes', url: '/demo/artist/settings', icon: Settings },
];

export function DemoArtistSidebar() {
  const { state, setOpenMobile, isMobile, toggleSidebar } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';
  const [showLockedModal, setShowLockedModal] = useState(false);
  const { isIOS, isNative } = useNativePlatform();

  const handleSignOut = () => {
    navigate('/login');
  };

  const handleLockedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isMobile) setOpenMobile(false);
    setShowLockedModal(true);
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
        {/* iOS Safe Area Spacer */}
        {isIOS && isNative && (
          <div style={{ height: 'env(safe-area-inset-top, 0px)' }} />
        )}
        
        {/* Logo - clicável para toggle */}
        <div 
          className="p-4 pt-6 border-b border-sidebar-border cursor-pointer hover:bg-sidebar-accent/50 transition-colors"
          onClick={toggleSidebar}
          onTouchEnd={(e) => {
            e.preventDefault();
            toggleSidebar();
          }}
        >
          {!collapsed ? (
            <img src={logo} alt="Sou Artista" className="h-12 w-auto mx-auto" />
          ) : (
            <img src={logoIcon} alt="Sou Artista" className="h-6 w-6 mx-auto" />
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
                      onClick={() => isMobile && setOpenMobile(false)}
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
                  <SidebarMenuButton onClick={handleLockedClick}>
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
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
      <DemoLockedModal open={showLockedModal} onOpenChange={setShowLockedModal} />
    </Sidebar>
  );
}
