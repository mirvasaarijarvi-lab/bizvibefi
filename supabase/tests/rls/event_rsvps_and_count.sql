-- RLS regression: public.event_rsvps + get_event_rsvp_count RPC.
--
-- Rules under test:
--   * RSVP rows are visible only to the owner and to admins (no anon reads).
--   * A user can RSVP themselves but cannot insert an RSVP under another
--     user_id (WITH CHECK auth.uid() = user_id).
--   * A user can only update / delete their own RSVP.
--   * get_event_rsvp_count(_event_id) is callable by anyone and returns the
--     correct aggregate (rsvps "going" + guest signups), without leaking PII.
\set ON_ERROR_STOP on
\ir _helpers.sql

BEGIN;

\echo '== event_rsvps: anon cannot read, users see only own =='

DO $t$
DECLARE
  v_event  uuid := rls_test.fx_open_event();
  v_user_a uuid := rls_test.fx_user();
  v_user_b uuid := rls_test.fx_user();
BEGIN
  -- Seed two RSVPs as postgres (bypasses RLS).
  INSERT INTO public.event_rsvps (event_id, user_id, status)
  VALUES (v_event, v_user_a, 'going'),
         (v_event, v_user_b, 'going');

  PERFORM rls_test.as_anon();
  PERFORM rls_test.expect_count(
    'SELECT count(*) FROM public.event_rsvps',
    0, 'anon cannot read event_rsvps');

  PERFORM rls_test.as_authenticated(v_user_a);
  PERFORM rls_test.expect_count(
    'SELECT count(*) FROM public.event_rsvps',
    1, 'user A sees exactly one row (their own)');

  PERFORM rls_test.as_authenticated(v_user_b);
  PERFORM rls_test.expect_count(
    'SELECT count(*) FROM public.event_rsvps',
    1, 'user B sees exactly one row (their own)');

  PERFORM rls_test.reset();
END
$t$;

\echo '== event_rsvps: users can only insert / mutate their own row =='

DO $t$
DECLARE
  v_event  uuid := rls_test.fx_open_event();
  v_user_a uuid := rls_test.fx_user();
  v_user_b uuid := rls_test.fx_user();
BEGIN
  PERFORM rls_test.as_authenticated(v_user_a);

  -- Allowed: RSVP under own uid
  PERFORM rls_test.expect_allowed(
    format('INSERT INTO public.event_rsvps(event_id, user_id, status)
            VALUES (%L, %L, ''going'')', v_event, v_user_a),
    'user A can RSVP themselves');

  -- Denied: RSVP under someone else's uid
  PERFORM rls_test.expect_denied(
    format('INSERT INTO public.event_rsvps(event_id, user_id, status)
            VALUES (%L, %L, ''going'')', v_event, v_user_b),
    'user A cannot RSVP on behalf of user B');

  -- Seed user B row as postgres so user A has a target to (not) modify.
  PERFORM rls_test.reset();
  INSERT INTO public.event_rsvps(event_id, user_id, status)
  VALUES (v_event, v_user_b, 'going');

  PERFORM rls_test.as_authenticated(v_user_a);
  -- UPDATE/DELETE against B's row: USING clause filters it out, so the
  -- statement succeeds but affects 0 rows.
  PERFORM rls_test.expect_count(
    format($q$
      WITH d AS (
        DELETE FROM public.event_rsvps
        WHERE event_id = %L AND user_id = %L
        RETURNING 1
      ) SELECT count(*) FROM d
    $q$, v_event, v_user_b),
    0, 'user A''s DELETE cannot reach user B''s RSVP');

  PERFORM rls_test.reset();
END
$t$;

\echo '== get_event_rsvp_count is public and aggregates correctly =='

DO $t$
DECLARE
  v_event  uuid := rls_test.fx_open_event();
  v_user_a uuid := rls_test.fx_user();
  v_user_b uuid := rls_test.fx_user();
  v_before bigint;
  v_after  bigint;
BEGIN
  -- Reset to a clean slate for this event so the delta is deterministic.
  DELETE FROM public.event_rsvps  WHERE event_id = v_event;
  DELETE FROM public.event_signups WHERE event_id = v_event;

  PERFORM rls_test.as_anon();
  EXECUTE format('SELECT public.get_event_rsvp_count(%L)', v_event) INTO v_before;
  IF v_before IS DISTINCT FROM 0 THEN
    RAISE EXCEPTION 'FAIL: baseline rsvp count expected 0, got %', v_before;
  END IF;
  PERFORM rls_test.reset();

  -- Seed: 2 "going" RSVPs + 1 guest signup => count must be 3.
  INSERT INTO public.event_rsvps(event_id, user_id, status)
  VALUES (v_event, v_user_a, 'going'),
         (v_event, v_user_b, 'going');
  INSERT INTO public.event_signups(event_id, full_name, email)
  VALUES (v_event, 'Guest', 'guest@example.com');

  PERFORM rls_test.as_anon();
  PERFORM rls_test.expect_equals(
    format('SELECT public.get_event_rsvp_count(%L)::text', v_event),
    '3', 'anon sees the correct aggregated RSVP count (rsvps + signups)');

  PERFORM rls_test.as_authenticated(v_user_a);
  PERFORM rls_test.expect_equals(
    format('SELECT public.get_event_rsvp_count(%L)::text', v_event),
    '3', 'authenticated user sees the same aggregated count');

  PERFORM rls_test.reset();
END
$t$;

ROLLBACK;
\echo 'event_rsvps_and_count: OK'
