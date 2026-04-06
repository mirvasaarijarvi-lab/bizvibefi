
ALTER TABLE public.profiles ADD COLUMN viber_access_override boolean NOT NULL DEFAULT false;

-- Update has_viber_access to also check the override flag
CREATE OR REPLACE FUNCTION public.has_viber_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id
      AND (membership_tier::text IN ('viber', 'vibetor') OR viber_access_override = true)
  )
$$;
