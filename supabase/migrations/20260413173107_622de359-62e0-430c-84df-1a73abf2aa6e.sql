
CREATE TABLE public.vibetor_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  vibetor_type TEXT NOT NULL CHECK (vibetor_type IN ('innovator', 'investor', 'partner')),
  is_company BOOLEAN NOT NULL DEFAULT false,
  company_name TEXT,
  representative_name TEXT,
  linkedin_url TEXT,
  motivation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vibetor_applications ENABLE ROW LEVEL SECURITY;

-- Anyone (even unauthenticated) can submit an application
CREATE POLICY "Anyone can submit vibetor applications"
ON public.vibetor_applications
FOR INSERT
WITH CHECK (true);

-- Users can view their own applications
CREATE POLICY "Users can view own applications"
ON public.vibetor_applications
FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

-- Admins can update applications
CREATE POLICY "Admins can update applications"
ON public.vibetor_applications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Timestamp trigger
CREATE TRIGGER update_vibetor_applications_updated_at
BEFORE UPDATE ON public.vibetor_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
