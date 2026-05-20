ALTER TYPE public.showcase_type ADD VALUE IF NOT EXISTS 'tool_to_test';

ALTER TABLE public.showcase_items
  ADD COLUMN IF NOT EXISTS test_reasons text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS test_reasons_other text;