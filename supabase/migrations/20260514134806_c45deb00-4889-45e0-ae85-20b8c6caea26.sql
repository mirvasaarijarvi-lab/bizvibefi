ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS title_fi text,
  ADD COLUMN IF NOT EXISTS title_sv text,
  ADD COLUMN IF NOT EXISTS description_fi text,
  ADD COLUMN IF NOT EXISTS description_sv text,
  ADD COLUMN IF NOT EXISTS location_fi text,
  ADD COLUMN IF NOT EXISTS location_sv text;

UPDATE public.events
SET 
  title_fi = 'BizVibe MeetUp: Tule tutustumaan meihin!',
  description_fi = 'Tule mukaan rentoon BizVibe-tapaamiseen. Tapaat perustajajäsenet, kollektiivin, ja muita devaajia. Tule kuulemaan, mistä BizVibessa on kyse, miten eri tasot tarjoavat sinulle ja miten pääset mukaan.',
  location_fi = 'Turku (paikka TBA)'
WHERE title = 'BizVibe MeetUp: Get to know us!'
  AND starts_at >= '2026-06-10T00:00:00Z'
  AND starts_at < '2026-06-11T00:00:00Z';