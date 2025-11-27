-- Adicionar coluna target_role na tabela notifications para filtrar por role
ALTER TABLE public.notifications 
ADD COLUMN target_role text CHECK (target_role IN ('artist', 'musician'));