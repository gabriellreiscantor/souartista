-- Cria função para enviar push notification quando notificação é criada
CREATE OR REPLACE FUNCTION public.send_push_on_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Se created_by estiver preenchido, envia apenas para esse usuário
  -- Caso contrário, envia para todos os usuários (broadcast)
  IF NEW.created_by IS NOT NULL THEN
    target_user_id := NEW.created_by;
  END IF;

  -- Chama a edge function para enviar push notification
  -- Nota: Esta chamada será assíncrona via pg_net
  PERFORM
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'userId', target_user_id,
        'title', NEW.title,
        'body', NEW.message,
        'link', NEW.link
      )
    );

  RETURN NEW;
END;
$$;

-- Cria trigger que dispara após inserção de notificação
DROP TRIGGER IF EXISTS trigger_send_push_notification ON public.notifications;
CREATE TRIGGER trigger_send_push_notification
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.send_push_on_notification();