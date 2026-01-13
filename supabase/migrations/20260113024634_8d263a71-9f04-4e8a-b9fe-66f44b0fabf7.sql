-- Add admin response columns to user_feedback table
ALTER TABLE public.user_feedback ADD COLUMN admin_response TEXT;
ALTER TABLE public.user_feedback ADD COLUMN responded_at TIMESTAMPTZ;