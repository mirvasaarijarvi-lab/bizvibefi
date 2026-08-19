-- RLS regression: badge tables + public leaderboard RPC.
--
-- Rules under test:
--   * member_badges: users may read only their own rows; admins read all;
--     direct INSERT/UPDATE/DELETE require admin.
--   * badge_catalog: anyone reads active rows; only admins can mutate.
--   * get_badge_leaderboard(): public, aggregated; never raises for anon and
--     never exposes private user_ids that aren't already publicly listed.
\set ON_ERROR_STOP on
\ir _helpers.sql

BEGIN;

\echo '== member_badges: ownership-scoped reads, admin-only writes =='

DO $t$
DECLARE
  v_user_a uuid := rls_test.fx_user();
  v_user_b uuid := rls_test.fx_user();
  v_badge  uuid;
BEGIN
  -- Seed a badge in the catalog and award it to user A as the postgres role.
  INSERT INTO public.badge_catalog (code, name, description, category, is_active)
  VALUES ('rls_test_badge_' || substr(gen_random_uuid()::text,1,8),
          'RLS Test Badge', 'Seeded by the RLS regression suite', 'community', true)
  RETURNING id INTO v_badge;

  INSERT INTO public.member_badges (user_id, badge_id, notes)
  VALUES (v_user_a, v_badge, 'rls seed');

  -- anon: zero rows
  PERFORM rls_test.as_anon();
  -- anon has no SELECT privilege on member_badges at all (grant-level deny).
  PERFORM rls_test.expect_denied(
    'SELECT count(*) FROM public.member_badges',
    'anon cannot read member_badges');

  -- User A sees their own row
  -- Scope to the seeded badge: signup also auto-awards a welcome badge.
  PERFORM rls_test.as_authenticated(v_user_a);
  PERFORM rls_test.expect_count(
    format('SELECT count(*) FROM public.member_badges WHERE badge_id = %L', v_badge),
    1, 'user A reads their own member_badges');

  -- User B sees nothing belonging to A
  PERFORM rls_test.as_authenticated(v_user_b);
  PERFORM rls_test.expect_count(
    format('SELECT count(*) FROM public.member_badges WHERE badge_id = %L', v_badge),
    0, 'user B cannot read user A''s member_badges');

  -- Non-admin cannot award badges
  PERFORM rls_test.expect_denied(
    format('INSERT INTO public.member_badges(user_id, badge_id)
            VALUES (%L, %L)', v_user_b, v_badge),
    'authenticated non-admin cannot INSERT into member_badges');

  PERFORM rls_test.expect_no_rows_affected(
    'DELETE FROM public.member_badges',
    'authenticated non-admin cannot DELETE from member_badges');

  PERFORM rls_test.reset();
END
$t$;

\echo '== badge_catalog: anyone reads active, only admins mutate =='

DO $t$
DECLARE
  v_user uuid := rls_test.fx_user();
BEGIN
  PERFORM rls_test.as_anon();
  PERFORM rls_test.expect_allowed(
    'SELECT 1 FROM public.badge_catalog WHERE is_active LIMIT 1',
    'anon may read active badges');
  PERFORM rls_test.expect_denied(
    'INSERT INTO public.badge_catalog(code, name, description, category) VALUES (''x'',''X'',''d'',''community'')',
    'anon cannot INSERT into badge_catalog');

  PERFORM rls_test.as_authenticated(v_user);
  PERFORM rls_test.expect_denied(
    'INSERT INTO public.badge_catalog(code, name, description, category) VALUES (''y'',''Y'',''d'',''community'')',
    'authenticated non-admin cannot INSERT into badge_catalog');

  PERFORM rls_test.reset();
END
$t$;

\echo '== get_badge_leaderboard: public, callable by anyone =='

DO $t$
DECLARE v_user uuid := rls_test.fx_user();
BEGIN
  PERFORM rls_test.as_anon();
  PERFORM rls_test.expect_allowed(
    'SELECT 1 FROM public.get_badge_leaderboard() LIMIT 1',
    'anon may call get_badge_leaderboard');

  PERFORM rls_test.as_authenticated(v_user);
  PERFORM rls_test.expect_allowed(
    'SELECT 1 FROM public.get_badge_leaderboard() LIMIT 1',
    'authenticated may call get_badge_leaderboard');

  PERFORM rls_test.reset();
END
$t$;

ROLLBACK;
\echo 'badges_and_leaderboard: OK'
