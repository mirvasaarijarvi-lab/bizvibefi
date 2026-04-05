
-- Event type enum
CREATE TYPE public.event_type AS ENUM ('meetup', 'webinar', 'workshop', 'hackathon');

-- RSVP status enum
CREATE TYPE public.rsvp_status AS ENUM ('going', 'maybe', 'cancelled');

-- Events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL DEFAULT 'meetup',
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE,
  location TEXT,
  is_online BOOLEAN NOT NULL DEFAULT false,
  online_url TEXT,
  max_attendees INTEGER,
  image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published events" ON public.events
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage events" ON public.events
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Event RSVPs
CREATE TABLE public.event_rsvps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status rsvp_status NOT NULL DEFAULT 'going',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own RSVPs" ON public.event_rsvps
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can RSVP" ON public.event_rsvps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RSVP" ON public.event_rsvps
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own RSVP" ON public.event_rsvps
  FOR DELETE USING (auth.uid() = user_id);

-- Allow anyone to see RSVP counts (not individual RSVPs)
CREATE OR REPLACE FUNCTION public.get_event_rsvp_count(_event_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.event_rsvps
  WHERE event_id = _event_id AND status = 'going'
$$;

-- Seed some sample events
INSERT INTO public.events (title, description, event_type, starts_at, ends_at, location, is_online, is_published) VALUES
  ('BizVibe Monthly Meetup', 'Connect with fellow builders, share wins, and find collaborators. Casual networking with a purpose.', 'meetup', now() + interval '14 days', now() + interval '14 days' + interval '2 hours', 'Helsinki, Finland', false, true),
  ('Vibecoding 101 — Build Your First App', 'A hands-on webinar where we build a real product from scratch in 90 minutes. No prior coding experience needed.', 'webinar', now() + interval '7 days', now() + interval '7 days' + interval '90 minutes', null, true, true),
  ('#ShipHappens Hackathon Q2', '48 hours. 3 builders. 1 shipped product. Join the quarterly hackathon and build something real.', 'hackathon', now() + interval '30 days', now() + interval '32 days', 'Helsinki, Finland', false, true),
  ('Growth Without Overhead Workshop', 'Learn how to scale your business using collective resources. Real strategies from real founders.', 'workshop', now() + interval '21 days', now() + interval '21 days' + interval '3 hours', null, true, true);
