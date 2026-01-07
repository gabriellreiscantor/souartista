CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    name,
    cpf,
    phone,
    birth_date,
    photo_url,
    status_plano,
    is_verified,
    gender
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'cpf',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'birth_date',
    NEW.raw_user_meta_data->>'photo_url',
    COALESCE(NEW.raw_user_meta_data->>'status_plano', 'inactive'),
    COALESCE((NEW.raw_user_meta_data->>'is_verified')::boolean, false),
    NEW.raw_user_meta_data->>'gender'
  );
  
  RETURN NEW;
END;
$function$