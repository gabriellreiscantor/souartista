-- Tabela para registrar tentativas de login TOTP admin
CREATE TABLE public.admin_totp_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    success BOOLEAN DEFAULT false
);

-- Index para busca rápida por user_id e tempo
CREATE INDEX idx_admin_totp_attempts_user_time 
ON public.admin_totp_attempts(user_id, attempted_at DESC);

-- RLS: ninguém pode acessar diretamente (apenas service role)
ALTER TABLE public.admin_totp_attempts ENABLE ROW LEVEL SECURITY;

-- Função para limpar tentativas antigas (mais de 24h)
CREATE OR REPLACE FUNCTION cleanup_old_totp_attempts()
RETURNS void AS $$
BEGIN
    DELETE FROM public.admin_totp_attempts 
    WHERE attempted_at < now() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;