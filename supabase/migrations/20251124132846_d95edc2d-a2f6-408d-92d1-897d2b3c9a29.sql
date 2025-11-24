-- Add 'support' role to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'support';

-- Create notifications table for broadcast notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can create notifications
CREATE POLICY "Admins can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- Policy: All authenticated users can view notifications
CREATE POLICY "Users can view notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (true);

-- Add last_seen_at column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index on last_seen_at for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen_at ON public.profiles(last_seen_at DESC);