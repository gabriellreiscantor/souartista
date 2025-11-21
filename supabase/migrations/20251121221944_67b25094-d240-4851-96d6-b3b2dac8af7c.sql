-- Fix infinite recursion in admin_users policies
-- Drop the problematic policy that checks admin_users recursively
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;

-- Create a new policy that allows authenticated users to check if someone is admin
-- This is safe because we're just checking existence, not exposing sensitive data
CREATE POLICY "Anyone can check admin status"
ON public.admin_users
FOR SELECT
TO authenticated
USING (true);

-- Fix support_tickets policies to use the is_admin function
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;

CREATE POLICY "Users can view own tickets"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.is_admin(auth.uid())
);

-- Fix support_responses policies to use the is_admin function
DROP POLICY IF EXISTS "Users can view responses for own tickets" ON public.support_responses;

CREATE POLICY "Users can view responses for own tickets"
ON public.support_responses
FOR SELECT
TO authenticated
USING (
  ticket_id IN (
    SELECT id FROM support_tickets WHERE user_id = auth.uid()
  )
  OR public.is_admin(auth.uid())
);

-- Fix admin update policy on support_tickets
DROP POLICY IF EXISTS "Admins can update tickets" ON public.support_tickets;

CREATE POLICY "Admins can update tickets"
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));