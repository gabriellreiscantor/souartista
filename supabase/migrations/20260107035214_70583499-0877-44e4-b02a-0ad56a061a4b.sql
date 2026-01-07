-- Add gender column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN gender text NULL;

COMMENT ON COLUMN public.profiles.gender IS 'User gender: male or female';