-- Criar tabela para controlar lembretes de assinatura enviados
CREATE TABLE IF NOT EXISTS public.subscription_reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('7_days', '5_days', '3_days', '1_day')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index para consultas rápidas
CREATE INDEX idx_subscription_reminder_logs_subscription ON public.subscription_reminder_logs(subscription_id);
CREATE INDEX idx_subscription_reminder_logs_user ON public.subscription_reminder_logs(user_id);
CREATE INDEX idx_subscription_reminder_logs_type ON public.subscription_reminder_logs(reminder_type);

-- RLS policies
ALTER TABLE public.subscription_reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert reminder logs"
  ON public.subscription_reminder_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own reminder logs"
  ON public.subscription_reminder_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reminder logs"
  ON public.subscription_reminder_logs
  FOR SELECT
  USING (is_admin(auth.uid()));