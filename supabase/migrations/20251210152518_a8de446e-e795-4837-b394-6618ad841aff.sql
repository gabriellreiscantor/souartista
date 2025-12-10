-- Remover políticas antigas que permitem leitura de OTP codes via API do cliente
DROP POLICY IF EXISTS "Users can view own OTP codes" ON public.otp_codes;
DROP POLICY IF EXISTS "Block anonymous select on otp_codes" ON public.otp_codes;

-- Nova política: Bloquear TODOS os SELECTs via API do cliente
-- OTP codes só devem ser lidos pelo service_role no backend
CREATE POLICY "Block all client SELECT on otp_codes"
ON public.otp_codes
FOR SELECT
USING (false);

-- Manter políticas de INSERT e UPDATE para service_role (já existem e funcionam)