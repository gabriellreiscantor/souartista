-- Adiciona coluna fcm_token na tabela profiles para armazenar tokens FCM
ALTER TABLE public.profiles
ADD COLUMN fcm_token TEXT NULL;

-- Cria índice para melhorar performance de buscas por token
CREATE INDEX idx_profiles_fcm_token ON public.profiles(fcm_token) WHERE fcm_token IS NOT NULL;