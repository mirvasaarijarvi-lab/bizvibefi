-- 1) events.online_url: remove blanket table SELECT, re-grant every other column
DO $$
DECLARE cols text;
BEGIN
  SELECT string_agg(quote_ident(attname), ', ')
    INTO cols
  FROM pg_attribute
  WHERE attrelid = 'public.events'::regclass
    AND attnum > 0 AND NOT attisdropped
    AND attname <> 'online_url';

  EXECUTE 'REVOKE SELECT ON public.events FROM anon, authenticated';
  EXECUTE format('GRANT SELECT (%s) ON public.events TO anon, authenticated', cols);
END $$;

-- 2) recruitment_posts.apply_email: hide from anonymous visitors
DO $$
DECLARE cols text;
BEGIN
  SELECT string_agg(quote_ident(attname), ', ')
    INTO cols
  FROM pg_attribute
  WHERE attrelid = 'public.recruitment_posts'::regclass
    AND attnum > 0 AND NOT attisdropped
    AND attname <> 'apply_email';

  EXECUTE 'REVOKE SELECT ON public.recruitment_posts FROM anon';
  EXECUTE format('GRANT SELECT (%s) ON public.recruitment_posts TO anon', cols);
END $$;

CREATE OR REPLACE FUNCTION public.list_public_recruitment_posts()
RETURNS TABLE(
  id uuid, user_id uuid, type recruitment_post_type, title text, description text,
  organization text, location text, is_remote boolean, employment_type text,
  apply_url text, apply_email text, allow_contact_request boolean, tags text[],
  status approval_status, rejection_reason text, expires_at date,
  created_at timestamptz, updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    r.id, r.user_id, r.type, r.title, r.description,
    r.organization, r.location, r.is_remote, r.employment_type,
    r.apply_url,
    CASE
      WHEN auth.uid() IS NOT NULL
        AND (r.allow_contact_request = false OR auth.uid() = r.user_id
             OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role))
      THEN r.apply_email
      ELSE NULL
    END AS apply_email,
    r.allow_contact_request, r.tags,
    r.status, NULL::text AS rejection_reason, r.expires_at,
    r.created_at, r.updated_at
  FROM public.recruitment_posts r
  WHERE r.status = 'approved'::approval_status
    AND (r.expires_at IS NULL OR r.expires_at >= CURRENT_DATE)
  ORDER BY r.created_at DESC
$$;

GRANT EXECUTE ON FUNCTION public.list_public_recruitment_posts() TO anon, authenticated;

-- 3) showcase_items: validate transitions against the OLD row
CREATE OR REPLACE FUNCTION public.prevent_showcase_status_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin boolean := has_role(auth.uid(), 'admin'::app_role)
                      OR has_role(auth.uid(), 'superadmin'::app_role);
BEGIN
  IF is_admin THEN
    RETURN NEW;
  END IF;

  -- Once moderated, only admins may touch the row. This blocks re-opening an
  -- approved item back to 'pending' and re-editing already public content.
  IF OLD.status IS DISTINCT FROM 'pending'::approval_status THEN
    RAISE EXCEPTION 'Only admins can modify a showcase item after moderation';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
    RAISE EXCEPTION 'Only admins can change showcase status or rejection reason';
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Only admins can reassign showcase item ownership';
  END IF;

  IF NEW.type IS DISTINCT FROM OLD.type
     AND NEW.type::text = 'lead' THEN
    RAISE EXCEPTION 'Only admins can change a showcase item type to lead';
  END IF;

  RETURN NEW;
END;
$$;