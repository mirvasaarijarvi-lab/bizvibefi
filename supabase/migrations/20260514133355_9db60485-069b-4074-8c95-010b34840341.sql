DELETE FROM public.events;
INSERT INTO public.events (title, description, event_type, starts_at, ends_at, location, is_online, is_published)
VALUES (
  'GoodVibesCafe MeetUp: Get to know us!',
  'Join us for a relaxed GoodVibesCafe MeetUp. Meet the founders, the collective, and fellow builders. Find out what GoodVibesCafe is about, how the tiers work, and how you can get involved.',
  'meetup',
  '2026-06-10 17:00:00+03',
  '2026-06-10 20:00:00+03',
  'Helsinki (venue TBA)',
  false,
  true
);