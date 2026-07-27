
-- Fix 1: Restrict "Admins can view all profiles" policy to authenticated role
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Fix 2: Require verified email ownership before an event_signups row can grant
-- presentation metadata access. Add a RESTRICTIVE policy on event_signups so
-- authenticated users cannot register under someone else's email address, and
-- tighten the presentations SELECT policy to only trust signups whose email
-- matches a verified auth.users entry owned by the current user.

DROP POLICY IF EXISTS "Signup email must match verified auth email" ON public.event_signups;
CREATE POLICY "Signup email must match verified auth email"
ON public.event_signups
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  lower(email) = public.current_user_email()
);

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
    SELECT 1
    FROM public.event_signups s
    JOIN auth.users u
      ON lower(u.email) = lower(s.email)
     AND u.email_confirmed_at IS NOT NULL
    WHERE s.event_id = event_presentations.event_id
      AND u.id = auth.uid()
      AND lower(s.email) = public.current_user_email()
  )
);
