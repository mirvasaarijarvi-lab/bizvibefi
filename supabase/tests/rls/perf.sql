-- Performance regression: RLS-filtered reads must stay under threshold.
--
-- Why this exists:
--   Adding helper functions, recursive policies, or unindexed joins to RLS
--   can silently 10x the cost of every query on a hot table. This file runs
--   the most-exercised RLS-gated reads/RPCs under both anon and authenticated
--   roles, against a non-trivial seeded dataset, and fails the PR if the
--   best of N runs exceeds the threshold.
--
-- Tuning:
--   Thresholds are intentionally generous (sub-second) for the GitHub-hosted
--   runner. Use `expect_under_ms(sql, max_ms, msg [, runs])`. Override per
--   query, not globally — a regression is a query whose floor moves.
\set ON_ERROR_STOP on
\ir _helpers.sql

BEGIN;

\echo '== seed: ~500 rows per hot table for realistic timings =='

DO $seed$
DECLARE
  v_open uuid := rls_test.fx_open_event();
  v_past uuid := rls_test.fx_past_event();
  v_item uuid := rls_test.fx_showcase_item();
  v_user uuid;
  v_badge uuid;
  i int;
BEGIN
  -- One catalog badge, awarded to many users.
  INSERT INTO public.badge_catalog (code, name, description, category, is_active)
  VALUES ('rls_perf_badge_' || substr(gen_random_uuid()::text,1,8),
          'RLS Perf Badge', 'Seeded by the RLS regression suite', 'community', true)
  RETURNING id INTO v_badge;

  FOR i IN 1..500 LOOP
    v_user := gen_random_uuid();
    INSERT INTO public.event_signups(event_id, full_name, email, company)
      VALUES (v_open, 'Guest ' || i, 'guest-' || i || '@example.com', 'Perf Oy');
    INSERT INTO public.event_rsvps(event_id, user_id, status)
      VALUES (v_open, v_user, 'going');
    INSERT INTO public.event_feedback(event_id, name, email, overall_rating, comments)
      VALUES (v_past, 'Voter ' || i, 'voter-' || i || '@example.com',
              ((i % 5) + 1)::smallint, 'comment ' || i);
    INSERT INTO public.member_badges(user_id, badge_id, notes)
      VALUES (v_user, v_badge, 'perf seed ' || i);
    INSERT INTO public.showcase_file_downloads(item_id, file_url, file_name, user_id, user_email)
      VALUES (v_item, 'https://example.test/f' || i || '.pdf', 'f' || i || '.pdf',
              v_user, 'user-' || i || '@example.com');
  END LOOP;

  -- Warm the planner once at the outer transaction level.
  ANALYZE public.event_signups;
  ANALYZE public.event_rsvps;
  ANALYZE public.event_feedback;
  ANALYZE public.member_badges;
  ANALYZE public.showcase_file_downloads;
END
$seed$;

\echo '== RLS-filtered reads (anon) =='

DO $t$
DECLARE
  v_open uuid := rls_test.fx_open_event();
  v_past uuid := rls_test.fx_past_event();
BEGIN
  PERFORM rls_test.as_anon();

  -- All four tables must return 0 rows quickly even when the table is large,
  -- because the RLS plan should short-circuit on the role check (not scan).
  PERFORM rls_test.expect_under_ms(
    'SELECT count(*) FROM public.event_signups',
    150, 'anon SELECT event_signups (RLS denies)');

  PERFORM rls_test.expect_under_ms(
    'SELECT count(*) FROM public.event_rsvps',
    150, 'anon SELECT event_rsvps (RLS denies)');

  PERFORM rls_test.expect_under_ms(
    'SELECT count(*) FROM public.event_feedback',
    150, 'anon SELECT event_feedback (RLS denies)');

  PERFORM rls_test.expect_under_ms(
    'SELECT count(*) FROM public.showcase_file_downloads',
    150, 'anon SELECT showcase_file_downloads (RLS denies)');

  PERFORM rls_test.expect_under_ms(
    'SELECT count(*) FROM public.member_badges',
    150, 'anon SELECT member_badges (RLS denies)');

  -- Public RPCs: must stay fast under load.
  PERFORM rls_test.expect_under_ms(
    format('SELECT public.get_event_rsvp_count(%L)', v_open),
    200, 'get_event_rsvp_count (anon, ~500 rsvps + signups)');

  PERFORM rls_test.expect_under_ms(
    format('SELECT count(*) FROM public.get_event_feedback_public(%L)', v_past),
    300, 'get_event_feedback_public (anon, ~500 rows in window)');

  PERFORM rls_test.expect_under_ms(
    'SELECT count(*) FROM public.get_badge_leaderboard()',
    400, 'get_badge_leaderboard (anon, aggregates over ~500 awards)');

  PERFORM rls_test.reset();
END
$t$;

\echo '== ownership-filtered reads (authenticated) =='

DO $t$
DECLARE
  v_user uuid := rls_test.fx_user();
BEGIN
  PERFORM rls_test.as_authenticated(v_user);

  -- Owner-scoped policies must still be fast — they should hit an index on
  -- user_id, not scan the whole table.
  PERFORM rls_test.expect_under_ms(
    'SELECT count(*) FROM public.event_rsvps',
    200, 'authenticated SELECT event_rsvps (own rows only, indexed)');

  PERFORM rls_test.expect_under_ms(
    'SELECT count(*) FROM public.member_badges',
    200, 'authenticated SELECT member_badges (own rows only, indexed)');

  -- Helper functions hit very often by the UI — keep tight.
  PERFORM rls_test.expect_under_ms(
    format('SELECT public.has_role(%L, ''admin''::app_role)', v_user),
    50, 'has_role(self, admin) is sub-50ms');

  PERFORM rls_test.expect_under_ms(
    format('SELECT public.has_viber_access(%L)', v_user),
    50, 'has_viber_access(self) is sub-50ms');

  PERFORM rls_test.reset();
END
$t$;

ROLLBACK;
\echo 'perf: OK'
