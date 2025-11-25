-- Create table to store OTP codes
CREATE TABLE public.otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own OTP codes (needed for verification)
CREATE POLICY "Users can view own OTP codes"
ON public.otp_codes
FOR SELECT
USING (true);

-- Allow edge functions to insert OTP codes
CREATE POLICY "Service role can insert OTP codes"
ON public.otp_codes
FOR INSERT
WITH CHECK (true);

-- Allow edge functions to update OTP codes
CREATE POLICY "Service role can update OTP codes"
ON public.otp_codes
FOR UPDATE
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_otp_codes_email_code ON public.otp_codes(email, code);
CREATE INDEX idx_otp_codes_expires_at ON public.otp_codes(expires_at);