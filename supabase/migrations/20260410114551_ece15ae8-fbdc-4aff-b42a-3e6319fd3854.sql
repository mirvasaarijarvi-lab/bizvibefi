
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

  RETURN NEW;
END;
$function$;
