-- Adicionar políticas RLS para garantir que usuários anônimos não podem acessar dados sensíveis
-- Estas políticas são uma camada adicional de segurança

-- profiles: Garantir que apenas usuários autenticados podem acessar
CREATE POLICY "Block anonymous access to profiles" 
ON public.profiles 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- payment_history: Garantir que apenas usuários autenticados podem acessar
CREATE POLICY "Block anonymous access to payment_history" 
ON public.payment_history 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- subscriptions: Garantir que apenas usuários autenticados podem acessar
CREATE POLICY "Block anonymous access to subscriptions" 
ON public.subscriptions 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- otp_codes: Garantir que apenas usuários autenticados podem acessar SELECT
-- (INSERT/UPDATE já são restritos ao service role)
CREATE POLICY "Block anonymous select on otp_codes" 
ON public.otp_codes 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- support_tickets: Garantir que apenas usuários autenticados podem acessar
CREATE POLICY "Block anonymous access to support_tickets" 
ON public.support_tickets 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- user_devices: Garantir que apenas usuários autenticados podem acessar
CREATE POLICY "Block anonymous access to user_devices" 
ON public.user_devices 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- support_responses: Garantir que apenas usuários autenticados podem acessar
CREATE POLICY "Block anonymous access to support_responses" 
ON public.support_responses 
FOR ALL 
USING (auth.uid() IS NOT NULL);