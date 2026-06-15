-- RLS regression: feedback / leaderboard / badges / RSVP-count RPCs
--
-- These four RPC families are intentionally callable by anon (they power
-- public event pages and the members leaderboard). This file pins down
-- both sides of that contract so a future migration cannot quietly:
--
--   (a) revoke EXECUTE from anon on a public RPC (would break the site), or
--   (b) widen privileges so anon can write to the underlying tables
--       (event_feedback, member_badges, event_rsvps) without going through
--       the controlled RPC path.
--
-- Unauthorized writes are expected to fail with SQLSTATE 42501
-- (insufficient_privilege) — RLS denies the row, which surfaces as 42501
-- to the client.
\set ON_ERROR_STOP on
\ir _helpers.sql

BEGIN;

\echo '== public RPCs remain executable by anon and authenticated =='

DO $t$
DECLARE
  v_past  uuid := rls_test.fx_past_event();
  v_open  uuid := rls_test.fx_open_event();
  v_user  uuid := rls_test.fx_user();
BEGIN
  PERFORM rls_test.snapshot_fixtures();

  -- ----- anon side -----
  PERFORM rls_test.as_anon();

  PERFORM rls_test.expect_allowed(
    format('SELECT 1 FROM public.get_event_feedback_public(%L)', v_past),
    'anon may call get_event_feedback_public');

  PERFORM rls_test.expect_allowed(
    'SELECT 1 FROM public.get_badge_leaderboard()',
    'anon may call get_badge_leaderboard');

  PERFORM rls_test.expect_allowed(
    format('SELECT public.get_event_rsvp_count(%L)', v_open),
    'anon may call get_event_rsvp_count');

  -- ----- authenticated non-admin side -----
  PERFORM rls_test.as_authenticated(v_user);

  PERFORM rls_test.expect_allowed(
    format('SELECT 1 FROM public.get_event_feedback_public(%L)', v_past),
    'authenticated non-admin may call get_event_feedback_public');

  PERFORM rls_test.expect_allowed(
    'SELECT 1 FROM public.get_badge_leaderboard()',
    'authenticated non-admin may call get_badge_leaderboard');

  PERFORM rls_test.expect_allowed(
    format('SELECT public.get_event_rsvp_count(%L)', v_open),
    'authenticated non-admin may call get_event_rsvp_count');

  PERFORM rls_test.reset();
END
$t$;

\echo '== unauthorized writes through the underlying tables raise 42501 =='

DO $t$
DECLARE
  v_open  uuid := rls_test.fx_open_event();
  v_past  uuid := rls_test.fx_past_event();
  v_user  uuid := rls_test.fx_user();
  v_other uuid := rls_test.fx_user();
  v_badge uuid;
BEGIN
  -- Pick any badge from the catalog if one exists; if not, create one as
  -- table owner so the INSERT assertions have a valid FK target.
  SELECT id INTO v_badge FROM public.badge_catalog LIMIT 1;
  IF v_badge IS NULL THEN
    INSERT INTO public.badge_catalog (code, name, category, is_active)
    VALUES ('rls_probe_' || substr(gen_random_uuid()::text,1,8),
            'RLS Probe', 'community', true)
    RETURNING id INTO v_badge;
  END IF;

  PERFORM rls_test.snapshot('badge_catalog.probe', $q$
    SELECT id, code, category FROM public.badge_catalog
    WHERE id = (SELECT id FROM public.badge_catalog LIMIT 1)
  $q$);

  -- ----- anon: every direct write must fail with 42501 -----
  PERFORM rls_test.as_anon();

  PERFORM rls_test.expect_sqlstate(
    format($x$INSERT INTO public.event_feedback
              (event_id, overall_rating, comments)
              VALUES (%L, 5, 'rls probe')$x$, v_past),
    '42501',
    'anon cannot INSERT into event_feedback directly');

  PERFORM rls_test.expect_sqlstate(
    format($x$INSERT INTO public.member_badges (user_id, badge_id)
              VALUES (%L, %L)$x$, v_user, v_badge),
    '42501',
    'anon cannot INSERT into member_badges');

  PERFORM rls_test.expect_sqlstate(
    'DELETE FROM public.member_badges WHERE true',
    '42501',
    'anon cannot DELETE from member_badges');

  PERFORM rls_test.expect_sqlstate(
    format($x$INSERT INTO public.event_rsvps (event_id, user_id, status)
              VALUES (%L, %L, 'going')$x$, v_open, v_user),
    '42501',
    'anon cannot INSERT into event_rsvps');

  PERFORM rls_test.expect_sqlstate(
    'DELETE FROM public.event_rsvps WHERE true',
    '42501',
    'anon cannot DELETE from event_rsvps');

  -- ----- authenticated non-admin: cross-user writes must fail with 42501 -----
  PERFORM rls_test.as_authenticated(v_user);

  PERFORM rls_test.expect_sqlstate(
    format($x$INSERT INTO public.member_badges (user_id, badge_id)
              VALUES (%L, %L)$x$, v_user, v_badge),
    '42501',
    'authenticated user cannot self-award member_badges');

  PERFORM rls_test.expect_sqlstate(
    format($x$INSERT INTO public.event_rsvps (event_id, user_id, status)
              VALUES (%L, %L, 'going')$x$, v_open, v_other),
    '42501',
    'authenticated user cannot RSVP another user');

  PERFORM rls_test.reset();
END
$t$;

ROLLBACK;
