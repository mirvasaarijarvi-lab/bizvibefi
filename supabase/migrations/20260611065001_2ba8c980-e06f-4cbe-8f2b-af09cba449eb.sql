SELECT cron.schedule(
  'send-feedback-june10-oneoff',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ztfbgbcevtrxdchbjeck.supabase.co/functions/v1/send-event-feedback?eventId=e4bf8bb5-1394-4a30-aac6-ab78f08ab2dd',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='email_queue_service_role_key')
    ),
    body := jsonb_build_object('time', now()),
    timeout_milliseconds := 120000
  );
  $$
);