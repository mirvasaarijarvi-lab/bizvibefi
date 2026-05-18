
-- 1) Replace always-true INSERT policies with minimal validation

DROP POLICY IF EXISTS "Anon can create notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.admin_notifications;

CREATE POLICY "Anon can create notifications"
ON public.admin_notifications
FOR INSERT TO anon
WITH CHECK (
  length(coalesce(title, '')) BETWEEN 1 AND 200
  AND length(coalesce(message, '')) BETWEEN 1 AND 5000
);

CREATE POLICY "Authenticated users can create notifications"
ON public.admin_notifications
FOR INSERT TO authenticated
WITH CHECK (
  length(coalesce(title, '')) BETWEEN 1 AND 200
  AND length(coalesce(message, '')) BETWEEN 1 AND 5000
);

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe"
ON public.newsletter_subscribers
FOR INSERT
WITH CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

-- 2) Revoke EXECUTE on trigger-only SECURITY DEFINER functions.
-- These are invoked by Postgres triggers, never by clients, so revoking
-- EXECUTE from PUBLIC/anon/authenticated does not affect behavior.
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()            FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_profile_changes()                 FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_award_course_badge()             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_award_on_approval()              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_vibetor_tier()                FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_showcase_status_escalation()  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_reply_count()               FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_reply_count()               FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_badge_claim_changes()           FROM PUBLIC, anon, authenticated;
