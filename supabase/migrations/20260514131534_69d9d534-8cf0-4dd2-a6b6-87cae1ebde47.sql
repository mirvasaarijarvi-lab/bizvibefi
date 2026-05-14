
CREATE TABLE IF NOT EXISTS public.starter_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  company_name text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.starter_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can submit starter applications"
ON public.starter_applications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own starter applications"
ON public.starter_applications FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role));

CREATE POLICY "Admins can update starter applications"
ON public.starter_applications FOR UPDATE
USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role));

CREATE TRIGGER update_starter_applications_updated_at
BEFORE UPDATE ON public.starter_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
