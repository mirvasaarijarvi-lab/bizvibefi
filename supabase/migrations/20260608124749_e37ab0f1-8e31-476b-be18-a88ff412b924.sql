-- 1. Drop public storage read policy for presentation files
DROP POLICY IF EXISTS "Public can read presentations of published past events" ON storage.objects;

-- 2. Revoke column-level SELECT on events.online_url from anon/authenticated
REVOKE SELECT (online_url) ON public.events FROM anon, authenticated;