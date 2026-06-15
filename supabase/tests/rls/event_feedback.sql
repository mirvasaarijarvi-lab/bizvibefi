-- RLS regression: public.event_feedback table + get_event_feedback_public RPC.
--
-- Rules under test:
--   * Direct SELECT on event_feedback is admin-only (no anon / no non-admin).
--   * Direct INSERT on event_feedback is always blocked (WITH CHECK false);
--     real submissions go through the submit-event-feedback edge function.
--   * get_event_feedback_public(_event_id) is callable by anyone but only
--     returns rows for events ended >2 days ago AND is_published = true.
--     Email is never returned.
\set ON_ERROR_STOP on
\ir _helpers.sql

BEGIN;

\echo '== event_feedback: direct table access is locked down =='

DO $t$
DECLARE
  v_event uuid := rls_test.fx_past_event();
  v_open  uuid := rls_test.fx_open_event();
  v_user  uuid := rls_test.fx_user();
BEGIN
  -- Seed two feedback rows (one for the past event, one for the future one).
  INSERT INTO public.event_feedback (event_id, name, email, overall_rating, comments)
  VALUES (v_event, 'Past Voter',   'past@example.com',   5, 'Loved it'),
         (v_open,  'Future Voter', 'future@example.com', 4, 'Looking forward');

  PERFORM rls_test.as_anon();
  PERFORM rls_test.expect_count(
    'SELECT count(*) FROM public.event_feedback',
    0, 'anon cannot read event_feedback');
  PERFORM rls_test.expect_denied(
    format('INSERT INTO public.event_feedback(event_id, name, email, overall_rating)
            VALUES (%L, %L, %L, %s)', v_event, 'X', 'x@x.test', 5),
    'anon cannot INSERT into event_feedback');

  PERFORM rls_test.as_authenticated(v_user);
  PERFORM rls_test.expect_count(
    'SELECT count(*) FROM public.event_feedback',
    0, 'authenticated non-admin cannot read event_feedback');
  PERFORM rls_test.expect_denied(
    format('INSERT INTO public.event_feedback(event_id, name, email, overall_rating)
            VALUES (%L, %L, %L, %s)', v_event, 'Y', 'y@y.test', 5),
    'authenticated non-admin cannot INSERT into event_feedback');

  PERFORM rls_test.reset();
END
$t$;

\echo '== get_event_feedback_public respects the 2-day visibility window =='

DO $t$
DECLARE
  v_past uuid := rls_test.fx_past_event();
  v_open uuid := rls_test.fx_open_event();
BEGIN
  -- Past event (>2 days after end): rows are visible.
  PERFORM rls_test.as_anon();
  PERFORM rls_test.expect_count(
    format('SELECT count(*) FROM public.get_event_feedback_public(%L)', v_past),
    1, 'anon sees feedback for events that ended >2 days ago');

  -- Future event: never visible, even with feedback rows present.
  PERFORM rls_test.expect_count(
    format('SELECT count(*) FROM public.get_event_feedback_public(%L)', v_open),
    0, 'anon does NOT see feedback for upcoming events');

  -- Email column must never be returned by the public RPC. Cast the row to
  -- text and confirm the email substring is not present.
  PERFORM rls_test.expect_count(
    format($q$
      SELECT count(*) FROM public.get_event_feedback_public(%L) f
      WHERE f::text LIKE '%%@example.com%%'
    $q$, v_past),
    0, 'public feedback RPC never exposes email');

  PERFORM rls_test.reset();
END
$t$;

ROLLBACK;
\echo 'event_feedback: OK'
