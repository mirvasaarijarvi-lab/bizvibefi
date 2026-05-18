-- 1) Table for event presentation files
CREATE TABLE public.event_presentations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text NOT NULL DEFAULT 'application/pdf',
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_presentations_event_id ON public.event_presentations(event_id);

ALTER TABLE public.event_presentations ENABLE ROW LEVEL SECURITY;

-- Anyone can see metadata for presentations attached to published past events.
-- (file download itself is gated by edge function)
CREATE POLICY "Anyone can view presentation metadata for published past events"
ON public.event_presentations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_presentations.event_id
      AND e.is_published = true
      AND e.starts_at < now()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_presentations.event_id
      AND e.created_by = auth.uid()
  )
);

-- Insert: admins, superadmins, or the event creator
CREATE POLICY "Admins or event creator can insert presentations"
ON public.event_presentations
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_presentations.event_id
      AND e.created_by = auth.uid()
  )
);

CREATE POLICY "Admins or event creator can update presentations"
ON public.event_presentations
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_presentations.event_id
      AND e.created_by = auth.uid()
  )
);

CREATE POLICY "Admins or event creator can delete presentations"
ON public.event_presentations
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_presentations.event_id
      AND e.created_by = auth.uid()
  )
);

-- 2) Private storage bucket for presentation files
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-presentations', 'event-presentations', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: admin/superadmin/event creator can upload/update/delete.
-- Reads happen via signed URLs minted server-side by the edge function (service role),
-- so we intentionally do NOT grant public SELECT here.
CREATE POLICY "Admins/creators can read presentation files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'event-presentations' AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'superadmin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.event_presentations p
      JOIN public.events e ON e.id = p.event_id
      WHERE p.file_path = storage.objects.name
        AND e.created_by = auth.uid()
    )
  )
);

CREATE POLICY "Admins/creators can upload presentation files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-presentations' AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'superadmin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id::text = split_part(storage.objects.name, '/', 1)
        AND e.created_by = auth.uid()
    )
  )
);

CREATE POLICY "Admins/creators can update presentation files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-presentations' AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'superadmin'::app_role)
  )
);

CREATE POLICY "Admins/creators can delete presentation files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-presentations' AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'superadmin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.event_presentations p
      JOIN public.events e ON e.id = p.event_id
      WHERE p.file_path = storage.objects.name
        AND e.created_by = auth.uid()
    )
  )
);