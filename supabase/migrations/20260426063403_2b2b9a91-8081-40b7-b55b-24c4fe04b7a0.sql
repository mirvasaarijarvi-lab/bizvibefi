
-- 1) Lock down audit_log inserts: only triggers (SECURITY DEFINER) should write.
DROP POLICY IF EXISTS "System can insert audit log" ON public.audit_log;

-- 2) Restrict user_roles SELECT: users see own row; admins/superadmins see all.
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- 3) Profiles contact data exposure: revoke anon and public access to sensitive
--    contact columns (column-level privileges). RLS still controls row visibility,
--    but anon/public roles can no longer SELECT contact_email or contact_phone.
REVOKE SELECT (contact_email, contact_phone) ON public.profiles FROM anon;
REVOKE SELECT (contact_email, contact_phone) ON public.profiles FROM PUBLIC;

-- Authenticated users still need to see contact fields (app honors profile_visibility
-- on the client). Ensure the grant exists explicitly for authenticated.
GRANT SELECT (contact_email, contact_phone) ON public.profiles TO authenticated;

-- 4) Showcase items: prevent users from self-approving by changing status or
--    rejection_reason. Use a trigger that blocks non-admin status edits.
CREATE OR REPLACE FUNCTION public.prevent_showcase_status_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.status IS DISTINCT FROM OLD.status
      OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason) THEN
    IF NOT (has_role(auth.uid(), 'admin'::app_role)
            OR has_role(auth.uid(), 'superadmin'::app_role)) THEN
      RAISE EXCEPTION 'Only admins can change showcase status or rejection reason';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_showcase_status_escalation ON public.showcase_items;
CREATE TRIGGER trg_prevent_showcase_status_escalation
BEFORE UPDATE ON public.showcase_items
FOR EACH ROW
EXECUTE FUNCTION public.prevent_showcase_status_escalation();

-- 5) Realtime: remove admin_notifications from realtime publication so
--    contact-form submissions are not broadcast to all authenticated subscribers.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'admin_notifications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.admin_notifications';
  END IF;
END$$;
