
-- 1. Revoke column-level SELECT on events.online_url from anon/authenticated
REVOKE SELECT (online_url) ON public.events FROM anon, authenticated;

-- 2. Tighten event_presentations SELECT: authenticated only (no anon)
DROP POLICY IF EXISTS "Anyone can view presentation metadata for published past events" ON public.event_presentations;
CREATE POLICY "Authenticated can view presentation metadata for published past events"
  ON public.event_presentations FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.events e
            WHERE e.id = event_presentations.event_id
              AND e.is_published = true
              AND e.starts_at < now())
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'superadmin'::app_role)
    OR EXISTS (SELECT 1 FROM public.events e
               WHERE e.id = event_presentations.event_id
                 AND e.created_by = auth.uid())
  );

-- 3. Restrict audit_log INSERT to service_role (triggers are SECURITY DEFINER so still work)
DROP POLICY IF EXISTS "System can insert audit log" ON public.audit_log;
CREATE POLICY "System can insert audit log"
  ON public.audit_log FOR INSERT
  TO service_role
  WITH CHECK (true);
