
-- event_signups: add a restrictive SELECT policy so any future permissive
-- SELECT policy still has to satisfy the admin/superadmin gate.
CREATE POLICY "Restrict signup reads to admins"
ON public.event_signups
AS RESTRICTIVE
FOR SELECT
TO anon, authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

-- showcase_file_downloads: explicitly block client-side inserts/updates/deletes.
-- All writes must go through public.log_showcase_download (SECURITY DEFINER) or
-- the service role, so RLS for end users denies everything but admin reads.
CREATE POLICY "Block client inserts to download log"
ON public.showcase_file_downloads
AS RESTRICTIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "Block client updates to download log"
ON public.showcase_file_downloads
AS RESTRICTIVE
FOR UPDATE
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Block client deletes from download log"
ON public.showcase_file_downloads
AS RESTRICTIVE
FOR DELETE
TO anon, authenticated
USING (false);
