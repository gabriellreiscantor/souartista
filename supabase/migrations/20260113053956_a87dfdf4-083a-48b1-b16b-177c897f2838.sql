-- Adicionar campo para rastrear trial estendido concedido
ALTER TABLE public.referrals 
ADD COLUMN IF NOT EXISTS extended_trial_granted BOOLEAN DEFAULT FALSE;

-- Comentário explicativo
COMMENT ON COLUMN public.referrals.extended_trial_granted IS 'Indica se o usuário indicado já recebeu o benefício de trial estendido (14 dias ao invés de 7)';