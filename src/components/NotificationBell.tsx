import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { NotificationItem } from '@/components/NotificationItem';

interface Notification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
  const [hiddenNotificationIds, setHiddenNotificationIds] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    // Quando abrir o dropdown, marca todas como lidas
    if (open && user && unreadCount > 0) {
      markAllAsRead();
    }
  }, [open, user, unreadCount]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      // Buscar created_at do usuário
      const { data: profileData } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', user.id)
        .single();

      const userCreatedAt = profileData?.created_at;

      // Buscar role do usuário
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const userRole = roleData?.role;

      // Buscar notificações: specific to this user OR broadcast matching role OR broadcast for all
      const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${user.id},and(user_id.is.null,target_role.eq.${userRole}),and(user_id.is.null,target_role.is.null)`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (notifError) throw notifError;

      // Filtrar notificações broadcast antigas (criadas antes do cadastro do usuário)
      const filteredNotifs = (notifData || []).filter(n => {
        // Se for notificação específica para o usuário, sempre incluir
        if (n.user_id === user.id) return true;
        
        // Se for broadcast E usuário tem created_at, filtrar por data
        if (!n.user_id && userCreatedAt) {
          return new Date(n.created_at) >= new Date(userCreatedAt);
        }
        
        // Caso padrão: incluir
        return true;
      });

      // Buscar quais foram lidas pelo usuário
      const { data: readsData, error: readsError } = await supabase
        .from('notification_reads')
        .select('notification_id')
        .eq('user_id', user.id);

      if (readsError) throw readsError;

      // Buscar quais foram ocultas pelo usuário
      const { data: hiddenData, error: hiddenError } = await supabase
        .from('notification_hidden')
        .select('notification_id')
        .eq('user_id', user.id);

      if (hiddenError) throw hiddenError;

      const readIds = new Set(readsData?.map(r => r.notification_id) || []);
      const hiddenIds = new Set(hiddenData?.map(h => h.notification_id) || []);
      
      setReadNotificationIds(readIds);
      setHiddenNotificationIds(hiddenIds);
      
      // Filtrar notificações ocultas
      const visibleNotifications = filteredNotifs.filter(n => !hiddenIds.has(n.id));
      setNotifications(visibleNotifications);
      
      // Contar não lidas (apenas das visíveis)
      const unread = visibleNotifications.filter(n => !readIds.has(n.id)).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      // Criar registros de leitura para todas as notificações não lidas
      const unreadNotifs = notifications.filter(n => !readNotificationIds.has(n.id));
      
      if (unreadNotifs.length === 0) return;

      const reads = unreadNotifs.map(n => ({
        user_id: user.id,
        notification_id: n.id
      }));

      const { error } = await supabase
        .from('notification_reads')
        .insert(reads);

      if (error) throw error;

      // Atualizar estado local
      const newReadIds = new Set(readNotificationIds);
      unreadNotifs.forEach(n => newReadIds.add(n.id));
      setReadNotificationIds(newReadIds);
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar como lidas:', error);
    }
  };

  const handleClearAll = async () => {
    if (!user || notifications.length === 0) return;

    try {
      // Marcar todas as notificações visíveis como ocultas
      const toHide = notifications.map(n => ({
        user_id: user.id,
        notification_id: n.id
      }));

      const { error } = await supabase
        .from('notification_hidden')
        .insert(toHide);

      if (error) throw error;

      // Limpar estado local - todas ocultas
      setNotifications([]);
      setUnreadCount(0);
      setOpen(false);
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  };

  const handleNotificationClick = (link: string | null) => {
    if (!link) return;
    
    // Detectar se é link interno ou externo
    const isInternalLink = link.startsWith('/');
    
    if (isInternalLink) {
      // Link interno: navega dentro do app (mesma janela)
      navigate(link);
    } else {
      // Link externo: abre em nova aba
      window.open(link, '_blank');
    }
    
    // Fecha o dropdown
    setOpen(false);
  };

  const handleHideNotification = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notification_hidden')
        .insert({
          user_id: user.id,
          notification_id: notificationId
        });

      if (error) throw error;

      // Atualizar estado local
      const newHiddenIds = new Set(hiddenNotificationIds);
      newHiddenIds.add(notificationId);
      setHiddenNotificationIds(newHiddenIds);
      
      // Remover das notificações visíveis
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      setNotifications(updatedNotifications);
      
      // Atualizar contagem de não lidas
      if (!readNotificationIds.has(notificationId)) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erro ao ocultar notificação:', error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative">
          <Bell className="w-5 h-5 text-gray-900" />
          {unreadCount > 0 && (
            <span className={cn(
              "absolute -top-1 -right-1 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold text-xs",
              unreadCount < 10 ? "w-5 h-5" : "w-6 h-5 px-1"
            )}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 md:w-80 p-0 bg-white border border-gray-200 z-50 shadow-lg" 
        align="end" 
        side="bottom" 
        sideOffset={8}
        alignOffset={0}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Notificações</h3>
            {notifications.length > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                {notifications.length} {notifications.length === 1 ? 'notificação' : 'notificações'}
              </p>
            )}
          </div>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            >
              <X className="w-4 h-4 mr-1" />
              Limpar tudo
            </Button>
          )}
        </div>
        
        <div className="max-h-[320px] overflow-y-auto overflow-x-hidden">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-500">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  isRead={readNotificationIds.has(notif.id)}
                  onNotificationClick={handleNotificationClick}
                  onDelete={() => handleHideNotification(notif.id)}
                />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
