
-- 1. Add new enum value
ALTER TYPE public.showcase_type ADD VALUE IF NOT EXISTS 'lead';

-- 2. Replace SELECT policy to gate leads
DROP POLICY IF EXISTS "Anyone can view approved showcase items" ON public.showcase_items;

CREATE POLICY "View approved showcase items with lead gating"
ON public.showcase_items
FOR SELECT
USING (
  (
    (status = 'approved'::approval_status)
    OR (auth.uid() = user_id)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'superadmin'::app_role)
  )
  AND (
    (type::text <> 'lead')
    OR (auth.uid() = user_id)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'superadmin'::app_role)
    OR (auth.uid() IS NOT NULL AND public.has_viber_access(auth.uid()))
  )
);

-- 3. Replace INSERT policy to gate lead creation to Vibers+
DROP POLICY IF EXISTS "Authenticated users can submit showcase items" ON public.showcase_items;

CREATE POLICY "Authenticated users can submit showcase items"
ON public.showcase_items
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    (type::text <> 'lead')
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'superadmin'::app_role)
    OR public.has_viber_access(auth.uid())
  )
);
