-- Tabela para controlar quais dicas já foram enviadas para cada usuário
CREATE TABLE public.engagement_tip_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tip_id TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_engagement_tip_logs_user_id ON public.engagement_tip_logs(user_id);
CREATE INDEX idx_engagement_tip_logs_sent_at ON public.engagement_tip_logs(sent_at);
CREATE UNIQUE INDEX idx_engagement_tip_logs_user_tip ON public.engagement_tip_logs(user_id, tip_id);

-- Enable RLS
ALTER TABLE public.engagement_tip_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Service role can manage engagement logs"
ON public.engagement_tip_logs
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view own engagement logs"
ON public.engagement_tip_logs
FOR SELECT
USING (auth.uid() = user_id);