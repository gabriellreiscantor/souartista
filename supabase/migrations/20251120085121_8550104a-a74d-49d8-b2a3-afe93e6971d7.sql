-- Popular perfis para usuários existentes que não tem perfil
INSERT INTO public.profiles (id, email, name, status_plano, is_verified)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', ''),
  'inactive',
  false
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;