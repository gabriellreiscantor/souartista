import { LayoutDashboard, Music, Calendar, BarChart3, Truck, HelpCircle, User, Settings, LogOut, MapPin, Shield, CreditCard, Receipt, Calculator } from 'lucide-react';
import logo from '@/assets/logo.png';
import logoIcon from '@/assets/logo_icon.png';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { useNativePlatform } from '@/hooks/useNativePlatform';

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
  { title: 'Dashboard', url: '/artist/dashboard', icon: LayoutDashboard },
  { title: 'Shows', url: '/artist/shows', icon: Music },
  { title: 'Calendário', url: '/artist/calendar', icon: Calendar },
  { title: 'Relatórios', url: '/artist/reports', icon: BarChart3 },
  { title: 'Locomoção', url: '/artist/transportation', icon: Truck },
  { title: 'Despesas', url: '/artist/expenses', icon: Receipt },
  { title: 'Simular NF', url: '/artist/invoice-simulator', icon: Calculator },
];

const settingsItems = [
  { title: 'Assinatura', url: '/artist/subscription', icon: CreditCard },
  { title: 'Suporte', url: '/artist/support', icon: HelpCircle },
  { title: 'Perfil', url: '/artist/profile', icon: User },
  { title: 'Ajustes', url: '/artist/settings', icon: Settings },
];

const adminItems = [
  { title: 'Admin', url: '/admin', icon: Shield },
];

export function ArtistSidebar() {
  const { state, setOpenMobile, isMobile, toggleSidebar } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';
  const { isAdmin } = useAdmin();
  const { isIOS, isNative } = useNativePlatform();

  // Mostrar todos os itens (incluindo Assinatura no iOS para gerenciar via App Store)
  const filteredSettingsItems = settingsItems;

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.log('Logout error (ignored):', error);
    }
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
        
        {/* Logo - clicável para toggle */}
        <div 
          className="p-4 border-b border-sidebar-border cursor-pointer hover:bg-sidebar-accent/50 transition-colors"
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

        {/* Admin Navigation (only visible to admins) */}
        {isAdmin && (
          <SidebarGroup className="mt-auto border-t border-sidebar-border pt-4">
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
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
        )}

        {/* Settings Navigation */}
        <SidebarGroup className={`${isAdmin ? "" : "border-t border-sidebar-border pt-4"} ${isIOS && isNative ? "mt-8" : "mt-auto"}`}>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredSettingsItems.map((item) => (
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
