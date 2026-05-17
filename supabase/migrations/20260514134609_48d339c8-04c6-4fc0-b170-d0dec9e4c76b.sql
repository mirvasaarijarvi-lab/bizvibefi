UPDATE public.events 
SET 
  title = 'GoodVibesCafe MeetUp: Get to know us!',
  description = 'Join us for a relaxed GoodVibesCafe MeetUp. Meet the founders, the collective, and fellow builders. Find out what GoodVibesCafe is about, how the tiers work, and how you can get involved.',
  location = 'Turku (venue TBA)'
WHERE starts_at >= '2026-06-10T00:00:00Z' 
AND starts_at < '2026-06-11T00:00:00Z';