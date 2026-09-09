REVOKE SELECT ON public.email_send_state FROM anon;
REVOKE ALL ON public.email_send_state FROM anon;
REVOKE SELECT ON public.email_send_state FROM authenticated;
GRANT SELECT ON public.email_send_state TO authenticated;
GRANT ALL ON public.email_send_state TO service_role;

DROP POLICY IF EXISTS "Admins can view email send state" ON public.email_send_state;
CREATE POLICY "Admins can view email send state"
ON public.email_send_state
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));