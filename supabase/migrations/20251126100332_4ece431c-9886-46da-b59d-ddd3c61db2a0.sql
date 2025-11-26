-- Criar função para enviar notificação de boas-vindas
CREATE OR REPLACE FUNCTION send_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir notificação de boas-vindas
  INSERT INTO public.notifications (title, message, link, created_by)
  VALUES (
    'Bem-vindo ao Sou Artista! 🎉',
    'Estamos felizes em ter você aqui! Explore todas as funcionalidades e organize suas apresentações.',
    '/select-role',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para notificação de boas-vindas
DROP TRIGGER IF EXISTS on_user_welcome_notification ON public.profiles;
CREATE TRIGGER on_user_welcome_notification
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_notification();

-- Criar função para notificação de retorno (última vez vista há mais de 7 dias)
CREATE OR REPLACE FUNCTION send_return_notification()
RETURNS TRIGGER AS $$
DECLARE
  days_since_last_seen INTEGER;
BEGIN
  -- Calcular dias desde última visita
  IF OLD.last_seen_at IS NOT NULL THEN
    days_since_last_seen := EXTRACT(DAY FROM (NEW.last_seen_at - OLD.last_seen_at));
    
    -- Se passou mais de 7 dias, enviar notificação de "bom te ver aqui"
    IF days_since_last_seen >= 7 THEN
      INSERT INTO public.notifications (title, message, link, created_by)
      VALUES (
        'Que bom te ver aqui! 👋',
        'Sentimos sua falta! Veja as novidades e continue organizando suas apresentações.',
        '/app-hub',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para notificação de retorno
DROP TRIGGER IF EXISTS on_user_return_notification ON public.profiles;
CREATE TRIGGER on_user_return_notification
  AFTER UPDATE OF last_seen_at ON public.profiles
  FOR EACH ROW
  WHEN (OLD.last_seen_at IS DISTINCT FROM NEW.last_seen_at)
  EXECUTE FUNCTION send_return_notification();

-- Criar função para verificar e enviar notificações de vencimento PIX
CREATE OR REPLACE FUNCTION check_and_notify_pix_due()
RETURNS void AS $$
DECLARE
  subscription_record RECORD;
  days_until_due INTEGER;
BEGIN
  -- Buscar todas as assinaturas PIX ativas
  FOR subscription_record IN 
    SELECT s.*, p.id as profile_id
    FROM subscriptions s
    JOIN profiles p ON s.user_id = p.id
    WHERE s.payment_method = 'PIX' 
    AND s.status = 'active'
    AND s.next_due_date IS NOT NULL
  LOOP
    -- Calcular dias até vencimento
    days_until_due := EXTRACT(DAY FROM (subscription_record.next_due_date - CURRENT_DATE));
    
    -- Notificação 7 dias antes
    IF days_until_due = 7 THEN
      -- Verificar se já não enviou essa notificação
      IF NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE created_by = subscription_record.profile_id 
        AND title LIKE '%7 dias%'
        AND created_at > CURRENT_DATE - INTERVAL '8 days'
      ) THEN
        INSERT INTO public.notifications (title, message, link, created_by)
        VALUES (
          '⏰ Pagamento vence em 7 dias',
          'Seu pagamento PIX vence em 7 dias. Não se esqueça de realizar o pagamento para manter seu acesso.',
          '/artist/subscription',
          subscription_record.profile_id
        );
      END IF;
    END IF;
    
    -- Notificação no dia do vencimento
    IF days_until_due = 0 THEN
      IF NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE created_by = subscription_record.profile_id 
        AND title LIKE '%vence hoje%'
        AND created_at::date = CURRENT_DATE
      ) THEN
        INSERT INTO public.notifications (title, message, link, created_by)
        VALUES (
          '🚨 Seu pagamento vence hoje!',
          'Seu pagamento PIX vence hoje! Realize o pagamento agora para não perder acesso.',
          '/artist/subscription',
          subscription_record.profile_id
        );
      END IF;
    END IF;
    
    -- Notificação de pagamento atrasado (1 dia após vencimento)
    IF days_until_due = -1 THEN
      IF NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE created_by = subscription_record.profile_id 
        AND title LIKE '%venceu%'
        AND created_at > CURRENT_DATE - INTERVAL '2 days'
      ) THEN
        INSERT INTO public.notifications (title, message, link, created_by)
        VALUES (
          '❌ Seu pagamento venceu!',
          'Seu pagamento PIX está atrasado! Pague agora para não perder acesso às funcionalidades premium.',
          '/artist/subscription',
          subscription_record.profile_id
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;