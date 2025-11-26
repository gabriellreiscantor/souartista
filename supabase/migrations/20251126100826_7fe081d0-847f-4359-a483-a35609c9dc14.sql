-- Drop old function and create new one with credit card notifications
DROP FUNCTION IF EXISTS public.check_and_notify_pix_due();

CREATE OR REPLACE FUNCTION public.check_and_notify_payments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  subscription_record RECORD;
  days_until_due INTEGER;
BEGIN
  -- Loop through all active subscriptions
  FOR subscription_record IN 
    SELECT s.*, p.id as profile_id
    FROM subscriptions s
    JOIN profiles p ON s.user_id = p.id
    WHERE s.status IN ('active', 'pending')
    AND s.next_due_date IS NOT NULL
  LOOP
    days_until_due := EXTRACT(DAY FROM (subscription_record.next_due_date - CURRENT_DATE));
    
    -- PIX Notifications (7 days, today, 1 day overdue)
    IF subscription_record.payment_method = 'PIX' AND subscription_record.status = 'active' THEN
      IF days_until_due = 7 THEN
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
    END IF;
    
    -- Credit Card Trial Ending Notification (2 days before)
    IF subscription_record.payment_method = 'CREDIT_CARD' AND subscription_record.status = 'pending' THEN
      IF days_until_due = 2 THEN
        IF NOT EXISTS (
          SELECT 1 FROM notifications 
          WHERE created_by = subscription_record.profile_id 
          AND title LIKE '%período de teste%'
          AND created_at > CURRENT_DATE - INTERVAL '3 days'
        ) THEN
          INSERT INTO public.notifications (title, message, link, created_by)
          VALUES (
            '⏰ Seu período de teste termina em 2 dias',
            'Seu teste gratuito de 7 dias está acabando. Após isso, sua cobrança será automática.',
            '/artist/subscription',
            subscription_record.profile_id
          );
        END IF;
      END IF;
    END IF;
    
  END LOOP;
END;
$$;