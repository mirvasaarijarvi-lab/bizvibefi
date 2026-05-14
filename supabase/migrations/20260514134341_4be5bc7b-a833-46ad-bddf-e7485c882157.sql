UPDATE public.events 
SET 
  title = 'BizVibe MeetUp: Tule tutustumaan meihin!',
  description = 'Tule mukaan rentoon BizVibe-tapaamiseen. Tapaat perustajajäsenet, kollektiivin, ja muita devaajia. Tule kuulemaan, mistä BizVibessa on kyse, miten eri tasot tarjoavat sinulle ja miten pääset mukaan.'
WHERE title = 'BizVibe MeetUp: Get to know us!' 
AND starts_at >= '2026-06-10T00:00:00Z' 
AND starts_at < '2026-06-11T00:00:00Z';