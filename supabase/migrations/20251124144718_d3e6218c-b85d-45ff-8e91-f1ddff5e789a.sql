-- Criar tabela para rastrear notificações ocultas/excluídas por usuário
CREATE TABLE public.notification_hidden (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  hidden_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_id)
);

-- Habilitar RLS
ALTER TABLE public.notification_hidden ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own hidden notifications"
ON public.notification_hidden
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can hide own notifications"
ON public.notification_hidden
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_notification_hidden_user_id ON public.notification_hidden(user_id);
CREATE INDEX idx_notification_hidden_notification_id ON public.notification_hidden(notification_id);