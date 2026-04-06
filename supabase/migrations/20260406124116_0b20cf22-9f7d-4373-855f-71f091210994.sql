
-- Add requires_approval to forum_categories
ALTER TABLE public.forum_categories ADD COLUMN requires_approval boolean NOT NULL DEFAULT false;

-- Add is_approved to forum_topics
ALTER TABLE public.forum_topics ADD COLUMN is_approved boolean NOT NULL DEFAULT true;

-- Insert the Leads forum category
INSERT INTO public.forum_categories (name, slug, description, min_tier, sort_order, requires_approval)
VALUES ('Leads', 'leads', 'Share and discover business leads. Posts require admin approval before becoming visible.', 'viber', 50, true);

-- Update forum_topics SELECT policy to hide unapproved topics (except for author and admins)
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
    AND (
      forum_topics.is_approved = true
      OR forum_topics.user_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'superadmin'::app_role)
    )
  );
