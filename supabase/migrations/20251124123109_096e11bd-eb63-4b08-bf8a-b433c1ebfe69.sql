-- Add duration_hours field to shows table
ALTER TABLE public.shows 
ADD COLUMN duration_hours numeric DEFAULT 3;