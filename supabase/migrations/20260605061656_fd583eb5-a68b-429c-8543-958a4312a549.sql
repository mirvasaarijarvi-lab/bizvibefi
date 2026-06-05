DROP POLICY IF EXISTS "Anyone can view member badges" ON public.member_badges;
CREATE POLICY "Authenticated users can view member badges"
ON public.member_badges
FOR SELECT
TO authenticated
USING (true);

REVOKE SELECT ON public.member_badges FROM anon;