
ALTER TABLE public.profiles
  ADD COLUMN website_links jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN contact_email text,
  ADD COLUMN contact_phone text;
