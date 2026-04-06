
-- Audit log table
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  performed_by uuid NOT NULL,
  target_user_id uuid NOT NULL,
  action text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins/superadmins can view
CREATE POLICY "Admins can view audit log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Insert allowed for authenticated (trigger runs as SECURITY DEFINER but we also allow direct inserts)
CREATE POLICY "System can insert audit log"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- Trigger to auto-log tier changes and viber_access_override changes
CREATE OR REPLACE FUNCTION public.log_profile_changes()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.membership_tier IS DISTINCT FROM NEW.membership_tier THEN
    INSERT INTO public.audit_log (performed_by, target_user_id, action, old_value, new_value)
    VALUES (auth.uid(), NEW.user_id, 'tier_change', OLD.membership_tier::text, NEW.membership_tier::text);
  END IF;

  IF OLD.viber_access_override IS DISTINCT FROM NEW.viber_access_override THEN
    INSERT INTO public.audit_log (performed_by, target_user_id, action, old_value, new_value)
    VALUES (auth.uid(), NEW.user_id, 'viber_access_override', OLD.viber_access_override::text, NEW.viber_access_override::text);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_profile_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_changes();
