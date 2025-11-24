-- Criar tabela para rastrear notificações lidas
CREATE TABLE public.notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_id)
);

-- Habilitar RLS
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own reads"
ON public.notification_reads
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reads"
ON public.notification_reads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reads"
ON public.notification_reads
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_notification_reads_user_id ON public.notification_reads(user_id);
CREATE INDEX idx_notification_reads_notification_id ON public.notification_reads(notification_id);