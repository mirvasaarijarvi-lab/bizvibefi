-- Founder badge to the three founders
INSERT INTO public.member_badges (user_id, badge_id, notes)
SELECT p.user_id, bc.id, 'Auto-awarded: founder backfill'
FROM public.profiles p
CROSS JOIN public.badge_catalog bc
WHERE bc.code = 'founder'
  AND p.display_name IN ('Minna Blomster','Mirva Saarijärvi','Vesa Mattila')
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- Welcome badge to all existing members
INSERT INTO public.member_badges (user_id, badge_id, notes)
SELECT p.user_id, bc.id, 'Auto-awarded: signin backfill'
FROM public.profiles p
CROSS JOIN public.badge_catalog bc
WHERE bc.code = 'signin_welcome'
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- Auto-award welcome badge to future signups via the existing handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  -- Welcome badge
  INSERT INTO public.member_badges (user_id, badge_id, notes)
  SELECT NEW.id, id, 'Auto-awarded on signup' FROM public.badge_catalog WHERE code = 'signin_welcome'
  ON CONFLICT (user_id, badge_id) DO NOTHING;

  RETURN NEW;
END;
$function$;