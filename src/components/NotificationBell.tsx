import { useEffect, useState } from 'react';
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

interface Notification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
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
      // Buscar notificações
      const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (notifError) throw notifError;

      // Buscar quais foram lidas pelo usuário
      const { data: readsData, error: readsError } = await supabase
        .from('notification_reads')
        .select('notification_id')
        .eq('user_id', user.id);

      if (readsError) throw readsError;

      const readIds = new Set(readsData?.map(r => r.notification_id) || []);
      setReadNotificationIds(readIds);
      setNotifications(notifData || []);
      
      // Contar não lidas
      const unread = (notifData || []).filter(n => !readIds.has(n.id)).length;
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
    if (!user) return;

    try {
      // Deletar todos os registros de leitura do usuário
      const { error } = await supabase
        .from('notification_reads')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      // Limpar estado local
      setReadNotificationIds(new Set());
      setUnreadCount(notifications.length);
      setOpen(false);
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  };

  const handleNotificationClick = (link: string | null) => {
    if (link) {
      window.open(link, '_blank');
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
      <PopoverContent className="w-80 md:w-96 p-0 bg-white border border-gray-200 z-50" align="end">
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
        
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notif) => {
                const isRead = readNotificationIds.has(notif.id);
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif.link)}
                    className={cn(
                      "w-full p-4 text-left transition-colors",
                      isRead ? "bg-white hover:bg-gray-50" : "bg-purple-50 hover:bg-purple-100"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {!isRead && (
                        <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-gray-900 mb-1">
                          {notif.title}
                        </h4>
                        <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(notif.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
