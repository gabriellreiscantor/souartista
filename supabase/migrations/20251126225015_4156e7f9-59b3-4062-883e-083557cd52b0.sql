-- Remove o trigger que não vai funcionar adequadamente
DROP TRIGGER IF EXISTS trigger_send_push_notification ON public.notifications;
DROP FUNCTION IF EXISTS public.send_push_on_notification();