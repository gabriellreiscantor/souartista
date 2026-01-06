-- Add source column to push_notification_logs
ALTER TABLE push_notification_logs 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';

-- Create index for filtering by source
CREATE INDEX IF NOT EXISTS idx_push_logs_source ON push_notification_logs(source);