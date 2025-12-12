-- Drop and recreate the welcome notification function to set user_id correctly
CREATE OR REPLACE FUNCTION public.send_welcome_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (title, message, link, user_id, created_by)
  VALUES (
    'Bem-vindo ao Sou Artista! 🎉',
    'Estamos felizes em ter você aqui! Explore todas as funcionalidades e organize suas apresentações.',
    '/select-role',
    NEW.id,  -- Set user_id to the new user so only THEY see this notification
    NEW.id
  );
  
  RETURN NEW;
END;
$$;

-- Also fix the return notification function
CREATE OR REPLACE FUNCTION public.send_return_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  days_since_last_seen INTEGER;
BEGIN
  IF OLD.last_seen_at IS NOT NULL THEN
    days_since_last_seen := EXTRACT(DAY FROM (NEW.last_seen_at - OLD.last_seen_at));
    
    IF days_since_last_seen >= 7 THEN
      INSERT INTO public.notifications (title, message, link, user_id, created_by)
      VALUES (
        'Que bom te ver aqui! 👋',
        'Sentimos sua falta! Veja as novidades e continue organizando suas apresentações.',
        '/app-hub',
        NEW.id,  -- Set user_id to the specific user
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;