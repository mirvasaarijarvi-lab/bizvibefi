CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Remove existing job if present (idempotent)
DO $$
BEGIN
  PERFORM cron.unschedule('send-event-reminders-hourly');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'send-event-reminders-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ztfbgbcevtrxdchbjeck.supabase.co/functions/v1/send-event-reminders',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZmJnYmNldnRyeGRjaGJqZWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNDQ0MjcsImV4cCI6MjA5MDkyMDQyN30.a_TpaWG8CRAXTsr4cHWZ4CNob7dJn9-LEdURd9uJOF8"}'::jsonb,
    body := jsonb_build_object('time', now())
  );
  $$
);