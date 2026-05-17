UPDATE public.events
SET 
  title = REPLACE(title, 'BizVibe', 'GoodVibesCafe'),
  title_fi = REPLACE(title_fi, 'BizVibe', 'GoodVibesCafe'),
  title_sv = REPLACE(COALESCE(title_sv, ''), 'BizVibe', 'GoodVibesCafe'),
  description = REPLACE(description, 'BizVibe', 'GoodVibesCafe'),
  description_fi = REPLACE(description_fi, 'BizVibe', 'GoodVibesCafe')
WHERE title ILIKE '%bizvibe%' OR title_fi ILIKE '%bizvibe%' OR description ILIKE '%bizvibe%' OR description_fi ILIKE '%bizvibe%';