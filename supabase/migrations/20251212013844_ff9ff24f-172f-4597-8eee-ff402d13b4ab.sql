-- Adicionar constraint UNIQUE para prevenir duplicatas de notificações de shows
ALTER TABLE show_notification_logs 
ADD CONSTRAINT unique_show_user_notification_type 
UNIQUE (show_id, user_id, notification_type);