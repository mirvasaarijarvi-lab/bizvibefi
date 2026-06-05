
-- Forum: require authenticated users
DROP POLICY IF EXISTS "Anyone can view topics in accessible categories" ON public.forum_topics;
CREATE POLICY "Members can view topics in accessible categories"
ON public.forum_topics FOR SELECT TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM forum_categories fc
    WHERE fc.id = forum_topics.category_id
      AND (
        fc.min_tier = 'starter'::membership_tier
        OR (has_viber_access(auth.uid()) AND fc.min_tier = ANY (ARRAY['starter'::membership_tier,'viber'::membership_tier]))
        OR (fc.min_tier = 'vibetor'::membership_tier AND EXISTS (
          SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.membership_tier = 'vibetor'::membership_tier
        ))
        OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role)
      )
  ))
  AND (is_approved = true OR user_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role))
);

DROP POLICY IF EXISTS "Anyone can view replies in accessible topics" ON public.forum_replies;
CREATE POLICY "Members can view replies in accessible topics"
ON public.forum_replies FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM forum_topics ft
    JOIN forum_categories fc ON fc.id = ft.category_id
    WHERE ft.id = forum_replies.topic_id
      AND (
        fc.min_tier = 'starter'::membership_tier
        OR (has_viber_access(auth.uid()) AND fc.min_tier = ANY (ARRAY['starter'::membership_tier,'viber'::membership_tier]))
        OR (fc.min_tier = 'vibetor'::membership_tier AND EXISTS (
          SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.membership_tier = 'vibetor'::membership_tier
        ))
        OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role)
      )
  )
);

-- member_badges: restrict broad SELECT to self; admins keep full access via separate policy
DROP POLICY IF EXISTS "Authenticated users can view member badges" ON public.member_badges;
CREATE POLICY "Users can view their own badges"
ON public.member_badges FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(),'admin'::app_role)
  OR has_role(auth.uid(),'superadmin'::app_role)
);

-- event_feedback: explicit deny INSERT for anon/authenticated (only service role inserts)
CREATE POLICY "Block public inserts on event feedback"
ON public.event_feedback FOR INSERT TO anon, authenticated
WITH CHECK (false);

-- Pin search_path on email helper functions
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
