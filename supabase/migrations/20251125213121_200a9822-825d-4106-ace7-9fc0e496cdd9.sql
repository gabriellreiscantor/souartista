-- Add plan_type column to profiles table to differentiate between monthly and annual plans
ALTER TABLE public.profiles 
ADD COLUMN plan_type text CHECK (plan_type IN ('monthly', 'annual'));

-- Add index for better query performance
CREATE INDEX idx_profiles_plan_type ON public.profiles(plan_type);