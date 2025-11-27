-- Create app_updates table for managing app updates
CREATE TABLE public.app_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  release_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.app_updates ENABLE ROW LEVEL SECURITY;

-- Everyone can view published updates
CREATE POLICY "Anyone can view published updates"
ON public.app_updates
FOR SELECT
USING (is_published = true);

-- Admins can manage all updates
CREATE POLICY "Admins can insert updates"
ON public.app_updates
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update updates"
ON public.app_updates
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete updates"
ON public.app_updates
FOR DELETE
USING (is_admin(auth.uid()));

-- Create payment_history table for tracking subscription payments
CREATE TABLE public.payment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount NUMERIC NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'overdue', 'failed')),
  payment_method TEXT,
  asaas_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Users can view own payment history
CREATE POLICY "Users can view own payment history"
ON public.payment_history
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all payment history
CREATE POLICY "Admins can view all payment history"
ON public.payment_history
FOR SELECT
USING (is_admin(auth.uid()));

-- Service role can insert payment history
CREATE POLICY "Service role can insert payment history"
ON public.payment_history
FOR INSERT
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX idx_payment_history_subscription_id ON public.payment_history(subscription_id);