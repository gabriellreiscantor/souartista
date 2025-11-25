import { Music, LayoutDashboard, Calendar, Users, MapPin, Car, BarChart3, Info, HelpCircle, Settings, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';
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

const mainItems = [
  { title: 'Dashboard', url: '/demo/artist/dashboard', icon: LayoutDashboard },
  { title: 'Shows', url: '/demo/artist/shows', icon: Music },
  { title: 'Calendário', url: '/demo/artist/calendar', icon: Calendar },
  { title: 'Músicos', url: '/demo/artist/musicians', icon: Users },
  { title: 'Estabelecimentos', url: '/demo/artist/venues', icon: MapPin },
  { title: 'Locomoção', url: '/demo/artist/transportation', icon: Car },
  { title: 'Relatórios', url: '/demo/artist/reports', icon: BarChart3 },
];

const settingsItems = [
  { title: 'Atualizações', url: '/demo/artist/updates', icon: Info },
  { title: 'Tutorial', url: '/demo/artist/tutorial', icon: HelpCircle },
  { title: 'Suporte', url: '/demo/artist/support', icon: HelpCircle },
  { title: 'Configurações', url: '/demo/artist/settings', icon: Settings },
];

export function DemoArtistSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = location.pathname;

  const handleSignOut = () => {
    navigate('/');
  };

  const handleSidebarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile && e.target === e.currentTarget) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-gray-200 bg-white hidden md:flex">
      <div onClick={handleSidebarClick} className="h-full flex flex-col">
        {/* Logo */}
        <div className="h-16 border-b border-gray-200 flex items-center px-6">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className={cn(
              "transition-all duration-200",
              collapsed ? "h-8" : "h-10"
            )}
          />
        </div>

        <SidebarContent>
          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-500 uppercase text-xs font-semibold">
              Menu Principal
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className="hover:bg-gray-100 text-gray-700"
                        activeClassName="bg-primary/10 text-primary font-semibold"
                      >
                        <item.icon className="w-5 h-5" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Settings Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-500 uppercase text-xs font-semibold">
              Configurações
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="hover:bg-gray-100 text-gray-700"
                        activeClassName="bg-primary/10 text-primary font-semibold"
                      >
                        <item.icon className="w-5 h-5" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                {/* Sair Button */}
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleSignOut} className="hover:bg-red-50 text-red-600">
                    <LogOut className="w-5 h-5" />
                    {!collapsed && <span>Sair</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </div>
    </Sidebar>
  );
}
