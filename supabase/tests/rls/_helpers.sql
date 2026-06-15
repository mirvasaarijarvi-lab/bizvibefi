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

-- Make the helper schema reachable when the CI matrix runs tests under a
-- non-superuser connection role (anon / authenticated / service_role).
-- Functions are SECURITY INVOKER and only switch roles inside DO blocks
-- using SET LOCAL ROLE, so granting EXECUTE here does not bypass RLS.
GRANT USAGE ON SCHEMA rls_test TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA rls_test
  GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

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
    RAISE NOTICE 'RLS-ASSERT|FAIL|expect_denied|%|statement was allowed but should have been denied', _msg;
    RAISE EXCEPTION 'FAIL: % — statement was allowed but should have been denied. SQL: %', _msg, _sql;
  EXCEPTION
    WHEN insufficient_privilege OR check_violation THEN
      RAISE NOTICE 'RLS-ASSERT|PASS|expect_denied|%|', _msg;
  END;
END
$$;

-- Run `_sql` and fail if it raises (i.e. it must succeed under current role).
CREATE OR REPLACE FUNCTION rls_test.expect_allowed(_sql text, _msg text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE _sql;
    RAISE NOTICE 'RLS-ASSERT|PASS|expect_allowed|%|', _msg;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'RLS-ASSERT|FAIL|expect_allowed|%|% / %', _msg, SQLSTATE, SQLERRM;
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
    RAISE NOTICE 'RLS-ASSERT|FAIL|expect_count|%|expected %, got %', _msg, _expected, v_actual;
    RAISE EXCEPTION 'FAIL: % — expected %, got %. SQL: %',
      _msg, _expected, v_actual, _sql;
  END IF;
  RAISE NOTICE 'RLS-ASSERT|PASS|expect_count|%|count=%', _msg, _expected;
END
$$;

-- Run `_sql` and assert it returns a single scalar equal to `_expected_text`
-- (cast both sides to text so the helper works for bool / uuid / int / null).
-- Use the literal string 'NULL' to assert the result is SQL NULL.
CREATE OR REPLACE FUNCTION rls_test.expect_equals(_sql text, _expected_text text, _msg text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_actual text;
BEGIN
  EXECUTE _sql INTO v_actual;
  IF (v_actual IS NULL AND _expected_text = 'NULL')
     OR (v_actual IS NOT DISTINCT FROM _expected_text) THEN
    RAISE NOTICE 'RLS-ASSERT|PASS|expect_equals|%|value=%', _msg, COALESCE(v_actual,'NULL');
    RETURN;
  END IF;
  RAISE NOTICE 'RLS-ASSERT|FAIL|expect_equals|%|expected %, got %',
    _msg, _expected_text, COALESCE(v_actual,'NULL');
  RAISE EXCEPTION 'FAIL: % — expected %, got %. SQL: %',
    _msg, _expected_text, COALESCE(v_actual,'NULL'), _sql;
END
$$;

-- Run `_sql` and assert it raises a Postgres error with the given SQLSTATE
-- (e.g. '42501' for insufficient_privilege). Useful to lock down *which*
-- error path triggers, not just "anything failed".
CREATE OR REPLACE FUNCTION rls_test.expect_sqlstate(_sql text, _sqlstate text, _msg text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE _sql;
    RAISE NOTICE 'RLS-ASSERT|FAIL|expect_sqlstate|%|statement succeeded; expected SQLSTATE %', _msg, _sqlstate;
    RAISE EXCEPTION 'FAIL: % — statement succeeded; expected SQLSTATE %. SQL: %',
      _msg, _sqlstate, _sql;
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = _sqlstate THEN
      RAISE NOTICE 'RLS-ASSERT|PASS|expect_sqlstate|%|sqlstate=%', _msg, SQLSTATE;
    ELSE
      RAISE NOTICE 'RLS-ASSERT|FAIL|expect_sqlstate|%|expected %, got % (%s)',
        _msg, _sqlstate, SQLSTATE, SQLERRM;
      RAISE EXCEPTION 'FAIL: % — expected SQLSTATE %, got % (%). SQL: %',
        _msg, _sqlstate, SQLSTATE, SQLERRM, _sql;
    END IF;
  END;
END
$$;

-- Run `_sql` `_runs` times under the current role, take the MIN wall-clock
-- duration (warm cache, ignores first-run JIT/plan cost), and fail if it
-- exceeds `_max_ms`. Use min, not avg, so CI noise from a single GC pause
-- on the runner doesn't flake the suite — a true regression makes EVERY
-- run slow, so the min still moves.
--
-- The threshold is intentionally generous (sub-second) because the CI
-- runner is a shared GitHub Actions VM. Tighten per-query when needed.
CREATE OR REPLACE FUNCTION rls_test.expect_under_ms(
  _sql text, _max_ms numeric, _msg text, _runs int DEFAULT 3
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  t0  timestamptz;
  dur numeric;
  best numeric := NULL;
  i   int;
BEGIN
  FOR i IN 1.._runs LOOP
    t0 := clock_timestamp();
    EXECUTE _sql;
    dur := extract(epoch FROM clock_timestamp() - t0) * 1000.0;
    IF best IS NULL OR dur < best THEN best := dur; END IF;
  END LOOP;

  IF best > _max_ms THEN
    RAISE NOTICE 'RLS-ASSERT|FAIL|expect_under_ms|%|best=%ms over threshold %ms',
      _msg, round(best, 2), _max_ms;
    RAISE EXCEPTION 'PERF FAIL: % — best of % runs was %ms, threshold %ms. SQL: %',
      _msg, _runs, round(best, 2), _max_ms, _sql;
  END IF;

  RAISE NOTICE 'RLS-ASSERT|PASS|expect_under_ms|%|best=%ms (limit %ms)',
    _msg, round(best, 2), _max_ms;
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

-- Past event whose ends_at was >2 days ago — get_event_feedback_public should
-- return feedback rows for this one.
CREATE OR REPLACE FUNCTION rls_test.fx_past_event() RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE v uuid := rls_test._cached('event_past');
BEGIN
  IF v IS NOT NULL THEN RETURN v; END IF;
  INSERT INTO public.events (title, slug, starts_at, ends_at, is_published, requires_signin)
  VALUES ('RLS past event',
          'rls-past-' || gen_random_uuid()::text,
          now() - interval '10 days',
          now() - interval '10 days' + interval '2 hours',
          true, false)
  RETURNING id INTO v;
  RETURN rls_test._cache('event_past', v);
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


-- ---- Fixture snapshots ----------------------------------------------------
-- Emit the actual seeded rows a test relied on, so when CI says
-- "expected 3, got 2" you can immediately see which fixture row went
-- missing without re-running the suite locally. Every row is emitted as
-- a single tagged NOTICE the workflow harvests into `rls-fixtures.md`:
--
--   RLS-FIXTURE|<label>|<row_json>
--   RLS-FIXTURE-COUNT|<label>|<n>
--
-- Use rls_test.snapshot('label', $$ SELECT ... $$) for arbitrary
-- projections, or rls_test.snapshot_fixtures() for the cached fixtures
-- plus row counts on the tables tests usually assert against.

CREATE OR REPLACE FUNCTION rls_test.snapshot(_label text, _sql text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  rec   record;
  n     int := 0;
  saved text;
BEGIN
  -- Snapshot as table owner so it reflects ground truth, not what the
  -- current test role can see through RLS.
  saved := current_setting('role', true);
  RESET ROLE;
  FOR rec IN EXECUTE 'SELECT row_to_json(t)::text AS j FROM (' || _sql || ') t' LOOP
    n := n + 1;
    RAISE NOTICE 'RLS-FIXTURE|%|%', _label, rec.j;
  END LOOP;
  IF n = 0 THEN
    RAISE NOTICE 'RLS-FIXTURE|%|{"_empty":true}', _label;
  END IF;
  RAISE NOTICE 'RLS-FIXTURE-COUNT|%|%', _label, n;
  IF saved IS NOT NULL AND saved <> '' AND saved <> 'none' THEN
    EXECUTE 'SET LOCAL ROLE ' || quote_ident(saved);
  END IF;
END
$$;

-- Compact snapshot of cached fixture ids + row counts on tables RLS tests
-- touch most often. Call once per test file after fixtures are materialised.
CREATE OR REPLACE FUNCTION rls_test.snapshot_fixtures() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM rls_test.snapshot('cached_ids', $q$
    SELECT
      rls_test._cached('event_open')    AS event_open,
      rls_test._cached('event_locked')  AS event_locked,
      rls_test._cached('event_past')    AS event_past,
      rls_test._cached('showcase_item') AS showcase_item
  $q$);

  PERFORM rls_test.snapshot('row_counts', $q$
    SELECT
      (SELECT count(*) FROM public.events)                  AS events,
      (SELECT count(*) FROM public.event_rsvps)             AS event_rsvps,
      (SELECT count(*) FROM public.event_signups)           AS event_signups,
      (SELECT count(*) FROM public.event_feedback)          AS event_feedback,
      (SELECT count(*) FROM public.showcase_items)          AS showcase_items,
      (SELECT count(*) FROM public.showcase_file_downloads) AS showcase_downloads,
      (SELECT count(*) FROM public.member_badges)           AS member_badges,
      (SELECT count(*) FROM public.badge_catalog)           AS badge_catalog
  $q$);
END
$$;
