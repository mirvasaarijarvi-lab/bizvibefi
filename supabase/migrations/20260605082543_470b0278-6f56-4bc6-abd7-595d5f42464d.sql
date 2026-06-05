-- Restrict events.online_url column from broad authenticated SELECT.
-- Only the creator, admins/superadmins, or users with a confirmed RSVP/signup can fetch it.
REVOKE SELECT (online_url) ON public.events FROM authenticated;

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

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.event_signups
    WHERE event_id = _event_id AND lower(email) = lower(v_email)
  ) THEN
    RETURN v_url;
  END IF;

  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_event_online_url(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_event_online_url(uuid) TO authenticated;