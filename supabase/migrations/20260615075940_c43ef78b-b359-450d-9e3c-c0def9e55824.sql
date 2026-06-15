-- 1) Drop the overly broad past-event SELECT policy on event_presentations.
-- Replace with an admin/creator-only direct-read policy; attendees keep
-- their existing attendee-scoped policy, and non-attendees must go
-- through the signed-URL edge function (which uses get_event_online_url
-- and the presentation_access_log audit).
DROP POLICY IF EXISTS "Authenticated can view presentation metadata for published past"
  ON public.event_presentations;

CREATE POLICY "Admins and creators can read presentation metadata"
  ON public.event_presentations
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'superadmin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_presentations.event_id
        AND e.created_by = auth.uid()
    )
  );


-- 2) Harden the showcase_items owner-update path. The trigger already
-- blocked status/rejection_reason changes by non-admins; extend it to
-- also block ownership reassignment (user_id) and type escalation
-- (e.g. flipping a regular item to 'lead' to bypass the Viber gate).
CREATE OR REPLACE FUNCTION public.prevent_showcase_status_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin boolean := has_role(auth.uid(), 'admin'::app_role)
                      OR has_role(auth.uid(), 'superadmin'::app_role);
BEGIN
  IF is_admin THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
    RAISE EXCEPTION 'Only admins can change showcase status or rejection reason';
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Only admins can reassign showcase item ownership';
  END IF;

  -- Type escalation: owners cannot turn a regular item into a 'lead'
  -- on UPDATE (the INSERT WITH CHECK already enforces this on create).
  IF NEW.type IS DISTINCT FROM OLD.type
     AND NEW.type::text = 'lead' THEN
    RAISE EXCEPTION 'Only admins can change a showcase item type to lead';
  END IF;

  RETURN NEW;
END;
$function$;