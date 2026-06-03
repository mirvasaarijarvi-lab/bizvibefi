DROP POLICY IF EXISTS "Event creator and superadmins can view guest signups" ON public.event_signups;
CREATE POLICY "Admins and superadmins can view guest signups"
ON public.event_signups
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

DROP POLICY IF EXISTS "Event creator and superadmins can delete guest signups" ON public.event_signups;
CREATE POLICY "Admins and superadmins can delete guest signups"
ON public.event_signups
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));