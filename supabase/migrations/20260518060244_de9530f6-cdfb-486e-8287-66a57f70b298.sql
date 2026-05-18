
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;

CREATE POLICY "Superadmins can insert events"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Superadmins can update events"
ON public.events
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Superadmins can delete events"
ON public.events
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Superadmins can view all events"
ON public.events
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role));
