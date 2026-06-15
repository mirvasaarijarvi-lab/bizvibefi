
CREATE OR REPLACE FUNCTION public.get_event_feedback_public(_event_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  overall_rating smallint,
  program_ratings jsonb,
  comments text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    f.id,
    NULLIF(btrim(f.name), '') AS name,
    f.overall_rating,
    COALESCE(f.program_ratings, '[]'::jsonb) AS program_ratings,
    NULLIF(btrim(f.comments), '') AS comments,
    f.created_at
  FROM public.event_feedback f
  JOIN public.events e ON e.id = f.event_id
  WHERE f.event_id = _event_id
    AND e.is_published = true
    AND COALESCE(e.ends_at, e.starts_at + interval '1 day') <= (now() - interval '2 days')
  ORDER BY f.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_event_feedback_public(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_event_feedback_public(uuid) TO anon, authenticated;
