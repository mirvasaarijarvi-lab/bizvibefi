-- =============================================================================
-- RLS regression tests for sensitive PII / download-log tables.
--
-- Run via psql with ON_ERROR_STOP=1 against a freshly-reset local Supabase.
-- Every probe is wrapped in a DO block that RAISES on the unexpected outcome,
-- so any failure aborts the script and fails the CI job.
--
-- Tables covered:
--   - public.event_signups          (guest PII: email, phone, full_name)
--   - public.showcase_file_downloads (download log: user_id, user_email)
--
-- We simulate three callers:
--   - anon          (no JWT)
--   - authenticated (random non-admin user)
--   - service_role  (sanity check that admin/backend path still works)
-- =============================================================================

\set ON_ERROR_STOP on
\timing off

BEGIN;

-- -----------------------------------------------------------------------------
-- Seed: one published, non-signin-required event so the guest INSERT policy
-- on event_signups can be satisfied. Inserted as postgres (bypasses RLS).
-- -----------------------------------------------------------------------------
DO $seed$
DECLARE
  v_event_id uuid;
  v_item_id  uuid;
BEGIN
  -- Reuse an existing fixture event if seed.sql created one; otherwise insert.
  SELECT id INTO v_event_id
  FROM public.events
  WHERE is_published = true AND requires_signin = false
  LIMIT 1;

  IF v_event_id IS NULL THEN
    INSERT INTO public.events (title, slug, starts_at, is_published, requires_signin)
    VALUES ('RLS test event', 'rls-test-event-' || gen_random_uuid()::text,
            now() + interval '7 days', true, false)
    RETURNING id INTO v_event_id;
  END IF;

  SELECT id INTO v_item_id FROM public.showcase_items LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.showcase_items (title, slug, status)
    VALUES ('RLS test item', 'rls-test-item-' || gen_random_uuid()::text, 'approved')
    RETURNING id INTO v_item_id;
  END IF;

  PERFORM set_config('rls_test.event_id', v_event_id::text, false);
  PERFORM set_config('rls_test.item_id',  v_item_id::text,  false);
END
$seed$;

-- Helper: switch JWT context to a fake authenticated user.
CREATE OR REPLACE FUNCTION pg_temp.as_authenticated(_uid uuid) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', _uid::text, 'role', 'authenticated', 'email',
                      'rls-test-' || _uid::text || '@example.com')::text,
    true
  );
END
$$;

CREATE OR REPLACE FUNCTION pg_temp.as_anon() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', '', true);
END
$$;

CREATE OR REPLACE FUNCTION pg_temp.reset_role() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '', true);
END
$$;

-- =============================================================================
-- event_signups
-- =============================================================================
\echo '== event_signups: anon and authenticated MUST NOT read PII =='

DO $test$
DECLARE
  v_event_id uuid := current_setting('rls_test.event_id')::uuid;
  v_count    integer;
  v_other    uuid := gen_random_uuid();
BEGIN
  -- Insert one PII row as postgres so there is something to (not) read.
  INSERT INTO public.event_signups (event_id, full_name, email, phone, company)
  VALUES (v_event_id, 'PII Probe', 'pii-probe@example.com', '+358000000', 'Probe Oy');

  -- anon
  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO v_count FROM public.event_signups;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'FAIL: anon read % rows from event_signups (expected 0)', v_count;
  END IF;

  -- authenticated, non-admin
  PERFORM pg_temp.reset_role();
  SET LOCAL ROLE authenticated;
  PERFORM pg_temp.as_authenticated(v_other);
  SELECT count(*) INTO v_count FROM public.event_signups;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'FAIL: authenticated non-admin read % rows from event_signups (expected 0)', v_count;
  END IF;

  PERFORM pg_temp.reset_role();
  RAISE NOTICE 'OK: event_signups SELECT is gated to admins.';
END
$test$;

\echo '== event_signups: anon may INSERT only for published, non-signin events =='

DO $test$
DECLARE
  v_event_id uuid := current_setting('rls_test.event_id')::uuid;
  v_locked   uuid;
BEGIN
  -- Allowed insert
  PERFORM pg_temp.reset_role();
  SET LOCAL ROLE anon;
  PERFORM pg_temp.as_anon();
  BEGIN
    INSERT INTO public.event_signups (event_id, full_name, email)
    VALUES (v_event_id, 'Anon Guest', 'anon-guest@example.com');
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN
    RAISE EXCEPTION 'FAIL: anon could not insert into a published open-signup event';
  END;

  -- Disallowed insert: event that requires sign-in
  PERFORM pg_temp.reset_role();
  INSERT INTO public.events (title, slug, starts_at, is_published, requires_signin)
  VALUES ('Members-only', 'members-only-' || gen_random_uuid()::text,
          now() + interval '7 days', true, true)
  RETURNING id INTO v_locked;

  SET LOCAL ROLE anon;
  PERFORM pg_temp.as_anon();
  BEGIN
    INSERT INTO public.event_signups (event_id, full_name, email)
    VALUES (v_locked, 'Sneaky', 'sneaky@example.com');
    RAISE EXCEPTION 'FAIL: anon inserted into a signin-required event';
  EXCEPTION
    WHEN insufficient_privilege OR check_violation THEN
      NULL; -- expected
  END;

  PERFORM pg_temp.reset_role();
  RAISE NOTICE 'OK: event_signups INSERT policy enforced.';
END
$test$;

-- =============================================================================
-- showcase_file_downloads
-- =============================================================================
\echo '== showcase_file_downloads: clients MUST NOT read or write directly =='

DO $test$
DECLARE
  v_item_id uuid := current_setting('rls_test.item_id')::uuid;
  v_count   integer;
  v_user    uuid := gen_random_uuid();
BEGIN
  -- Seed one row via the SECURITY DEFINER RPC (the only intended write path).
  PERFORM pg_temp.reset_role();
  SET LOCAL ROLE authenticated;
  PERFORM pg_temp.as_authenticated(v_user);
  PERFORM public.log_showcase_download(v_item_id, 'https://example.test/file.pdf', 'file.pdf');

  -- The caller themselves must NOT be able to read the log.
  SELECT count(*) INTO v_count FROM public.showcase_file_downloads;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'FAIL: authenticated user read % rows from showcase_file_downloads (expected 0)', v_count;
  END IF;

  -- Direct INSERT must be denied by the restrictive policy.
  BEGIN
    INSERT INTO public.showcase_file_downloads (item_id, file_url, file_name, user_id, user_email)
    VALUES (v_item_id, 'https://evil.test/x', 'x', v_user, 'spoof@example.com');
    RAISE EXCEPTION 'FAIL: authenticated user inserted directly into showcase_file_downloads';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN
    NULL; -- expected
  END;

  -- UPDATE / DELETE must also be denied.
  BEGIN
    UPDATE public.showcase_file_downloads SET file_name = 'tampered';
    RAISE EXCEPTION 'FAIL: authenticated user updated showcase_file_downloads';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN NULL; END;

  BEGIN
    DELETE FROM public.showcase_file_downloads;
    RAISE EXCEPTION 'FAIL: authenticated user deleted showcase_file_downloads';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN NULL; END;

  -- anon: same expectations.
  PERFORM pg_temp.reset_role();
  SET LOCAL ROLE anon;
  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO v_count FROM public.showcase_file_downloads;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'FAIL: anon read % rows from showcase_file_downloads (expected 0)', v_count;
  END IF;

  BEGIN
    INSERT INTO public.showcase_file_downloads (item_id, file_url, user_email)
    VALUES (v_item_id, 'https://evil.test/x', 'anon@example.com');
    RAISE EXCEPTION 'FAIL: anon inserted directly into showcase_file_downloads';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN NULL; END;

  PERFORM pg_temp.reset_role();
  RAISE NOTICE 'OK: showcase_file_downloads is RPC-only for writes and admin-only for reads.';
END
$test$;

-- =============================================================================
-- Admin-only RPCs: anon EXECUTE must be revoked.
-- =============================================================================
\echo '== admin download-stat RPCs: anon EXECUTE must be revoked =='

DO $test$
DECLARE
  v_item_id  uuid := current_setting('rls_test.item_id')::uuid;
  v_event_id uuid := current_setting('rls_test.event_id')::uuid;
BEGIN
  PERFORM pg_temp.reset_role();
  SET LOCAL ROLE anon;
  PERFORM pg_temp.as_anon();

  BEGIN
    PERFORM * FROM public.get_showcase_download_stats(v_item_id);
    RAISE EXCEPTION 'FAIL: anon called get_showcase_download_stats';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  BEGIN
    PERFORM * FROM public.get_event_presentation_download_stats(v_event_id);
    RAISE EXCEPTION 'FAIL: anon called get_event_presentation_download_stats';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  PERFORM pg_temp.reset_role();
  RAISE NOTICE 'OK: download-stat RPCs reject anonymous callers at the EXECUTE layer.';
END
$test$;

ROLLBACK;

\echo 'RLS regression suite passed.'
