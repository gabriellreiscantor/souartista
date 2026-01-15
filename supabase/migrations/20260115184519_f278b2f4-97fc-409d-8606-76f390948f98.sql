-- Table to track pending user reminders (prevents spam)
CREATE TABLE public.pending_user_reminder_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reminder_type text NOT NULL, -- '1_day', '3_days', '7_days'
  sent_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, reminder_type)
);

-- Enable RLS
ALTER TABLE public.pending_user_reminder_logs ENABLE ROW LEVEL SECURITY;

-- Policy for service role access (edge functions)
CREATE POLICY "Service role can manage pending user reminder logs"
  ON public.pending_user_reminder_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_pending_user_reminder_logs_user_id ON public.pending_user_reminder_logs(user_id);
CREATE INDEX idx_pending_user_reminder_logs_reminder_type ON public.pending_user_reminder_logs(reminder_type);