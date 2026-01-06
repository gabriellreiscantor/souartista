-- Add escalation columns to support_tickets
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS escalated_to_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS escalation_reason TEXT,
ADD COLUMN IF NOT EXISTS escalated_by UUID;

-- Create index for faster escalated tickets lookup
CREATE INDEX IF NOT EXISTS idx_support_tickets_escalated ON public.support_tickets(escalated_to_admin) WHERE escalated_to_admin = true;

-- Add RLS policy for support to view profiles (limited access)
CREATE POLICY "Support can view user profiles"
ON public.profiles
FOR SELECT
USING (is_support(auth.uid()));

-- Add RLS policy for support to view shows (without sensitive data - we'll filter in code)
CREATE POLICY "Support can view user shows"
ON public.shows
FOR SELECT
USING (is_support(auth.uid()));

-- Add RLS policy for support to view and update all tickets
CREATE POLICY "Support can view all tickets"
ON public.support_tickets
FOR SELECT
USING (is_support(auth.uid()));

CREATE POLICY "Support can update tickets"
ON public.support_tickets
FOR UPDATE
USING (is_support(auth.uid()));

-- Add RLS policy for support to insert responses
CREATE POLICY "Support can insert responses"
ON public.support_responses
FOR INSERT
WITH CHECK (is_support(auth.uid()));

-- Add RLS policy for support to view all responses
CREATE POLICY "Support can view all responses"
ON public.support_responses
FOR SELECT
USING (is_support(auth.uid()));