ALTER TABLE public.event_signups ADD COLUMN company TEXT NOT NULL DEFAULT '';
ALTER TABLE public.event_signups ALTER COLUMN company DROP DEFAULT;