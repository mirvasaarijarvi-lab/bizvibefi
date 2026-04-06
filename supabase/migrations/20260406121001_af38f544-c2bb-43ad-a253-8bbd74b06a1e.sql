
ALTER TABLE public.showcase_items
  ADD COLUMN challenge text,
  ADD COLUMN solution text,
  ADD COLUMN benefits text[],
  ADD COLUMN key_figures jsonb DEFAULT '[]'::jsonb;
