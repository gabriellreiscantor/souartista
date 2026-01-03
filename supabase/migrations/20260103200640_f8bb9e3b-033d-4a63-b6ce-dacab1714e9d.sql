-- Create table for marketing notification logs
CREATE TABLE public.marketing_notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'conversion' or 'engagement'
  message_id TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_notification_logs ENABLE ROW LEVEL SECURITY;

-- Service role can manage logs
CREATE POLICY "Service role can manage marketing logs"
ON public.marketing_notification_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- Users can view own logs
CREATE POLICY "Users can view own marketing logs"
ON public.marketing_notification_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for efficient queries
CREATE INDEX idx_marketing_logs_user_sent ON public.marketing_notification_logs(user_id, sent_at DESC);
CREATE INDEX idx_marketing_logs_sent_at ON public.marketing_notification_logs(sent_at DESC);