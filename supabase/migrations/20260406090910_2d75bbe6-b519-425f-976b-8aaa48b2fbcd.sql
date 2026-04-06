
INSERT INTO storage.buckets (id, name, public)
VALUES ('showcase-images', 'showcase-images', true);

CREATE POLICY "Anyone can view showcase images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'showcase-images');

CREATE POLICY "Authenticated users can upload showcase images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'showcase-images');

CREATE POLICY "Users can delete their own showcase images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'showcase-images' AND (storage.foldername(name))[1] = auth.uid()::text);
