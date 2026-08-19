REVOKE SELECT (apply_email) ON public.recruitment_posts FROM authenticated;

CREATE OR REPLACE FUNCTION public.list_my_recruitment_posts()
RETURNS SETOF public.recruitment_posts
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM public.recruitment_posts
  WHERE auth.uid() IS NOT NULL AND user_id = auth.uid()
  ORDER BY created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.list_all_recruitment_posts_admin()
RETURNS SETOF public.recruitment_posts
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM public.recruitment_posts
  WHERE has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role)
  ORDER BY created_at DESC
$$;

REVOKE ALL ON FUNCTION public.list_my_recruitment_posts() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_all_recruitment_posts_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_my_recruitment_posts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_all_recruitment_posts_admin() TO authenticated;