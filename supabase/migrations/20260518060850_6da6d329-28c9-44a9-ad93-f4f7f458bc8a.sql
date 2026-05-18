
CREATE POLICY "Creators can update their own events"
ON public.events
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can delete their own events"
ON public.events
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Creators can view their own events"
ON public.events
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);
