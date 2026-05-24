
-- 1) Prevent users from escalating their own membership_tier / viber_access_override
CREATE OR REPLACE FUNCTION public.protect_membership_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin boolean := has_role(auth.uid(), 'admin'::app_role)
                      OR has_role(auth.uid(), 'superadmin'::app_role);
BEGIN
  IF NOT is_admin THEN
    IF NEW.membership_tier IS DISTINCT FROM OLD.membership_tier THEN
      RAISE EXCEPTION 'Only admins can change membership_tier';
    END IF;
    IF NEW.viber_access_override IS DISTINCT FROM OLD.viber_access_override THEN
      RAISE EXCEPTION 'Only admins can change viber_access_override';
    END IF;
    IF NEW.vibetor_type IS DISTINCT FROM OLD.vibetor_type THEN
      RAISE EXCEPTION 'Only admins can change vibetor_type';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_membership_fields ON public.profiles;
CREATE TRIGGER trg_protect_membership_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_membership_fields();

-- 2) Forum topics: enforce tier check on INSERT
DROP POLICY IF EXISTS "Authenticated users can create topics" ON public.forum_topics;
CREATE POLICY "Authenticated users can create topics"
ON public.forum_topics
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.forum_categories fc
    WHERE fc.id = forum_topics.category_id
      AND (
        fc.min_tier = 'starter'::membership_tier
        OR (has_viber_access(auth.uid())
            AND fc.min_tier = ANY (ARRAY['starter'::membership_tier, 'viber'::membership_tier]))
        OR (fc.min_tier = 'vibetor'::membership_tier
            AND EXISTS (SELECT 1 FROM public.profiles p
                        WHERE p.user_id = auth.uid()
                          AND p.membership_tier = 'vibetor'::membership_tier))
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'superadmin'::app_role)
      )
  )
);

-- 3) Forum replies: enforce tier check on INSERT
DROP POLICY IF EXISTS "Authenticated users can create replies" ON public.forum_replies;
CREATE POLICY "Authenticated users can create replies"
ON public.forum_replies
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.forum_topics ft
    JOIN public.forum_categories fc ON fc.id = ft.category_id
    WHERE ft.id = forum_replies.topic_id
      AND (
        fc.min_tier = 'starter'::membership_tier
        OR (has_viber_access(auth.uid())
            AND fc.min_tier = ANY (ARRAY['starter'::membership_tier, 'viber'::membership_tier]))
        OR (fc.min_tier = 'vibetor'::membership_tier
            AND EXISTS (SELECT 1 FROM public.profiles p
                        WHERE p.user_id = auth.uid()
                          AND p.membership_tier = 'vibetor'::membership_tier))
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'superadmin'::app_role)
      )
  )
);
