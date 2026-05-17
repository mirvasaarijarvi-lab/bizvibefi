UPDATE public.events 
SET 
  title = 'GoodVibesCafe MeetUp: Tule tutustumaan meihin!',
  description = 'Tule mukaan rentoon GoodVibesCafe-tapaamiseen. Tapaat perustajajäsenet, kollektiivin, ja muita devaajia. Tule kuulemaan, mistä GoodVibesCafessa on kyse, miten eri tasot tarjoavat sinulle ja miten pääset mukaan.'
WHERE title = 'GoodVibesCafe MeetUp: Get to know us!' 
AND starts_at >= '2026-06-10T00:00:00Z' 
AND starts_at < '2026-06-11T00:00:00Z';