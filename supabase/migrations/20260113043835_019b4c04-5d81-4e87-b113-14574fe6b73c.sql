-- Tabela para registrar logs de backup
CREATE TABLE public.backup_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tables_copied INTEGER NOT NULL DEFAULT 0,
  records_copied INTEGER NOT NULL DEFAULT 0,
  files_copied INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  duration_seconds NUMERIC,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;

-- Política para admins verem logs
CREATE POLICY "Admins can view backup logs"
ON public.backup_logs
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Agendar backup diário às 3h da manhã (horário Brasil = 6h UTC)
SELECT cron.schedule(
  'database-backup-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://wjutvzmnvemrplpwbkyf.supabase.co/functions/v1/database-backup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('source', 'cron', 'timestamp', now()::text)
  ) AS request_id
  $$
);