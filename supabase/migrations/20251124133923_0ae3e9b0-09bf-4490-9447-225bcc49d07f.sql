-- Remove admin incorreto
DELETE FROM public.admin_users WHERE user_id = 'eafbbe58-2506-4c5d-9cc0-8de55a66f4a1';

-- Buscar o user_id correto do email ghabriellreis@gmail.com
-- Primeiro, vamos garantir que existe um trigger para adicionar admin automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verifica se o email é o admin email
  IF NEW.email = 'ghabriellreis@gmail.com' THEN
    -- Insere na tabela admin_users
    INSERT INTO public.admin_users (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_admin();

-- Adicionar campo plan_purchased_at na tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan_purchased_at timestamp with time zone;