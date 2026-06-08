SELECT cron.schedule(
  'send-viber-expiry-reminders-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ztfbgbcevtrxdchbjeck.supabase.co/functions/v1/send-viber-expiry-reminders',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='email_queue_service_role_key')
    ),
    body := jsonb_build_object('time', now())
  );
  $$
);