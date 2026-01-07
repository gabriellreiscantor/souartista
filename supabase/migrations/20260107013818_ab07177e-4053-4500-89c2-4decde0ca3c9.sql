-- Add timezone column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo';

-- Add timezone column to user_devices table
ALTER TABLE public.user_devices ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo';

-- Update existing records to have a default timezone
UPDATE public.profiles SET timezone = 'America/Sao_Paulo' WHERE timezone IS NULL;
UPDATE public.user_devices SET timezone = 'America/Sao_Paulo' WHERE timezone IS NULL;