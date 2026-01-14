-- Tabela para armazenar secrets TOTP dos admins
CREATE TABLE public.admin_totp_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  totp_secret TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Ninguém lê via app (só via Edge Function com service_role)
ALTER TABLE public.admin_totp_secrets ENABLE ROW LEVEL SECURITY;

-- Nenhuma policy = acesso apenas via service_role