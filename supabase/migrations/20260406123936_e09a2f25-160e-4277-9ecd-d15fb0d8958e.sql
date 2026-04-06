
-- Insert the Vibe Vault forum category (vibetor-only)
INSERT INTO public.forum_categories (name, slug, description, min_tier, sort_order)
VALUES ('Vibe Vault', 'vibe-vault', 'Exclusive space for Vibetors — investors, innovators, and deal-makers.', 'vibetor', 100);

-- Replace the existing SELECT policy to handle all three tiers
DROP POLICY IF EXISTS "Anyone can view starter categories" ON public.forum_categories;
DROP POLICY IF EXISTS "Users can view categories by tier" ON public.forum_categories;
CREATE POLICY "Users can view categories by tier" ON public.forum_categories
  FOR SELECT TO public
  USING (
    min_tier = 'starter'::membership_tier
    OR (auth.uid() IS NOT NULL AND has_viber_access(auth.uid()) AND min_tier IN ('starter'::membership_tier, 'viber'::membership_tier))
    OR (auth.uid() IS NOT NULL AND min_tier = 'vibetor'::membership_tier AND EXISTS (
      SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND membership_tier = 'vibetor'::membership_tier
    ))
    OR (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role))
    OR (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'superadmin'::app_role))
  );

-- Update forum_topics policy
DROP POLICY IF EXISTS "Anyone can view topics in accessible categories" ON public.forum_topics;
CREATE POLICY "Anyone can view topics in accessible categories" ON public.forum_topics
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM forum_categories fc
      WHERE fc.id = forum_topics.category_id
        AND (
          fc.min_tier = 'starter'::membership_tier
          OR (has_viber_access(auth.uid()) AND fc.min_tier IN ('starter'::membership_tier, 'viber'::membership_tier))
          OR (fc.min_tier = 'vibetor'::membership_tier AND EXISTS (
            SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND membership_tier = 'vibetor'::membership_tier
          ))
          OR has_role(auth.uid(), 'admin'::app_role)
          OR has_role(auth.uid(), 'superadmin'::app_role)
        )
    )
  );

-- Update forum_replies policy
DROP POLICY IF EXISTS "Anyone can view replies in accessible topics" ON public.forum_replies;
CREATE POLICY "Anyone can view replies in accessible topics" ON public.forum_replies
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM forum_topics ft
      JOIN forum_categories fc ON fc.id = ft.category_id
      WHERE ft.id = forum_replies.topic_id
        AND (
          fc.min_tier = 'starter'::membership_tier
          OR (has_viber_access(auth.uid()) AND fc.min_tier IN ('starter'::membership_tier, 'viber'::membership_tier))
          OR (fc.min_tier = 'vibetor'::membership_tier AND EXISTS (
            SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND membership_tier = 'vibetor'::membership_tier
          ))
          OR has_role(auth.uid(), 'admin'::app_role)
          OR has_role(auth.uid(), 'superadmin'::app_role)
        )
    )
  );
