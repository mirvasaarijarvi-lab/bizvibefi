
-- 1. Add requires_signin toggle to events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS requires_signin BOOLEAN NOT NULL DEFAULT true;

-- 2. Guest signups table for open events
CREATE TABLE IF NOT EXISTS public.event_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_signups_event_id_idx ON public.event_signups(event_id);

ALTER TABLE public.event_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a guest signup"
  ON public.event_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_signups.event_id
        AND e.is_published = true
        AND e.requires_signin = false
    )
  );

CREATE POLICY "Event creator and superadmins can view guest signups"
  ON public.event_signups
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'superadmin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_signups.event_id
        AND e.created_by = auth.uid()
    )
  );

CREATE POLICY "Event creator and superadmins can delete guest signups"
  ON public.event_signups
  FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'superadmin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_signups.event_id
        AND e.created_by = auth.uid()
    )
  );
