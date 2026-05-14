
-- Add invoicing/billing fields to vibetor_applications (used when partner is a company)
ALTER TABLE public.vibetor_applications
  ADD COLUMN IF NOT EXISTS billing_name text,
  ADD COLUMN IF NOT EXISTS billing_business_id text,
  ADD COLUMN IF NOT EXISTS billing_vat_id text,
  ADD COLUMN IF NOT EXISTS billing_email text,
  ADD COLUMN IF NOT EXISTS billing_address text,
  ADD COLUMN IF NOT EXISTS billing_postal_code text,
  ADD COLUMN IF NOT EXISTS billing_city text,
  ADD COLUMN IF NOT EXISTS billing_country text,
  ADD COLUMN IF NOT EXISTS billing_reference text,
  ADD COLUMN IF NOT EXISTS einvoice_address text,
  ADD COLUMN IF NOT EXISTS einvoice_operator text;

-- Create a table for Viber membership applications (manual invoicing)
CREATE TABLE IF NOT EXISTS public.viber_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  is_company boolean NOT NULL DEFAULT false,
  company_name text,
  representative_name text,
  -- Billing / invoicing data
  billing_name text NOT NULL,
  billing_business_id text,
  billing_vat_id text,
  billing_email text NOT NULL,
  billing_address text NOT NULL,
  billing_postal_code text NOT NULL,
  billing_city text NOT NULL,
  billing_country text NOT NULL DEFAULT 'Finland',
  billing_reference text,
  einvoice_address text,
  einvoice_operator text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.viber_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can submit viber applications"
ON public.viber_applications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own viber applications"
ON public.viber_applications FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role));

CREATE POLICY "Admins can update viber applications"
ON public.viber_applications FOR UPDATE
USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role));

CREATE TRIGGER update_viber_applications_updated_at
BEFORE UPDATE ON public.viber_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
