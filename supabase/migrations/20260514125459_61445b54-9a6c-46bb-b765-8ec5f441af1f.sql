
-- =========================================================
-- 1) PROFILES: lock down contact info
-- =========================================================

-- Drop the wide-open public SELECT
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Owner can read full row
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

-- Admins can read full row
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Public-safe view that excludes contact_email/contact_phone entirely
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT
  id,
  user_id,
  display_name,
  avatar_url,
  bio,
  company,
  company_url,
  linkedin_url,
  website_links,
  membership_tier,
  vibetor_type,
  profile_visibility,
  created_at,
  updated_at
FROM public.profiles;

-- Allow anyone to read the safe view
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Provide a SECURITY DEFINER function so the safe view bypasses base-table RLS for public browsing
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
  profile_visibility jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, user_id, display_name, avatar_url, bio, company, company_url,
         linkedin_url, website_links, membership_tier, vibetor_type,
         profile_visibility, created_at, updated_at
  FROM public.profiles WHERE user_id = _user_id
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
  profile_visibility jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, user_id, display_name, avatar_url, bio, company, company_url,
         linkedin_url, website_links, membership_tier, vibetor_type,
         profile_visibility, created_at, updated_at
  FROM public.profiles
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_profiles() TO anon, authenticated;

-- =========================================================
-- 2) COURSE_CERTIFICATES: restrict SELECT, expose verify RPC
-- =========================================================

DROP POLICY IF EXISTS "Anyone can view certificates" ON public.course_certificates;

CREATE POLICY "Owners and admins can view certificates"
ON public.course_certificates FOR SELECT
USING (
  auth.uid() = participant_user_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

-- Public verification by id (returns a single row of safe verification fields)
CREATE OR REPLACE FUNCTION public.verify_certificate(_id uuid)
RETURNS TABLE (
  id uuid,
  course_id uuid,
  course_title text,
  course_content text,
  participant_name text,
  participant_user_id uuid,
  method course_method,
  method_details text,
  completion_date date,
  issued_by_name text,
  pdf_url text,
  created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, course_id, course_title, course_content, participant_name,
         participant_user_id, method, method_details, completion_date,
         issued_by_name, pdf_url, created_at
  FROM public.course_certificates
  WHERE id = _id
$$;

GRANT EXECUTE ON FUNCTION public.verify_certificate(uuid) TO anon, authenticated;

-- =========================================================
-- 3) SHOWCASE-FILES storage: protect admin/* folder
-- =========================================================

-- Block non-admin writes into the admin/ folder
DROP POLICY IF EXISTS "Only admins can write to showcase-files admin folder" ON storage.objects;
CREATE POLICY "Only admins can write to showcase-files admin folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id <> 'showcase-files'
  OR (storage.foldername(name))[1] <> 'admin'
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

DROP POLICY IF EXISTS "Only admins can update showcase-files admin folder" ON storage.objects;
CREATE POLICY "Only admins can update showcase-files admin folder"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id <> 'showcase-files'
  OR (storage.foldername(name))[1] <> 'admin'
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

DROP POLICY IF EXISTS "Only admins can delete showcase-files admin folder" ON storage.objects;
CREATE POLICY "Only admins can delete showcase-files admin folder"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id <> 'showcase-files'
  OR (storage.foldername(name))[1] <> 'admin'
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

-- =========================================================
-- 4) VIBETOR_APPLICATIONS: require auth + bind to user_id
-- =========================================================

DROP POLICY IF EXISTS "Anyone can submit vibetor applications" ON public.vibetor_applications;

CREATE POLICY "Authenticated users can submit applications"
ON public.vibetor_applications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- 5) Revoke EXECUTE on internal trigger/helper functions
-- =========================================================

REVOKE EXECUTE ON FUNCTION public.prevent_showcase_status_escalation() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_badge_claim_changes() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_award_on_approval() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_reply_count() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_reply_count() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_vibetor_tier() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_award_course_badge() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_profile_changes() FROM anon, authenticated;
