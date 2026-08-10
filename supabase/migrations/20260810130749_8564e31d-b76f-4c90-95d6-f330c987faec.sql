-- Post type enum
DO $$ BEGIN
  CREATE TYPE public.recruitment_post_type AS ENUM ('open_position','training','seeking_work');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.recruitment_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type public.recruitment_post_type NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  organization text,
  location text,
  is_remote boolean NOT NULL DEFAULT false,
  employment_type text,
  apply_url text,
  apply_email text,
  allow_contact_request boolean NOT NULL DEFAULT true,
  tags text[] NOT NULL DEFAULT '{}',
  status public.approval_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  expires_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.recruitment_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recruitment_posts TO authenticated;
GRANT ALL ON public.recruitment_posts TO service_role;

ALTER TABLE public.recruitment_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved recruitment posts are public"
  ON public.recruitment_posts FOR SELECT
  USING (status = 'approved'::approval_status);

CREATE POLICY "Users can view their own recruitment posts"
  ON public.recruitment_posts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all recruitment posts"
  ON public.recruitment_posts FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role));

CREATE POLICY "Users can create their own recruitment posts"
  ON public.recruitment_posts FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      status = 'pending'::approval_status
      OR has_role(auth.uid(),'admin'::app_role)
      OR has_role(auth.uid(),'superadmin'::app_role)
    )
  );

CREATE POLICY "Users can update their own recruitment posts"
  ON public.recruitment_posts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any recruitment post"
  ON public.recruitment_posts FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role));

CREATE POLICY "Users can delete their own recruitment posts"
  ON public.recruitment_posts FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR has_role(auth.uid(),'admin'::app_role)
    OR has_role(auth.uid(),'superadmin'::app_role)
  );

-- Prevent non-admins from self-approving
CREATE OR REPLACE FUNCTION public.prevent_recruitment_status_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin boolean := has_role(auth.uid(),'admin'::app_role)
                      OR has_role(auth.uid(),'superadmin'::app_role);
BEGIN
  IF is_admin THEN RETURN NEW; END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
    RAISE EXCEPTION 'Only admins can change recruitment post status';
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Only admins can reassign recruitment post ownership';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_recruitment_status_escalation
  BEFORE UPDATE ON public.recruitment_posts
  FOR EACH ROW EXECUTE FUNCTION public.prevent_recruitment_status_escalation();

CREATE TRIGGER update_recruitment_posts_updated_at
  BEFORE UPDATE ON public.recruitment_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_recruitment_posts_status_created
  ON public.recruitment_posts (status, created_at DESC);

-- Profile skills fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS skills_summary text,
  ADD COLUMN IF NOT EXISTS open_to_work boolean NOT NULL DEFAULT false;

-- Expose new profile fields via the public profile RPCs
DROP FUNCTION IF EXISTS public.get_public_profile(uuid);
DROP FUNCTION IF EXISTS public.list_public_profiles();

CREATE OR REPLACE FUNCTION public.get_public_profile(_user_id uuid)
 RETURNS TABLE(id uuid, user_id uuid, display_name text, avatar_url text, bio text, company text, company_url text, linkedin_url text, website_links jsonb, membership_tier membership_tier, vibetor_type vibetor_type, viber_access_override boolean, profile_visibility jsonb, contact_email text, contact_phone text, ai_skills text[], skills_summary text, open_to_work boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    p.id, p.user_id, p.display_name, p.avatar_url,
    CASE WHEN auth.uid() = p.user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role)
         OR COALESCE((p.profile_visibility->>'bio')::boolean, true) THEN p.bio ELSE NULL END AS bio,
    CASE WHEN auth.uid() = p.user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role)
         OR COALESCE((p.profile_visibility->>'company')::boolean, true) THEN p.company ELSE NULL END AS company,
    CASE WHEN auth.uid() = p.user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role)
         OR COALESCE((p.profile_visibility->>'company')::boolean, true) THEN p.company_url ELSE NULL END AS company_url,
    CASE WHEN auth.uid() = p.user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role)
         OR COALESCE((p.profile_visibility->>'linkedin_url')::boolean, true) THEN p.linkedin_url ELSE NULL END AS linkedin_url,
    CASE WHEN auth.uid() = p.user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role)
         OR COALESCE((p.profile_visibility->>'website_links')::boolean, true) THEN p.website_links ELSE '[]'::jsonb END AS website_links,
    p.membership_tier, p.vibetor_type, p.viber_access_override, p.profile_visibility,
    CASE WHEN auth.uid() = p.user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role)
         OR COALESCE((p.profile_visibility->>'contact_email')::boolean, true) THEN p.contact_email ELSE NULL END AS contact_email,
    CASE WHEN auth.uid() = p.user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role)
         OR COALESCE((p.profile_visibility->>'contact_phone')::boolean, true) THEN p.contact_phone ELSE NULL END AS contact_phone,
    CASE WHEN auth.uid() = p.user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role)
         OR COALESCE((p.profile_visibility->>'ai_skills')::boolean, true) THEN p.ai_skills ELSE '{}'::text[] END AS ai_skills,
    CASE WHEN auth.uid() = p.user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role)
         OR COALESCE((p.profile_visibility->>'ai_skills')::boolean, true) THEN p.skills_summary ELSE NULL END AS skills_summary,
    p.open_to_work,
    p.created_at, p.updated_at
  FROM public.profiles p
  WHERE p.user_id = _user_id
$function$;

CREATE OR REPLACE FUNCTION public.list_public_profiles()
 RETURNS TABLE(id uuid, user_id uuid, display_name text, avatar_url text, bio text, company text, company_url text, linkedin_url text, website_links jsonb, membership_tier membership_tier, vibetor_type vibetor_type, viber_access_override boolean, profile_visibility jsonb, contact_email text, contact_phone text, ai_skills text[], skills_summary text, open_to_work boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    p.id, p.user_id, p.display_name, p.avatar_url,
    CASE WHEN auth.uid() = p.user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role)
         OR COALESCE((p.profile_visibility->>'bio')::boolean, true) THEN p.bio ELSE NULL END AS bio,
    CASE WHEN auth.uid() = p.user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role)
         OR COALESCE((p.profile_visibility->>'company')::boolean, true) THEN p.company ELSE NULL END AS company,
    CASE WHEN auth.uid() = p.user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role)
         OR COALESCE((p.profile_visibility->>'company')::boolean, true) THEN p.company_url ELSE NULL END AS company_url,
    CASE WHEN auth.uid() = p.user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role)
         OR COALESCE((p.profile_visibility->>'linkedin_url')::boolean, true) THEN p.linkedin_url ELSE NULL END AS linkedin_url,
    CASE WHEN auth.uid() = p.user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role)
         OR COALESCE((p.profile_visibility->>'website_links')::boolean, true) THEN p.website_links ELSE '[]'::jsonb END AS website_links,
    p.membership_tier, p.vibetor_type, p.viber_access_override, p.profile_visibility,
    CASE WHEN auth.uid() = p.user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role)
         OR COALESCE((p.profile_visibility->>'contact_email')::boolean, true) THEN p.contact_email ELSE NULL END AS contact_email,
    CASE WHEN auth.uid() = p.user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role)
         OR COALESCE((p.profile_visibility->>'contact_phone')::boolean, true) THEN p.contact_phone ELSE NULL END AS contact_phone,
    CASE WHEN auth.uid() = p.user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role)
         OR COALESCE((p.profile_visibility->>'ai_skills')::boolean, true) THEN p.ai_skills ELSE '{}'::text[] END AS ai_skills,
    CASE WHEN auth.uid() = p.user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role)
         OR COALESCE((p.profile_visibility->>'ai_skills')::boolean, true) THEN p.skills_summary ELSE NULL END AS skills_summary,
    p.open_to_work,
    p.created_at, p.updated_at
  FROM public.profiles p
$function$;