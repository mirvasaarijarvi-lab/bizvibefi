
SELECT cron.unschedule('send-event-reminders-hourly');
SELECT cron.unschedule('send-event-feedback-hourly');

SELECT cron.schedule(
  'send-event-reminders-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ztfbgbcevtrxdchbjeck.supabase.co/functions/v1/send-event-reminders',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='email_queue_service_role_key')
    ),
    body := jsonb_build_object('time', now())
  );
  $$
);

SELECT cron.schedule(
  'send-event-feedback-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ztfbgbcevtrxdchbjeck.supabase.co/functions/v1/send-event-feedback',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='email_queue_service_role_key')
    ),
    body := jsonb_build_object('time', now())
  );
  $$
);
