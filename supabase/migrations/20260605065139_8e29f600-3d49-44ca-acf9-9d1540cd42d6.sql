
CREATE TABLE public.event_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  overall_rating SMALLINT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  program_ratings JSONB NOT NULL DEFAULT '[]'::jsonb,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, email)
);

GRANT SELECT, INSERT ON public.event_feedback TO authenticated;
GRANT ALL ON public.event_feedback TO service_role;

ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read feedback"
  ON public.event_feedback FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role));

CREATE INDEX idx_event_feedback_event ON public.event_feedback(event_id);
