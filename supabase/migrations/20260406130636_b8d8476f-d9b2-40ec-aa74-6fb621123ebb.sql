
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true);

CREATE POLICY "Authenticated users can upload event images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-images');

CREATE POLICY "Anyone can view event images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'event-images');

CREATE POLICY "Admins can delete event images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'event-images' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)));

CREATE POLICY "Admins can update event images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'event-images' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)));
