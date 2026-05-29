
-- 1. Update RPCs to enforce profile_visibility for bio/company/company_url/linkedin_url/website_links
CREATE OR REPLACE FUNCTION public.get_public_profile(_user_id uuid)
 RETURNS TABLE(id uuid, user_id uuid, display_name text, avatar_url text, bio text, company text, company_url text, linkedin_url text, website_links jsonb, membership_tier membership_tier, vibetor_type vibetor_type, viber_access_override boolean, profile_visibility jsonb, contact_email text, contact_phone text, created_at timestamp with time zone, updated_at timestamp with time zone)
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
    p.created_at, p.updated_at
  FROM public.profiles p
  WHERE p.user_id = _user_id
$function$;

CREATE OR REPLACE FUNCTION public.list_public_profiles()
 RETURNS TABLE(id uuid, user_id uuid, display_name text, avatar_url text, bio text, company text, company_url text, linkedin_url text, website_links jsonb, membership_tier membership_tier, vibetor_type vibetor_type, viber_access_override boolean, profile_visibility jsonb, contact_email text, contact_phone text, created_at timestamp with time zone, updated_at timestamp with time zone)
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
    p.created_at, p.updated_at
  FROM public.profiles p
$function$;

-- 2. Tighten showcase_items UPDATE policy with WITH CHECK (ownership preserved)
DROP POLICY IF EXISTS "Users can update own showcase items" ON public.showcase_items;
CREATE POLICY "Users can update own showcase items"
ON public.showcase_items
FOR UPDATE
USING ((auth.uid() = user_id) OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role))
WITH CHECK ((auth.uid() = user_id) OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role));

-- 3. Add storage SELECT policy for event-presentations mirroring table policy
DROP POLICY IF EXISTS "Public can read presentations of published past events" ON storage.objects;
CREATE POLICY "Public can read presentations of published past events"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'event-presentations'
  AND EXISTS (
    SELECT 1 FROM public.event_presentations ep
    JOIN public.events e ON e.id = ep.event_id
    WHERE ep.file_path = storage.objects.name
      AND e.is_published = true
      AND e.starts_at < now()
  )
);
