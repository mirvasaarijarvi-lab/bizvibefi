-- =============================================================================
-- Shared helpers for RLS regression tests.
--
-- Include from a test file with:   \ir _helpers.sql
--
-- Provides:
--   * rls_test.*  schema with role-switch + assertion functions that survive
--     savepoints (regular schema, not pg_temp, so DO blocks running under
--     SET LOCAL ROLE anon can still see them).
--   * rls_test.fx_*() fixture functions that lazily create one of each
--     common record and cache the id in a GUC (current_setting) so tests
--     can share fixtures without re-inserting.
--
-- Conventions:
--   * Every test file BEGIN/ROLLBACKs around its work.
--   * Use rls_test.as_anon() / rls_test.as_authenticated(uid) to switch.
--   * Use rls_test.reset() to return to the test driver role (postgres).
--   * Use rls_test.expect_denied($$ ... $$, 'msg') to assert an operation
--     is rejected by RLS (insufficient_privilege OR check_violation).
--   * Use rls_test.expect_count('SELECT ...', N, 'msg') to assert row count.
-- =============================================================================

\set ON_ERROR_STOP on
\timing off

CREATE SCHEMA IF NOT EXISTS rls_test;

-- ---- Role switching --------------------------------------------------------

CREATE OR REPLACE FUNCTION rls_test.as_anon() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  RESET ROLE;
  SET LOCAL ROLE anon;
  PERFORM set_config('request.jwt.claims', '', true);
END
$$;

CREATE OR REPLACE FUNCTION rls_test.as_authenticated(_uid uuid)
RETURNS uuid LANGUAGE plpgsql AS $$
BEGIN
  RESET ROLE;
  SET LOCAL ROLE authenticated;
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', _uid::text,
      'role', 'authenticated',
      'email', 'rls-test-' || _uid::text || '@example.com'
    )::text,
    true
  );
  RETURN _uid;
END
$$;

CREATE OR REPLACE FUNCTION rls_test.reset() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '', true);
END
$$;

-- ---- Assertions ------------------------------------------------------------

-- Run `_sql` and fail unless it raises insufficient_privilege or check_violation.
CREATE OR REPLACE FUNCTION rls_test.expect_denied(_sql text, _msg text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE _sql;
    RAISE EXCEPTION 'FAIL: % — statement was allowed but should have been denied. SQL: %', _msg, _sql;
  EXCEPTION
    WHEN insufficient_privilege OR check_violation THEN
      RAISE NOTICE 'OK denied: %', _msg;
  END;
END
$$;

-- Run `_sql` and fail if it raises (i.e. it must succeed under current role).
CREATE OR REPLACE FUNCTION rls_test.expect_allowed(_sql text, _msg text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE _sql;
    RAISE NOTICE 'OK allowed: %', _msg;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'FAIL: % — statement was denied (% / %). SQL: %',
      _msg, SQLSTATE, SQLERRM, _sql;
  END;
END
$$;

-- Run `SELECT count(*) FROM (...)` style query and assert the integer result.
CREATE OR REPLACE FUNCTION rls_test.expect_count(_sql text, _expected bigint, _msg text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_actual bigint;
BEGIN
  EXECUTE _sql INTO v_actual;
  IF v_actual IS DISTINCT FROM _expected THEN
    RAISE EXCEPTION 'FAIL: % — expected %, got %. SQL: %',
      _msg, _expected, v_actual, _sql;
  END IF;
  RAISE NOTICE 'OK count(%) = %', _msg, _expected;
END
$$;

-- ---- Fixtures (lazy, GUC-cached) ------------------------------------------
-- Each fixture function returns the id and stores it in a transaction-local
-- GUC so repeat calls inside the same test transaction reuse the same row.

CREATE OR REPLACE FUNCTION rls_test._cached(_key text) RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE v text := current_setting('rls_test.' || _key, true);
BEGIN
  IF v IS NULL OR v = '' THEN RETURN NULL; END IF;
  RETURN v::uuid;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END
$$;

CREATE OR REPLACE FUNCTION rls_test._cache(_key text, _id uuid) RETURNS uuid
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('rls_test.' || _key, _id::text, true);
  RETURN _id;
END
$$;

-- Published event with open guest signups.
CREATE OR REPLACE FUNCTION rls_test.fx_open_event() RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE v uuid := rls_test._cached('event_open');
BEGIN
  IF v IS NOT NULL THEN RETURN v; END IF;
  SELECT id INTO v FROM public.events
   WHERE is_published = true AND requires_signin = false
   LIMIT 1;
  IF v IS NULL THEN
    INSERT INTO public.events (title, slug, starts_at, is_published, requires_signin)
    VALUES ('RLS open event',
            'rls-open-' || gen_random_uuid()::text,
            now() + interval '7 days', true, false)
    RETURNING id INTO v;
  END IF;
  RETURN rls_test._cache('event_open', v);
END
$$;

-- Published event that requires sign-in (guest signups should be blocked).
CREATE OR REPLACE FUNCTION rls_test.fx_locked_event() RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE v uuid := rls_test._cached('event_locked');
BEGIN
  IF v IS NOT NULL THEN RETURN v; END IF;
  INSERT INTO public.events (title, slug, starts_at, is_published, requires_signin)
  VALUES ('RLS locked event',
          'rls-locked-' || gen_random_uuid()::text,
          now() + interval '7 days', true, true)
  RETURNING id INTO v;
  RETURN rls_test._cache('event_locked', v);
END
$$;

-- Approved showcase item.
CREATE OR REPLACE FUNCTION rls_test.fx_showcase_item() RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE v uuid := rls_test._cached('showcase_item');
BEGIN
  IF v IS NOT NULL THEN RETURN v; END IF;
  SELECT id INTO v FROM public.showcase_items LIMIT 1;
  IF v IS NULL THEN
    INSERT INTO public.showcase_items (title, slug, status)
    VALUES ('RLS showcase item',
            'rls-showcase-' || gen_random_uuid()::text,
            'approved')
    RETURNING id INTO v;
  END IF;
  RETURN rls_test._cache('showcase_item', v);
END
$$;

-- Fresh random user id (not cached — most tests want a brand-new identity).
CREATE OR REPLACE FUNCTION rls_test.fx_user() RETURNS uuid
LANGUAGE plpgsql AS $$
BEGIN RETURN gen_random_uuid(); END
$$;
