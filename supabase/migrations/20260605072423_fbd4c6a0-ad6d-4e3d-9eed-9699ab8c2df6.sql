-- Remove anonymous direct INSERT capability on admin_notifications.
-- The contact form now goes through the submit-contact-message edge function,
-- which validates input + honeypot and inserts via the service role.
DROP POLICY IF EXISTS "Anon can create notifications" ON public.admin_notifications;