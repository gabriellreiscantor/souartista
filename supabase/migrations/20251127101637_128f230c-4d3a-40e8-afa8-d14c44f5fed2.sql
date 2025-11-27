-- Remove existing foreign keys
ALTER TABLE public.user_feedback
DROP CONSTRAINT IF EXISTS user_feedback_user_id_fkey;

ALTER TABLE public.user_feedback
DROP CONSTRAINT IF EXISTS user_feedback_reviewed_by_fkey;

-- Add correct foreign key constraints pointing to profiles table
ALTER TABLE public.user_feedback
ADD CONSTRAINT user_feedback_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

ALTER TABLE public.user_feedback
ADD CONSTRAINT user_feedback_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;