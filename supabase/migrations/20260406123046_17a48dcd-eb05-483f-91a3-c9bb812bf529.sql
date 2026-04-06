
CREATE OR REPLACE FUNCTION public.protect_vibetor_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If membership_tier is being changed to vibetor, only allow admins/superadmins
  IF NEW.membership_tier::text = 'vibetor' AND OLD.membership_tier::text != 'vibetor' THEN
    IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)) THEN
      RAISE EXCEPTION 'Only admins can assign vibetor status';
    END IF;
  END IF;
  -- If membership_tier is being changed FROM vibetor, only allow admins/superadmins
  IF OLD.membership_tier::text = 'vibetor' AND NEW.membership_tier::text != 'vibetor' THEN
    IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)) THEN
      RAISE EXCEPTION 'Only admins can change vibetor status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_vibetor_tier_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_vibetor_tier();

-- Allow admins to update any profile's membership_tier
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));
