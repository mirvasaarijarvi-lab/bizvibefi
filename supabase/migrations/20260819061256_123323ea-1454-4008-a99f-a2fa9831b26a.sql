ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_all_day boolean NOT NULL DEFAULT false;
GRANT SELECT (is_all_day) ON public.events TO anon, authenticated;