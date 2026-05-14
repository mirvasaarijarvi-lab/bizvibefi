
-- (1) Storage listing lockdown: drop broad public SELECT policies.
-- Public buckets still serve files via direct URLs (getPublicUrl bypasses RLS),
-- but listing/enumeration via the API is now blocked for anonymous users.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view showcase images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view event images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for showcase-files" ON storage.objects;

-- Privilege-escalation fix on showcase-files INSERT:
-- The previous policy allowed any authenticated user to upload into the admin/ folder
-- because of an OR clause. Restrict it to the user's own folder only.
DROP POLICY IF EXISTS "Users can upload showcase-files to own folder" ON storage.objects;
CREATE POLICY "Users can upload showcase-files to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'showcase-files'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- (4) Admins/superadmins can view all event RSVPs
CREATE POLICY "Admins can view all event RSVPs"
ON public.event_rsvps FOR SELECT
USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role));
