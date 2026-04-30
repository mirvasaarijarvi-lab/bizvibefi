-- ========= ENUMS =========
CREATE TYPE public.badge_claim_status AS ENUM ('pending_peer','pending_review','approved','rejected');

-- ========= CATALOG =========
-- Holds every badge definition (categories, subcategories, tier milestones, partner, etc.)
CREATE TABLE public.badge_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,                 -- e.g. 'event_attendance_5', 'content_failures_1'
  category text NOT NULL,                    -- e.g. 'event_attendance','content','subscription_years','serendipity','intro','invite','booster','time_invest','sponsoring','speaker','shipped','beta','tutoring','mentoring','publicity','physical_product','futurist','launch','ambassador','partner','news','signin','founder'
  subcategory text,                          -- e.g. 'projects','code','infographs','training','expertise','testimonials','tools','guidebooks','failures'
  tier integer,                              -- milestone number (1,5,10,20,...) where applicable
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'Award',        -- Lucide icon name
  color text NOT NULL DEFAULT 'primary',     -- semantic token name
  bonus_points integer NOT NULL DEFAULT 0,   -- extra points on top of base 1
  requires_peer boolean NOT NULL DEFAULT false,
  requires_founder boolean NOT NULL DEFAULT true,
  is_diamond boolean NOT NULL DEFAULT false, -- e.g. failures
  evidence_hint text,                        -- prompt shown in claim form
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.badge_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active badges" ON public.badge_catalog
  FOR SELECT USING (is_active = true OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role));
CREATE POLICY "Admins manage catalog" ON public.badge_catalog
  FOR ALL USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role));

-- ========= CLAIMS =========
CREATE TABLE public.badge_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_id uuid NOT NULL REFERENCES public.badge_catalog(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,                     -- who is claiming
  evidence text NOT NULL,                    -- text describing qualification, links, counts
  peer_user_id uuid,                         -- optional, person to validate
  peer_confirmed boolean,                    -- null=pending, true/false
  peer_confirmed_at timestamptz,
  status public.badge_claim_status NOT NULL DEFAULT 'pending_review',
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.badge_claims ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_claims_user ON public.badge_claims(user_id);
CREATE INDEX idx_claims_peer ON public.badge_claims(peer_user_id);
CREATE INDEX idx_claims_status ON public.badge_claims(status);

CREATE POLICY "Users see own claims, peers see relevant, admins all" ON public.badge_claims
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() = peer_user_id
    OR has_role(auth.uid(),'admin'::app_role)
    OR has_role(auth.uid(),'superadmin'::app_role)
  );
CREATE POLICY "Users create own claims" ON public.badge_claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Update: claimant can edit while still pending_peer/pending_review (evidence), peer can confirm/decline, admins finalise
CREATE POLICY "Update own or peer or admin" ON public.badge_claims
  FOR UPDATE USING (
    (auth.uid() = user_id AND status IN ('pending_peer','pending_review'))
    OR auth.uid() = peer_user_id
    OR has_role(auth.uid(),'admin'::app_role)
    OR has_role(auth.uid(),'superadmin'::app_role)
  );
CREATE POLICY "Admins delete claims" ON public.badge_claims
  FOR DELETE USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role));

-- Trigger: only admins may flip to approved/rejected; peer can only set peer_confirmed
CREATE OR REPLACE FUNCTION public.guard_badge_claim_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  is_admin boolean := has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role);
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status IN ('approved','rejected') AND NOT is_admin THEN
      RAISE EXCEPTION 'Only admins can approve or reject claims';
    END IF;
  END IF;
  -- Stamp reviewer
  IF is_admin AND NEW.status IN ('approved','rejected') AND OLD.status NOT IN ('approved','rejected') THEN
    NEW.reviewed_by := auth.uid();
    NEW.reviewed_at := now();
  END IF;
  -- Peer confirmation stamp
  IF NEW.peer_confirmed IS DISTINCT FROM OLD.peer_confirmed AND NEW.peer_confirmed IS NOT NULL THEN
    NEW.peer_confirmed_at := now();
    -- once peer confirms, move to founder review (if it was pending_peer)
    IF NEW.peer_confirmed = true AND OLD.status = 'pending_peer' THEN
      NEW.status := 'pending_review';
    END IF;
    IF NEW.peer_confirmed = false AND OLD.status = 'pending_peer' THEN
      NEW.status := 'rejected';
      NEW.rejection_reason := COALESCE(NEW.rejection_reason,'Peer declined the claim');
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END$$;
CREATE TRIGGER trg_guard_badge_claims BEFORE UPDATE ON public.badge_claims
  FOR EACH ROW EXECUTE FUNCTION public.guard_badge_claim_changes();

-- ========= AWARDED BADGES =========
CREATE TABLE public.member_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badge_catalog(id) ON DELETE CASCADE,
  claim_id uuid REFERENCES public.badge_claims(id) ON DELETE SET NULL,
  awarded_by uuid,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  UNIQUE(user_id, badge_id)
);
ALTER TABLE public.member_badges ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_member_badges_user ON public.member_badges(user_id);

CREATE POLICY "Anyone can view member badges" ON public.member_badges
  FOR SELECT USING (true);
CREATE POLICY "Admins insert badges" ON public.member_badges
  FOR INSERT WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role));
CREATE POLICY "Admins update badges" ON public.member_badges
  FOR UPDATE USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role));
CREATE POLICY "Admins delete badges" ON public.member_badges
  FOR DELETE USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role));

-- Auto-award when claim becomes approved
CREATE OR REPLACE FUNCTION public.auto_award_on_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    INSERT INTO public.member_badges (user_id, badge_id, claim_id, awarded_by)
    VALUES (NEW.user_id, NEW.badge_id, NEW.id, auth.uid())
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  RETURN NEW;
END$$;
CREATE TRIGGER trg_auto_award AFTER UPDATE ON public.badge_claims
  FOR EACH ROW EXECUTE FUNCTION public.auto_award_on_approval();

-- ========= LEADERBOARD VIEW (security-definer fn to avoid RLS recursion) =========
CREATE OR REPLACE FUNCTION public.get_badge_leaderboard()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  membership_tier membership_tier,
  badge_count bigint,
  total_points bigint,
  is_founder boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  WITH founder_ids AS (
    SELECT user_id FROM public.member_badges mb
    JOIN public.badge_catalog bc ON bc.id = mb.badge_id
    WHERE bc.category = 'founder'
  ),
  scored AS (
    SELECT
      mb.user_id,
      COUNT(*)::bigint AS badge_count,
      COALESCE(SUM(1 + bc.bonus_points),0)::bigint AS total_points
    FROM public.member_badges mb
    JOIN public.badge_catalog bc ON bc.id = mb.badge_id
    GROUP BY mb.user_id
  )
  SELECT
    s.user_id,
    p.display_name,
    p.avatar_url,
    p.membership_tier,
    s.badge_count,
    s.total_points,
    EXISTS(SELECT 1 FROM founder_ids f WHERE f.user_id = s.user_id) AS is_founder
  FROM scored s
  LEFT JOIN public.profiles p ON p.user_id = s.user_id
  ORDER BY s.total_points DESC, s.badge_count DESC, p.display_name ASC;
$$;

-- updated_at trigger for catalog
CREATE TRIGGER trg_catalog_touch BEFORE UPDATE ON public.badge_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();