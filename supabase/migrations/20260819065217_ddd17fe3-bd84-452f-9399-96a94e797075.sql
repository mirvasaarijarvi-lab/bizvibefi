-- Members can submit events (drafts); admins can manage and publish
CREATE POLICY "Members can create their own events"
ON public.events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can view all events"
ON public.events FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update events"
ON public.events FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete events"
ON public.events FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.enforce_event_publish_permission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin boolean := has_role(auth.uid(), 'admin'::app_role)
                      OR has_role(auth.uid(), 'superadmin'::app_role);
BEGIN
  IF is_admin THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.is_published := false;
  ELSE
    NEW.is_published := COALESCE(OLD.is_published, false);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_event_publish_permission ON public.events;
CREATE TRIGGER trg_enforce_event_publish_permission
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.enforce_event_publish_permission();