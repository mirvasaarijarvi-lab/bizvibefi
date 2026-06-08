-- 1. Add columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS viber_started_at date,
  ADD COLUMN IF NOT EXISTS viber_ends_at date;

-- 2. Update has_viber_access: expired Viber loses access (label stays)
CREATE OR REPLACE FUNCTION public.has_viber_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id
      AND (
        membership_tier::text = 'vibetor'
        OR viber_access_override = true
        OR (
          membership_tier::text = 'viber'
          AND (viber_ends_at IS NULL OR viber_ends_at >= CURRENT_DATE)
        )
      )
  )
$function$;

-- 3. Protect new fields: only admins/superadmins can change
CREATE OR REPLACE FUNCTION public.protect_membership_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin boolean := has_role(auth.uid(), 'admin'::app_role)
                      OR has_role(auth.uid(), 'superadmin'::app_role);
BEGIN
  IF NOT is_admin THEN
    IF NEW.membership_tier IS DISTINCT FROM OLD.membership_tier THEN
      RAISE EXCEPTION 'Only admins can change membership_tier';
    END IF;
    IF NEW.viber_access_override IS DISTINCT FROM OLD.viber_access_override THEN
      RAISE EXCEPTION 'Only admins can change viber_access_override';
    END IF;
    IF NEW.vibetor_type IS DISTINCT FROM OLD.vibetor_type THEN
      RAISE EXCEPTION 'Only admins can change vibetor_type';
    END IF;
    IF NEW.viber_started_at IS DISTINCT FROM OLD.viber_started_at THEN
      RAISE EXCEPTION 'Only admins can change viber_started_at';
    END IF;
    IF NEW.viber_ends_at IS DISTINCT FROM OLD.viber_ends_at THEN
      RAISE EXCEPTION 'Only admins can change viber_ends_at';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. Audit log Viber window changes
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.membership_tier IS DISTINCT FROM NEW.membership_tier THEN
    INSERT INTO public.audit_log (performed_by, target_user_id, action, old_value, new_value)
    VALUES (auth.uid(), NEW.user_id, 'tier_change', OLD.membership_tier::text, NEW.membership_tier::text);
  END IF;

  IF OLD.viber_access_override IS DISTINCT FROM NEW.viber_access_override THEN
    INSERT INTO public.audit_log (performed_by, target_user_id, action, old_value, new_value)
    VALUES (auth.uid(), NEW.user_id, 'viber_access_override', OLD.viber_access_override::text, NEW.viber_access_override::text);
  END IF;

  IF OLD.vibetor_type IS DISTINCT FROM NEW.vibetor_type THEN
    INSERT INTO public.audit_log (performed_by, target_user_id, action, old_value, new_value)
    VALUES (auth.uid(), NEW.user_id, 'vibetor_type_change', COALESCE(OLD.vibetor_type::text, 'none'), COALESCE(NEW.vibetor_type::text, 'none'));
  END IF;

  IF OLD.viber_started_at IS DISTINCT FROM NEW.viber_started_at THEN
    INSERT INTO public.audit_log (performed_by, target_user_id, action, old_value, new_value)
    VALUES (auth.uid(), NEW.user_id, 'viber_started_at', COALESCE(OLD.viber_started_at::text, ''), COALESCE(NEW.viber_started_at::text, ''));
  END IF;

  IF OLD.viber_ends_at IS DISTINCT FROM NEW.viber_ends_at THEN
    INSERT INTO public.audit_log (performed_by, target_user_id, action, old_value, new_value)
    VALUES (auth.uid(), NEW.user_id, 'viber_ends_at', COALESCE(OLD.viber_ends_at::text, ''), COALESCE(NEW.viber_ends_at::text, ''));
  END IF;

  RETURN NEW;
END;
$function$;