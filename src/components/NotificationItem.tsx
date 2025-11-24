import { useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  created_at: string;
}

interface NotificationItemProps {
  notification: Notification;
  isRead: boolean;
  onNotificationClick: (link: string | null) => void;
  onDelete: () => void;
}

export function NotificationItem({ 
  notification, 
  isRead, 
  onNotificationClick, 
  onDelete 
}: NotificationItemProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const itemRef = useRef<HTMLDivElement>(null);
  const SWIPE_THRESHOLD = 100;

  useEffect(() => {
    if (translateX <= -SWIPE_THRESHOLD) {
      // Auto-delete quando passa do threshold
      setTimeout(() => {
        onDelete();
      }, 200);
    }
  }, [translateX, onDelete]);

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    
    const diff = clientX - startX;
    // Só permite arrastar para a esquerda
    if (diff < 0) {
      setTranslateX(diff);
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    
    if (translateX < -SWIPE_THRESHOLD) {
      // Completa o swipe
      setTranslateX(-300);
    } else {
      // Volta para posição original
      setTranslateX(0);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const opacity = Math.max(0, Math.min(1, Math.abs(translateX) / SWIPE_THRESHOLD));
  const bgColor = translateX < -20 ? `rgba(239, 68, 68, ${opacity * 0.9})` : undefined;

  return (
    <div 
      ref={itemRef}
      className="relative overflow-hidden"
      onMouseLeave={handleEnd}
    >
      {/* Background vermelho de delete */}
      <div 
        className="absolute inset-0 flex items-center justify-end px-6 bg-red-500"
        style={{ opacity: opacity * 0.9 }}
      >
        <Trash2 className="w-5 h-5 text-white" />
      </div>

      {/* Conteúdo da notificação */}
      <div
        className={cn(
          "relative w-full p-4 text-left transition-all cursor-pointer",
          isRead ? "bg-white hover:bg-gray-50" : "bg-purple-50 hover:bg-purple-100",
          isDragging ? "transition-none" : "transition-transform duration-300 ease-out"
        )}
        style={{ 
          transform: `translateX(${translateX}px)`,
          backgroundColor: bgColor || undefined
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleEnd}
        onClick={(e) => {
          if (Math.abs(translateX) < 5) {
            onNotificationClick(notification.link);
          }
          e.stopPropagation();
        }}
      >
        <div className="flex items-start gap-3">
          {!isRead && (
            <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "font-semibold text-sm mb-1",
              translateX < -20 ? "text-white" : "text-gray-900"
            )}>
              {notification.title}
            </h4>
            <p className={cn(
              "text-xs line-clamp-2 mb-1",
              translateX < -20 ? "text-white/90" : "text-gray-600"
            )}>
              {notification.message}
            </p>
            <p className={cn(
              "text-xs",
              translateX < -20 ? "text-white/80" : "text-gray-500"
            )}>
              {new Date(notification.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
