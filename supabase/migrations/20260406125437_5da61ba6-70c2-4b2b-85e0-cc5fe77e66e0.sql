
-- Allow all authenticated users to view roles (for member directory badges)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Authenticated users can view roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (true);
