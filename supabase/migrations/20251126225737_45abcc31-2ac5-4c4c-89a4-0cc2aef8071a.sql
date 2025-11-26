-- Cria tabela para rastrear notificações enviadas
CREATE TABLE IF NOT EXISTS public.show_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('7_days', '1_day', 'today', '3_hours')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(show_id, user_id, notification_type)
);

-- Habilita RLS
ALTER TABLE public.show_notification_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Apenas service role pode inserir (via edge function)
CREATE POLICY "Service role can insert logs"
ON public.show_notification_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy: Users podem ver seus próprios logs
CREATE POLICY "Users can view own logs"
ON public.show_notification_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_show_notification_logs_show_id ON public.show_notification_logs(show_id);
CREATE INDEX idx_show_notification_logs_user_id ON public.show_notification_logs(user_id);
CREATE INDEX idx_show_notification_logs_type ON public.show_notification_logs(notification_type);