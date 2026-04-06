
ALTER TABLE public.profiles
ADD COLUMN profile_visibility jsonb NOT NULL DEFAULT '{"bio": true, "company": true, "linkedin_url": true, "contact_email": true, "contact_phone": true, "website_links": true}'::jsonb;
