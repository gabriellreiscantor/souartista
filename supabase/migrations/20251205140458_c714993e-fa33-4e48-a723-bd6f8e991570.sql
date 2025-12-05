-- Drop the insecure policy that allows anyone to view all OTP codes
DROP POLICY IF EXISTS "Users can view own OTP codes" ON public.otp_codes;

-- Create a secure policy that only allows users to view their own OTP codes
CREATE POLICY "Users can view own OTP codes" 
ON public.otp_codes 
FOR SELECT 
USING (email = (auth.jwt() ->> 'email'));