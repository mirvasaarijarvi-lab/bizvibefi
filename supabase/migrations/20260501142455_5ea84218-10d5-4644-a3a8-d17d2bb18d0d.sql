-- Course delivery method enum
CREATE TYPE public.course_method AS ENUM ('face_to_face', 'seminar', 'webinar', 'customized', 'other');

-- Courses catalog (managed by admins)
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  default_method public.course_method NOT NULL DEFAULT 'webinar',
  badge_id UUID REFERENCES public.badge_catalog(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active courses"
  ON public.courses FOR SELECT
  USING (is_active = true OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role));

CREATE POLICY "Admins manage courses"
  ON public.courses FOR ALL
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role));

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Course certificates issued by founders/admins
CREATE TABLE public.course_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  participant_user_id UUID,                        -- linked member, optional
  participant_name TEXT NOT NULL,                  -- display name on certificate
  course_title TEXT NOT NULL,                      -- snapshot at issue time
  course_content TEXT NOT NULL,                    -- short description shown on certificate
  method public.course_method NOT NULL,
  method_details TEXT,                             -- shown when method = 'other'
  completion_date DATE NOT NULL,
  issued_by UUID NOT NULL,                         -- founder/admin user_id
  issued_by_name TEXT NOT NULL,                    -- snapshot at issue time
  pdf_url TEXT,                                    -- generated PDF URL
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_certificates_participant ON public.course_certificates(participant_user_id);
CREATE INDEX idx_certificates_course ON public.course_certificates(course_id);

ALTER TABLE public.course_certificates ENABLE ROW LEVEL SECURITY;

-- Public verify URL: anyone with the ID can view (read-only)
CREATE POLICY "Anyone can view certificates"
  ON public.course_certificates FOR SELECT
  USING (true);

CREATE POLICY "Admins issue certificates"
  ON public.course_certificates FOR INSERT
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role));

CREATE POLICY "Admins update certificates"
  ON public.course_certificates FOR UPDATE
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role));

CREATE POLICY "Admins delete certificates"
  ON public.course_certificates FOR DELETE
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role));

CREATE TRIGGER update_course_certificates_updated_at
  BEFORE UPDATE ON public.course_certificates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-award the linked course badge on certificate issuance
CREATE OR REPLACE FUNCTION public.auto_award_course_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bid UUID;
BEGIN
  IF NEW.participant_user_id IS NULL THEN RETURN NEW; END IF;
  SELECT badge_id INTO bid FROM public.courses WHERE id = NEW.course_id;
  IF bid IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.member_badges (user_id, badge_id, awarded_by, notes)
  VALUES (NEW.participant_user_id, bid, NEW.issued_by, 'Auto-awarded via course certificate ' || NEW.id::text)
  ON CONFLICT (user_id, badge_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER award_course_badge
  AFTER INSERT ON public.course_certificates
  FOR EACH ROW EXECUTE FUNCTION public.auto_award_course_badge();

-- Storage bucket for generated certificate PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read certificates"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificates');

CREATE POLICY "Admins upload certificates"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'certificates'
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role))
  );

CREATE POLICY "Admins update certificate files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'certificates'
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role))
  );

CREATE POLICY "Admins delete certificate files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'certificates'
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role))
  );

-- Seed two starter courses
INSERT INTO public.courses (title, summary, default_method) VALUES
  ('BizVibe Foundations', 'Core principles of building with the BizVibe collective: mindset, tooling, and community practices.', 'webinar'),
  ('Vibe-Coding Bootcamp', 'Hands-on session on shipping AI-assisted products using the BizVibe stack.', 'face_to_face')
ON CONFLICT DO NOTHING;