-- Drop the potentially ineffective anonymous block policy
DROP POLICY IF EXISTS "Block all anonymous access to profiles" ON public.profiles;

-- Drop existing SELECT policies to recreate them more securely
DROP POLICY IF EXISTS "Authenticated users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate SELECT policy for users viewing their own profile (requires authentication)
CREATE POLICY "Authenticated users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Recreate SELECT policy for admins (requires authentication)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (is_admin(auth.uid()));