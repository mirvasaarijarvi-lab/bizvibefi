-- Prevent users from reviewing their own showcase items
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.showcase_reviews;

CREATE POLICY "Authenticated users can create reviews"
ON public.showcase_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT EXISTS (
    SELECT 1 FROM public.showcase_items si
    WHERE si.id = showcase_reviews.showcase_item_id
      AND si.user_id = auth.uid()
  )
);