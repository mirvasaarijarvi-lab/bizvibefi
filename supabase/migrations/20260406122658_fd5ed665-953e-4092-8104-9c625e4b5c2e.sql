
CREATE OR REPLACE FUNCTION public.has_viber_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id
      AND membership_tier::text IN ('viber', 'vibetor')
  )
$$;

-- Update forum_categories RLS to use has_viber_access instead of checking = 'viber'
DROP POLICY IF EXISTS "Anyone can view starter categories" ON public.forum_categories;
CREATE POLICY "Anyone can view starter categories" ON public.forum_categories
  FOR SELECT TO public
  USING (
    min_tier = 'starter'::membership_tier
    OR (auth.uid() IS NOT NULL AND has_viber_access(auth.uid()))
    OR (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role))
    OR (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'superadmin'::app_role))
  );

-- Update forum_replies RLS
DROP POLICY IF EXISTS "Anyone can view replies in accessible topics" ON public.forum_replies;
CREATE POLICY "Anyone can view replies in accessible topics" ON public.forum_replies
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM forum_topics ft
      JOIN forum_categories fc ON fc.id = ft.category_id
      WHERE ft.id = forum_replies.topic_id
        AND (fc.min_tier = 'starter'::membership_tier
          OR has_viber_access(auth.uid())
          OR has_role(auth.uid(), 'admin'::app_role)
          OR has_role(auth.uid(), 'superadmin'::app_role))
    )
  );

-- Update forum_topics RLS
DROP POLICY IF EXISTS "Anyone can view topics in accessible categories" ON public.forum_topics;
CREATE POLICY "Anyone can view topics in accessible categories" ON public.forum_topics
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM forum_categories fc
      WHERE fc.id = forum_topics.category_id
        AND (fc.min_tier = 'starter'::membership_tier
          OR has_viber_access(auth.uid())
          OR has_role(auth.uid(), 'admin'::app_role)
          OR has_role(auth.uid(), 'superadmin'::app_role))
    )
  );
