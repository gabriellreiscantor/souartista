import { Music, LayoutDashboard, Calendar, Users, Car, BarChart3, Info, HelpCircle, Settings, LogOut } from 'lucide-react';
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
  { title: 'Dashboard', url: '/demo/musician/dashboard', icon: LayoutDashboard },
  { title: 'Shows', url: '/demo/musician/shows', icon: Music },
  { title: 'Artistas', url: '/demo/musician/artists', icon: Users },
  { title: 'Calendário', url: '/demo/musician/calendar', icon: Calendar },
  { title: 'Locomoção', url: '/demo/musician/transportation', icon: Car },
  { title: 'Relatórios', url: '/demo/musician/reports', icon: BarChart3 },
];

const settingsItems = [
  { title: 'Atualizações', url: '/demo/musician/updates', icon: Info },
  { title: 'Tutorial', url: '/demo/musician/tutorial', icon: HelpCircle },
  { title: 'Suporte', url: '/demo/musician/support', icon: HelpCircle },
  { title: 'Configurações', url: '/demo/musician/settings', icon: Settings },
];

export function DemoMusicianSidebar() {
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
