import { Shield, Users, Search, DollarSign, Bell, MessageCircle, LogOut, FileText, Headphones, Download, Smartphone, Sparkles, MessageSquare, Scale, UserCog, AlertTriangle, Megaphone, Trash2, Database, Apple } from 'lucide-react';
import logo from '@/assets/logo.png';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

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
  { title: 'Usuários', url: '/admin?tab=usuarios', icon: Users },
  { title: 'Usuários Deletados', url: '/admin?tab=deletados', icon: Trash2, showDeletedBadge: true },
  { title: 'Buscar por ID', url: '/admin?tab=buscar', icon: Search },
  { title: 'Gerenciar Permissões', url: '/admin?tab=administradores', icon: Shield },
  { title: 'Funcionários Suporte', url: '/admin?tab=funcionarios', icon: UserCog },
  { title: 'Direitos LGPD', url: '/admin?tab=lgpd', icon: Scale },
  { title: 'Importação Firebase', url: '/admin?tab=importacao', icon: Download },
  { title: 'Financeiro Global', url: '/admin?tab=financeiro', icon: DollarSign },
  { title: 'RevenueCat', url: '/admin?tab=revenuecat', icon: Apple },
  { title: 'Suporte', url: '/admin?tab=suporte', icon: Headphones },
  { title: 'Tickets Escalados', url: '/admin?tab=escalados', icon: AlertTriangle, showBadge: true },
  { title: 'Avisos Globais', url: '/admin?tab=avisos', icon: Megaphone },
  { title: 'Notificações', url: '/admin?tab=notificacoes', icon: Bell },
  { title: 'Push Mobile', url: '/admin?tab=push-mobile', icon: Smartphone },
  { title: 'Contatos WhatsApp', url: '/admin?tab=contatos', icon: MessageCircle },
  { title: 'Atualizações', url: '/admin?tab=atualizacoes', icon: Sparkles },
  { title: 'Feedback', url: '/admin?tab=feedback', icon: MessageSquare },
  { title: 'Logs do Sistema', url: '/admin?tab=logs', icon: FileText },
  { title: 'Backup God', url: '/admin?tab=backup', icon: Database },
];

export function AdminSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'usuarios';
  const collapsed = state === 'collapsed';
  const [escalatedCount, setEscalatedCount] = useState(0);
  const [deletedUsersCount, setDeletedUsersCount] = useState(0);

  useEffect(() => {
    fetchEscalatedCount();
    fetchDeletedUsersCount();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('escalated-tickets-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
          filter: 'escalated_to_admin=eq.true'
        },
        () => {
          fetchEscalatedCount();
        }
      )
      .subscribe();

    const deletedChannel = supabase
      .channel('deleted-users-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deleted_users'
        },
        () => {
          fetchDeletedUsersCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(deletedChannel);
    };
  }, []);

  const fetchEscalatedCount = async () => {
    try {
      const { count, error } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('escalated_to_admin', true)
        .in('status', ['open', 'in_progress']);

      if (error) throw error;
      setEscalatedCount(count || 0);
    } catch (error) {
      console.error('Error fetching escalated count:', error);
    }
  };

  const fetchDeletedUsersCount = async () => {
    try {
      const { count, error } = await supabase
        .from('deleted_users')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_deletion');

      if (error) throw error;
      setDeletedUsersCount(count || 0);
    } catch (error) {
      console.error('Error fetching deleted users count:', error);
    }
  };

  const isActive = (url: string) => {
    const tabParam = new URL(url, window.location.origin).searchParams.get('tab');
    return tabParam === currentTab;
  };

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
      className={collapsed ? 'w-14' : 'w-52 md:w-60'}
      collapsible="icon"
    >
      <SidebarContent className="bg-sidebar-background" onClick={handleSidebarClick}>
        {/* Logo */}
        <div className="p-4 pt-8 border-b border-sidebar-border">
          {!collapsed ? (
            <img src={logo} alt="Sou Artista Admin" className="h-12 w-auto mx-auto" />
          ) : (
            <img src={logo} alt="Sou Artista Admin" className="h-8 w-auto mx-auto" />
          )}
        </div>

        {/* Admin Navigation */}
        <SidebarGroup className="mt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.url}
                      className={cn(
                        "flex items-center gap-2 relative transition-colors",
                        isActive(item.url)
                          ? "bg-sidebar-accent text-white font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                      onClick={() => {
                        if (isMobile) {
                          setOpenMobile(false);
                        }
                      }}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                      {item.showBadge && escalatedCount > 0 && !collapsed && (
                        <Badge className="ml-auto bg-orange-500 text-white text-xs px-1.5 py-0.5 h-5 min-w-5 flex items-center justify-center">
                          {escalatedCount}
                        </Badge>
                      )}
                      {item.showBadge && escalatedCount > 0 && collapsed && (
                        <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {escalatedCount > 9 ? '9+' : escalatedCount}
                        </span>
                      )}
                      {item.showDeletedBadge && deletedUsersCount > 0 && !collapsed && (
                        <Badge className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 h-5 min-w-5 flex items-center justify-center">
                          {deletedUsersCount}
                        </Badge>
                      )}
                      {item.showDeletedBadge && deletedUsersCount > 0 && collapsed && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {deletedUsersCount > 9 ? '9+' : deletedUsersCount}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout button */}
        <SidebarGroup className="mt-auto border-t border-sidebar-border pt-4">
          <SidebarGroupContent>
            <SidebarMenu>
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
