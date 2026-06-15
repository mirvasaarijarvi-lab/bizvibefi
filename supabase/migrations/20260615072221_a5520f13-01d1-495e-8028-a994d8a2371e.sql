
-- 1. Tracking table for Showcase file downloads
CREATE TABLE IF NOT EXISTS public.showcase_file_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES public.showcase_items(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text,
  user_id uuid,
  user_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS showcase_file_downloads_item_idx
  ON public.showcase_file_downloads(item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS showcase_file_downloads_file_idx
  ON public.showcase_file_downloads(item_id, file_url);

GRANT SELECT ON public.showcase_file_downloads TO authenticated;
GRANT ALL ON public.showcase_file_downloads TO service_role;

ALTER TABLE public.showcase_file_downloads ENABLE ROW LEVEL SECURITY;

-- Admins read all rows
DROP POLICY IF EXISTS "Admins read showcase downloads" ON public.showcase_file_downloads;
CREATE POLICY "Admins read showcase downloads"
ON public.showcase_file_downloads
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

-- 2. Public logger (called by the website on download click)
CREATE OR REPLACE FUNCTION public.log_showcase_download(
  _item_id uuid,
  _file_url text,
  _file_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF _item_id IS NULL OR _file_url IS NULL OR length(btrim(_file_url)) = 0 THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.showcase_file_downloads(item_id, file_url, file_name, user_id, user_email)
  VALUES (
    _item_id,
    _file_url,
    NULLIF(btrim(_file_name), ''),
    auth.uid(),
    public.current_user_email()
  )
  RETURNING id INTO new_id;

  RETURN new_id;
EXCEPTION WHEN OTHERS THEN
  -- Never block the user's download because of a logging error.
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.log_showcase_download(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_showcase_download(uuid, text, text) TO anon, authenticated;

-- 3. Admin-only per-file stats for a Showcase item
CREATE OR REPLACE FUNCTION public.get_showcase_download_stats(_item_id uuid)
RETURNS TABLE (
  file_url text,
  file_name text,
  downloads bigint,
  unique_downloaders bigint,
  last_download_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.file_url,
    MAX(d.file_name) AS file_name,
    COUNT(*)::bigint AS downloads,
    COUNT(DISTINCT COALESCE(d.user_id::text, lower(d.user_email)))::bigint AS unique_downloaders,
    MAX(d.created_at) AS last_download_at
  FROM public.showcase_file_downloads d
  WHERE d.item_id = _item_id
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'superadmin'::app_role)
    )
  GROUP BY d.file_url
  ORDER BY downloads DESC;
$$;

REVOKE ALL ON FUNCTION public.get_showcase_download_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_showcase_download_stats(uuid) TO authenticated;

-- 4. Admin-only per-presentation stats for an event
CREATE OR REPLACE FUNCTION public.get_event_presentation_download_stats(_event_id uuid)
RETURNS TABLE (
  presentation_id uuid,
  presentation_title text,
  downloads bigint,
  unique_downloaders bigint,
  denied bigint,
  last_download_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS presentation_id,
    p.title AS presentation_title,
    COUNT(*) FILTER (WHERE l.allowed)::bigint AS downloads,
    COUNT(DISTINCT COALESCE(l.user_id::text, lower(l.user_email)))
      FILTER (WHERE l.allowed)::bigint AS unique_downloaders,
    COUNT(*) FILTER (WHERE NOT l.allowed)::bigint AS denied,
    MAX(l.created_at) FILTER (WHERE l.allowed) AS last_download_at
  FROM public.event_presentations p
  LEFT JOIN public.presentation_access_log l
    ON l.presentation_id = p.id
  WHERE p.event_id = _event_id
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'superadmin'::app_role)
    )
  GROUP BY p.id, p.title
  ORDER BY downloads DESC;
$$;

REVOKE ALL ON FUNCTION public.get_event_presentation_download_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_event_presentation_download_stats(uuid) TO authenticated;
