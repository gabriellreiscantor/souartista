import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  created_at: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      setNotifications(data || []);
      setUnreadCount(data?.length || 0);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    }
  };

  const handleNotificationClick = (link: string | null) => {
    if (link) {
      window.open(link, '_blank');
    }
    setOpen(false);
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
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Notificações</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-gray-600 mt-1">
              {unreadCount} {unreadCount === 1 ? 'nova notificação' : 'novas notificações'}
            </p>
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
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif.link)}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
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
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
