
select cron.schedule(
  'send-event-feedback-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://ztfbgbcevtrxdchbjeck.supabase.co/functions/v1/send-event-feedback',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZmJnYmNldnRyeGRjaGJqZWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNDQ0MjcsImV4cCI6MjA5MDkyMDQyN30.a_TpaWG8CRAXTsr4cHWZ4CNob7dJn9-LEdURd9uJOF8"}'::jsonb,
    body := concat('{"time":"', now(), '"}')::jsonb
  );
  $$
);
