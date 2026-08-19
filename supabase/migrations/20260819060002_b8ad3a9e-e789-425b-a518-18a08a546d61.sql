ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS external_url text,
  ADD COLUMN IF NOT EXISTS external_host text;

GRANT SELECT (external_url, external_host) ON public.events TO anon, authenticated;
GRANT SELECT (external_url, external_host) ON public.events TO service_role;