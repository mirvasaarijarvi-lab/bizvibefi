
-- Safe helper: returns the signed-in user's email from the JWT claims.
-- Avoids RLS policies needing direct SELECT on auth.users (which authenticated role lacks),
-- which is exactly what previously caused presentations to 403 for everyone.
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(coalesce(
    nullif(auth.jwt() ->> 'email', ''),
    (SELECT email FROM auth.users WHERE id = auth.uid())
  ));
$$;

REVOKE ALL ON FUNCTION public.current_user_email() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated, service_role;

-- Rewrite the attendee policy to use the helper (no direct auth.users join).
DROP POLICY IF EXISTS "Attendees can read presentations metadata" ON public.event_presentations;

CREATE POLICY "Attendees can read presentations metadata"
ON public.event_presentations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.event_rsvps r
    WHERE r.event_id = event_presentations.event_id
      AND r.user_id = auth.uid()
      AND r.status = 'going'
  )
  OR EXISTS (
    SELECT 1 FROM public.event_signups s
    WHERE s.event_id = event_presentations.event_id
      AND lower(s.email) = public.current_user_email()
  )
);

-- Reuse the helper in get_event_online_url for consistency.
CREATE OR REPLACE FUNCTION public.get_event_online_url(_event_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
  v_creator uuid;
  v_email text;
BEGIN
  SELECT online_url, created_by INTO v_url, v_creator
  FROM public.events WHERE id = _event_id;

  IF v_url IS NULL THEN RETURN NULL; END IF;
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;

  IF auth.uid() = v_creator
     OR has_role(auth.uid(), 'admin'::app_role)
     OR has_role(auth.uid(), 'superadmin'::app_role) THEN
    RETURN v_url;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.event_rsvps
    WHERE event_id = _event_id AND user_id = auth.uid() AND status = 'going'
  ) THEN
    RETURN v_url;
  END IF;

  v_email := public.current_user_email();
  IF v_email IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.event_signups
    WHERE event_id = _event_id AND lower(email) = v_email
  ) THEN
    RETURN v_url;
  END IF;

  RETURN NULL;
END;
$$;
