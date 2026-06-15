-- Connection-role probe used by the CI matrix (.github/workflows/security.yml).
-- Run as a specific role via:
--   psql "$DB_URL" -v role=anon -f supabase/tests/rls/role_probe.sql
--
-- Emits three plain-text markers psql captures on stdout; the workflow
-- parses them to decide pass/fail per role.

\set ON_ERROR_STOP 0
SET ROLE :"role";

-- Public RPCs: both must execute without error.
SELECT 'rpc_leaderboard_ok=' || ((SELECT count(*) >= 0
  FROM public.get_badge_leaderboard()))::text;

SELECT 'rpc_rsvp_count_ok=' || (
  SELECT (public.get_event_rsvp_count(id) IS NOT NULL)::text
  FROM public.events LIMIT 1
);

-- Direct write probe on a privileged table. anon/authenticated must hit
-- RLS (SQLSTATE 42501); service_role bypasses RLS and should succeed.
DO $$
DECLARE
  v_badge uuid;
  v_user  uuid := gen_random_uuid();
BEGIN
  SELECT id INTO v_badge FROM public.badge_catalog LIMIT 1;
  IF v_badge IS NULL THEN
    RAISE NOTICE 'write_sqlstate=NO_BADGE';
    RETURN;
  END IF;
  BEGIN
    INSERT INTO public.member_badges(user_id, badge_id) VALUES (v_user, v_badge);
    RAISE NOTICE 'write_sqlstate=00000';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'write_sqlstate=%', SQLSTATE;
  END;
END
$$;
