
-- Tighten event-images INSERT: require uploader's folder prefix
DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
CREATE POLICY "Users upload event images to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'event-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Tighten showcase-images INSERT: require uploader's folder prefix
DROP POLICY IF EXISTS "Authenticated users can upload showcase images" ON storage.objects;
CREATE POLICY "Users upload showcase images to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'showcase-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users/admins to update/delete their own showcase images
CREATE POLICY "Users update own showcase images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'showcase-images'
  AND ((storage.foldername(name))[1] = auth.uid()::text
       OR has_role(auth.uid(),'admin'::app_role)
       OR has_role(auth.uid(),'superadmin'::app_role))
);
CREATE POLICY "Users delete own showcase images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'showcase-images'
  AND ((storage.foldername(name))[1] = auth.uid()::text
       OR has_role(auth.uid(),'admin'::app_role)
       OR has_role(auth.uid(),'superadmin'::app_role))
);

-- Allow admins similar control over event-images
CREATE POLICY "Admins manage event images"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'event-images'
  AND (has_role(auth.uid(),'admin'::app_role)
       OR has_role(auth.uid(),'superadmin'::app_role))
)
WITH CHECK (
  bucket_id = 'event-images'
  AND (has_role(auth.uid(),'admin'::app_role)
       OR has_role(auth.uid(),'superadmin'::app_role))
);

-- Enforce status integrity at RLS layer on showcase_items
DROP POLICY IF EXISTS "Users can update own showcase items" ON public.showcase_items;
CREATE POLICY "Users can update own showcase items"
ON public.showcase_items
FOR UPDATE
USING (
  (auth.uid() = user_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
  OR (auth.uid() = user_id AND status = 'pending'::approval_status)
);
