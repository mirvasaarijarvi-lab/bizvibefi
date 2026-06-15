-- RLS regression: public.event_signups
\set ON_ERROR_STOP on
\ir _helpers.sql

BEGIN;

\echo '== event_signups =='

DO $t$
DECLARE
  v_open   uuid := rls_test.fx_open_event();
  v_locked uuid := rls_test.fx_locked_event();
  v_user   uuid := rls_test.fx_user();
BEGIN
  -- Seed one PII row as postgres so reads have something to (not) return.
  INSERT INTO public.event_signups (event_id, full_name, email, phone, company)
  VALUES (v_open, 'PII Probe', 'pii-probe@example.com', '+358000000', 'Probe Oy');

  -- Snapshot the rows this file is asserting against so a mismatch in CI
  -- ("expected 0, got 1") is debuggable from the rls-fixtures.md artifact
  -- without re-running the suite locally.
  PERFORM rls_test.snapshot_fixtures();
  PERFORM rls_test.snapshot('event_signups.seeded', $q$
    SELECT id, event_id, full_name, email FROM public.event_signups
    WHERE email = 'pii-probe@example.com'
  $q$);


  -- anon: zero rows visible
  PERFORM rls_test.as_anon();
  PERFORM rls_test.expect_count(
    'SELECT count(*) FROM public.event_signups',
    0, 'anon cannot read event_signups');

  -- authenticated non-admin: zero rows visible
  PERFORM rls_test.as_authenticated(v_user);
  PERFORM rls_test.expect_count(
    'SELECT count(*) FROM public.event_signups',
    0, 'authenticated non-admin cannot read event_signups');

  -- anon INSERT allowed for open event
  PERFORM rls_test.as_anon();
  PERFORM rls_test.expect_allowed(
    format('INSERT INTO public.event_signups(event_id, full_name, email)
            VALUES (%L, %L, %L)',
           v_open, 'Anon Guest', 'anon-guest@example.com'),
    'anon may submit guest signup to open event');

  -- anon INSERT denied for signin-required event
  PERFORM rls_test.expect_denied(
    format('INSERT INTO public.event_signups(event_id, full_name, email)
            VALUES (%L, %L, %L)',
           v_locked, 'Sneaky', 'sneaky@example.com'),
    'anon cannot submit guest signup to signin-required event');

  PERFORM rls_test.reset();
END
$t$;

ROLLBACK;
\echo 'event_signups: OK'
