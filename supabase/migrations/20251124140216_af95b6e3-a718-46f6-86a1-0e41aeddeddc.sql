-- Add admin policies to profiles table
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

-- Add admin policies to user_roles table
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Add admin policy to shows table
CREATE POLICY "Admins can view all shows"
ON public.shows
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));