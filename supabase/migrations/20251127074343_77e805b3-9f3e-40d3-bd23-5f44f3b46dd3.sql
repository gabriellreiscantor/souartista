-- Adicionar campo user_id na tabela notifications para notificações específicas
ALTER TABLE public.notifications
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Comentário: 
-- user_id = NULL: notificação broadcast (para todos)
-- user_id = específico: notificação apenas para aquele usuário

-- Criar índice para melhorar performance de queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);

COMMENT ON COLUMN public.notifications.user_id IS 'ID do usuário específico. NULL = broadcast para todos';
