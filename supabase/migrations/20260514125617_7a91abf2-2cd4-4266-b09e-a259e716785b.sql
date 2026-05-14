
DROP FUNCTION IF EXISTS public.get_public_profile(uuid);
DROP FUNCTION IF EXISTS public.list_public_profiles();
DROP VIEW IF EXISTS public.profiles_public;

CREATE OR REPLACE FUNCTION public.get_public_profile(_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  bio text,
  company text,
  company_url text,
  linkedin_url text,
  website_links jsonb,
  membership_tier membership_tier,
  vibetor_type vibetor_type,
  viber_access_override boolean,
  profile_visibility jsonb,
  contact_email text,
  contact_phone text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    p.id, p.user_id, p.display_name, p.avatar_url, p.bio, p.company,
    p.company_url, p.linkedin_url, p.website_links, p.membership_tier,
    p.vibetor_type, p.viber_access_override, p.profile_visibility,
    CASE
      WHEN auth.uid() = p.user_id
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'superadmin'::app_role)
        OR COALESCE((p.profile_visibility->>'contact_email')::boolean, true)
      THEN p.contact_email ELSE NULL
    END AS contact_email,
    CASE
      WHEN auth.uid() = p.user_id
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'superadmin'::app_role)
        OR COALESCE((p.profile_visibility->>'contact_phone')::boolean, true)
      THEN p.contact_phone ELSE NULL
    END AS contact_phone,
    p.created_at, p.updated_at
  FROM public.profiles p
  WHERE p.user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.list_public_profiles()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  bio text,
  company text,
  company_url text,
  linkedin_url text,
  website_links jsonb,
  membership_tier membership_tier,
  vibetor_type vibetor_type,
  viber_access_override boolean,
  profile_visibility jsonb,
  contact_email text,
  contact_phone text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    p.id, p.user_id, p.display_name, p.avatar_url, p.bio, p.company,
    p.company_url, p.linkedin_url, p.website_links, p.membership_tier,
    p.vibetor_type, p.viber_access_override, p.profile_visibility,
    CASE
      WHEN auth.uid() = p.user_id
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'superadmin'::app_role)
        OR COALESCE((p.profile_visibility->>'contact_email')::boolean, true)
      THEN p.contact_email ELSE NULL
    END AS contact_email,
    CASE
      WHEN auth.uid() = p.user_id
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'superadmin'::app_role)
        OR COALESCE((p.profile_visibility->>'contact_phone')::boolean, true)
      THEN p.contact_phone ELSE NULL
    END AS contact_phone,
    p.created_at, p.updated_at
  FROM public.profiles p
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_profiles() TO anon, authenticated;
