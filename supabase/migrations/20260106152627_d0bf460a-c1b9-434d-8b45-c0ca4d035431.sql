-- 1. Criar tabela de backup de FCM tokens
CREATE TABLE public.fcm_token_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_id text NOT NULL,
  platform text NOT NULL,
  device_name text,
  fcm_token text NOT NULL,
  action text NOT NULL, -- 'created', 'updated', 'deleted'
  old_token text, -- token anterior (em caso de update)
  created_at timestamptz DEFAULT now()
);

-- Índice para buscas por usuário
CREATE INDEX idx_fcm_history_user ON public.fcm_token_history(user_id);
CREATE INDEX idx_fcm_history_created ON public.fcm_token_history(created_at DESC);

-- RLS para fcm_token_history
ALTER TABLE public.fcm_token_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view token history" 
ON public.fcm_token_history FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Service can insert token history" 
ON public.fcm_token_history FOR INSERT 
WITH CHECK (true);

-- 2. Criar função de backup automático
CREATE OR REPLACE FUNCTION public.backup_fcm_token()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.fcm_token IS NOT NULL THEN
    INSERT INTO public.fcm_token_history (user_id, device_id, platform, device_name, fcm_token, action)
    VALUES (NEW.user_id, NEW.device_id, NEW.platform, NEW.device_name, NEW.fcm_token, 'created');
  ELSIF TG_OP = 'UPDATE' AND OLD.fcm_token IS DISTINCT FROM NEW.fcm_token AND NEW.fcm_token IS NOT NULL THEN
    INSERT INTO public.fcm_token_history (user_id, device_id, platform, device_name, fcm_token, action, old_token)
    VALUES (NEW.user_id, NEW.device_id, NEW.platform, NEW.device_name, NEW.fcm_token, 'updated', OLD.fcm_token);
  ELSIF TG_OP = 'DELETE' AND OLD.fcm_token IS NOT NULL THEN
    INSERT INTO public.fcm_token_history (user_id, device_id, platform, device_name, fcm_token, action)
    VALUES (OLD.user_id, OLD.device_id, OLD.platform, OLD.device_name, OLD.fcm_token, 'deleted');
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Criar trigger para backup automático
CREATE TRIGGER trg_backup_fcm_token
AFTER INSERT OR UPDATE OR DELETE ON public.user_devices
FOR EACH ROW EXECUTE FUNCTION public.backup_fcm_token();

-- 4. Criar tabela de logs de push notifications
CREATE TABLE public.push_notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid,
  user_id uuid NOT NULL,
  device_id text,
  platform text,
  fcm_token_preview text, -- primeiros 20 chars do token
  title text NOT NULL,
  body text NOT NULL,
  status text NOT NULL, -- 'sent', 'failed', 'invalid_token'
  error_message text,
  error_code text,
  response_data jsonb,
  sent_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_push_logs_user ON public.push_notification_logs(user_id);
CREATE INDEX idx_push_logs_status ON public.push_notification_logs(status);
CREATE INDEX idx_push_logs_sent_at ON public.push_notification_logs(sent_at DESC);

-- RLS para push_notification_logs
ALTER TABLE public.push_notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view push logs" 
ON public.push_notification_logs FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Service can insert push logs" 
ON public.push_notification_logs FOR INSERT 
WITH CHECK (true);

-- 5. Fazer backup dos tokens existentes
INSERT INTO public.fcm_token_history (user_id, device_id, platform, device_name, fcm_token, action)
SELECT user_id, device_id, platform, device_name, fcm_token, 'backup_existing'
FROM public.user_devices
WHERE fcm_token IS NOT NULL;