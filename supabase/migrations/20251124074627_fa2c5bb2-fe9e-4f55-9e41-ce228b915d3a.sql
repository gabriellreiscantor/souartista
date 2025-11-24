-- Drop the public policy that exposes admin users
DROP POLICY IF EXISTS "Anyone can check admin status" ON public.admin_users;

-- Add policy that allows authenticated users to check only their own admin status
-- This prevents enumeration attacks while still allowing legitimate checks
CREATE POLICY "Users can check own admin status"
ON public.admin_users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Note: Admin checks should primarily use the is_admin() function
-- which is already a SECURITY DEFINER function that doesn't expose the list