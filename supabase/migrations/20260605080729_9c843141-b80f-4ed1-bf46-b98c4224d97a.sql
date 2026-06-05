
GRANT SELECT ON public.email_send_log TO authenticated;

CREATE POLICY "Admins can read send log"
ON public.email_send_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'superadmin'::app_role));

CREATE INDEX IF NOT EXISTS email_send_log_created_at_idx ON public.email_send_log (created_at DESC);
CREATE INDEX IF NOT EXISTS email_send_log_metadata_batch_idx ON public.email_send_log ((metadata->>'batch_id'));
