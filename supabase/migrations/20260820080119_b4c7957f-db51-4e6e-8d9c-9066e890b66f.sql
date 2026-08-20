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
      AND r.status = 'going'::rsvp_status
  )
  OR EXISTS (
    SELECT 1 FROM public.event_signups s
    WHERE s.event_id = event_presentations.event_id
      AND lower(s.email) = public.current_user_email()
  )
);