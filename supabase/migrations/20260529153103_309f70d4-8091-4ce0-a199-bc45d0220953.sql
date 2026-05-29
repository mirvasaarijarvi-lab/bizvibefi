
DROP POLICY IF EXISTS "Anon can create notifications" ON public.admin_notifications;
CREATE POLICY "Anon can create notifications"
ON public.admin_notifications
FOR INSERT
TO anon
WITH CHECK (
  length(COALESCE(title, '')) BETWEEN 1 AND 200
  AND length(COALESCE(message, '')) BETWEEN 1 AND 500
  AND type IN ('contact', 'vibetor_request', 'general')
  AND (sender_email IS NULL OR length(sender_email) <= 254)
  AND (sender_name IS NULL OR length(sender_name) <= 100)
);

DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.admin_notifications;
CREATE POLICY "Authenticated users can create notifications"
ON public.admin_notifications
FOR INSERT
TO authenticated
WITH CHECK (
  length(COALESCE(title, '')) BETWEEN 1 AND 200
  AND length(COALESCE(message, '')) BETWEEN 1 AND 5000
  AND type IN ('contact', 'vibetor_request', 'general')
  AND (sender_email IS NULL OR length(sender_email) <= 254)
  AND (sender_name IS NULL OR length(sender_name) <= 100)
);
