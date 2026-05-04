
-- Add file attachment fields to showcase_items
ALTER TABLE public.showcase_items 
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Create public storage bucket for showcase file attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('showcase-files', 'showcase-files', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Public read access for showcase-files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'showcase-files');

-- Authenticated users can upload to their own folder
CREATE POLICY "Users can upload showcase-files to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'showcase-files' 
    AND auth.uid() IS NOT NULL
    AND ((storage.foldername(name))[1] = auth.uid()::text OR (storage.foldername(name))[1] = 'admin')
  );

-- Users can update/delete their own showcase files
CREATE POLICY "Users can update own showcase-files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'showcase-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own showcase-files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'showcase-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admins can manage all showcase files
CREATE POLICY "Admins manage showcase-files"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'showcase-files'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'))
  )
  WITH CHECK (
    bucket_id = 'showcase-files'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'))
  );
