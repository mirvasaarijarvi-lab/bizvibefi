
CREATE TABLE IF NOT EXISTS public.presentation_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id uuid REFERENCES public.event_presentations(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid,
  user_email text,
  allowed boolean NOT NULL,
  reason text,
  http_status int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS presentation_access_log_event_idx
  ON public.presentation_access_log(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS presentation_access_log_denied_idx
  ON public.presentation_access_log(allowed, created_at DESC);

GRANT SELECT ON public.presentation_access_log TO authenticated;
GRANT ALL ON public.presentation_access_log TO service_role;

ALTER TABLE public.presentation_access_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read access log" ON public.presentation_access_log;
CREATE POLICY "Admins read access log"
ON public.presentation_access_log
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

CREATE OR REPLACE FUNCTION public.get_presentation_access_audit()
RETURNS TABLE(
  presentation_id uuid,
  event_id uuid,
  event_title text,
  event_starts_at timestamptz,
  presentation_title text,
  file_size bigint,
  allowed_users jsonb,
  allowed_user_count int,
  denied_last_30d int,
  last_denial_at timestamptz,
  last_denial_reason text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH access AS (
    SELECT
      p.id AS presentation_id,
      p.event_id,
      e.title AS event_title,
      e.starts_at AS event_starts_at,
      p.title AS presentation_title,
      p.file_size,
      (
        SELECT jsonb_agg(to_jsonb(u))
        FROM (
          SELECT DISTINCT ON (COALESCE(user_id::text, email))
            user_id, display_name, email, source
          FROM (
            SELECT ur.user_id, pr.display_name, au.email::text AS email, 'admin'::text AS source
            FROM public.user_roles ur
            LEFT JOIN public.profiles pr ON pr.user_id = ur.user_id
            LEFT JOIN auth.users au ON au.id = ur.user_id
            WHERE ur.role IN ('admin'::app_role, 'superadmin'::app_role)

            UNION ALL

            SELECT e.created_by, pr.display_name, au.email::text, 'creator'
            FROM public.profiles pr
            LEFT JOIN auth.users au ON au.id = e.created_by
            WHERE e.created_by IS NOT NULL AND pr.user_id = e.created_by

            UNION ALL

            SELECT r.user_id, pr.display_name, au.email::text, 'rsvp'
            FROM public.event_rsvps r
            LEFT JOIN public.profiles pr ON pr.user_id = r.user_id
            LEFT JOIN auth.users au ON au.id = r.user_id
            WHERE r.event_id = p.event_id AND r.status = 'going'

            UNION ALL

            SELECT au.id AS user_id, COALESCE(pr.display_name, s.full_name) AS display_name, s.email, 'signup'
            FROM public.event_signups s
            LEFT JOIN auth.users au ON lower(au.email) = lower(s.email)
            LEFT JOIN public.profiles pr ON pr.user_id = au.id
            WHERE s.event_id = p.event_id
          ) raw
          ORDER BY COALESCE(user_id::text, email), source
        ) u
      ) AS allowed_users,
      (
        SELECT COUNT(*)::int FROM (
          SELECT DISTINCT COALESCE(user_id::text, email) AS k FROM (
            SELECT ur.user_id, NULL::text AS email
            FROM public.user_roles ur
            WHERE ur.role IN ('admin'::app_role, 'superadmin'::app_role)
            UNION ALL
            SELECT e.created_by, NULL::text WHERE e.created_by IS NOT NULL
            UNION ALL
            SELECT r.user_id, NULL::text FROM public.event_rsvps r
            WHERE r.event_id = p.event_id AND r.status = 'going'
            UNION ALL
            SELECT NULL::uuid, lower(s.email) FROM public.event_signups s
            WHERE s.event_id = p.event_id
          ) raw
        ) c
      ) AS allowed_user_count
    FROM public.event_presentations p
    JOIN public.events e ON e.id = p.event_id
  ),
  denials AS (
    SELECT
      l.presentation_id,
      COUNT(*) FILTER (WHERE l.created_at > now() - interval '30 days')::int AS denied_last_30d,
      MAX(l.created_at) AS last_denial_at,
      (ARRAY_AGG(l.reason ORDER BY l.created_at DESC))[1] AS last_denial_reason
    FROM public.presentation_access_log l
    WHERE NOT l.allowed
    GROUP BY l.presentation_id
  )
  SELECT
    a.presentation_id, a.event_id, a.event_title, a.event_starts_at,
    a.presentation_title, a.file_size, a.allowed_users, a.allowed_user_count,
    COALESCE(d.denied_last_30d, 0), d.last_denial_at, d.last_denial_reason
  FROM access a
  LEFT JOIN denials d ON d.presentation_id = a.presentation_id
  WHERE has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)
  ORDER BY a.event_starts_at DESC, a.presentation_title ASC;
$$;

REVOKE ALL ON FUNCTION public.get_presentation_access_audit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_presentation_access_audit() TO authenticated, service_role;
