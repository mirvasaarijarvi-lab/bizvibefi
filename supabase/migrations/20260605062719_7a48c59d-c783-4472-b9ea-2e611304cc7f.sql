
-- 1) Tighten badge_claims UPDATE: add WITH CHECK preventing claimants from modifying status / reviewed fields
DROP POLICY IF EXISTS "Update own or peer or admin" ON public.badge_claims;
CREATE POLICY "Update own or peer or admin"
ON public.badge_claims
FOR UPDATE
TO authenticated
USING (
  ((auth.uid() = user_id) AND (status = ANY (ARRAY['pending_peer'::badge_claim_status, 'pending_review'::badge_claim_status])))
  OR (auth.uid() = peer_user_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
  OR (
    -- Non-admins: cannot change status to approved/rejected, cannot set reviewer fields,
    -- cannot clear rejection_reason except via peer flow handled by guard trigger.
    status = ANY (ARRAY['pending_peer'::badge_claim_status, 'pending_review'::badge_claim_status])
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
  )
);

-- 2) Dedupe event_signups and enforce uniqueness on (event_id, lower(email))
DELETE FROM public.event_signups a
USING public.event_signups b
WHERE a.event_id = b.event_id
  AND lower(a.email) = lower(b.email)
  AND a.created_at > b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS event_signups_event_email_unique
  ON public.event_signups (event_id, lower(email));

-- 3) Hide online_url from anonymous visitors on published events
DROP POLICY IF EXISTS "Anyone can view published events" ON public.events;

CREATE POLICY "Anon can view published events (no online_url)"
ON public.events
FOR SELECT
TO anon
USING (is_published = true);

CREATE POLICY "Authenticated can view published events"
ON public.events
FOR SELECT
TO authenticated
USING (is_published = true);

REVOKE SELECT (online_url) ON public.events FROM anon;
