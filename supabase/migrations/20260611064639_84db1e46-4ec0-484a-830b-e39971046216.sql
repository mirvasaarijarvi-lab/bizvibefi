ALTER TABLE public.event_feedback
  ADD COLUMN IF NOT EXISTS responses jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.events
SET agenda = 'Case study: bespoke Wiurila reservation platform + SaaS
Business Turku StartUpHub: Agentic Forecasting Platform for the Turku Region (for the city and the businesses)
Fintraffic Presents: Award-Winning Traffic Data Innovations & AI-Powered Vibe Coding'
WHERE id = 'e4bf8bb5-1394-4a30-aac6-ab78f08ab2dd';