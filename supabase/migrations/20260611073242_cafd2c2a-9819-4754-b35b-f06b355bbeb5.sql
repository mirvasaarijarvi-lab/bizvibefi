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
    JOIN auth.users u ON lower(u.email) = lower(s.email)
    WHERE s.event_id = event_presentations.event_id
      AND u.id = auth.uid()
  )
);