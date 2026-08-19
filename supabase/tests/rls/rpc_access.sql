-- RLS regression: SECURITY DEFINER RPCs and role helpers.
--
-- Goals:
--   * Admin-only RPCs reject anon at the EXECUTE layer (SQLSTATE 42501).
--   * Authenticated non-admins reach the body but get an empty/denied result.
--   * Role helpers (has_role, has_viber_access, get_membership_tier) cannot
--     be used by anon or random users to claim privileges they don't have.
--   * Tier-gated lookups (get_event_online_url, get_presentation_access_audit)
--     return NULL / 0 rows for unauthorized callers.
\set ON_ERROR_STOP on
\ir _helpers.sql

BEGIN;

\echo '== admin-only RPCs reject anon at EXECUTE =='

DO $t$
DECLARE
  v_item  uuid := rls_test.fx_showcase_item();
  v_event uuid := rls_test.fx_open_event();
BEGIN
  PERFORM rls_test.as_anon();

  -- 42501 = insufficient_privilege (EXECUTE was revoked from anon).
  PERFORM rls_test.expect_sqlstate(
    format('SELECT 1 FROM public.get_showcase_download_stats(%L)', v_item),
    '42501',
    'anon EXECUTE on get_showcase_download_stats is revoked');

  PERFORM rls_test.expect_sqlstate(
    format('SELECT 1 FROM public.get_event_presentation_download_stats(%L)', v_event),
    '42501',
    'anon EXECUTE on get_event_presentation_download_stats is revoked');

  PERFORM rls_test.expect_sqlstate(
    'SELECT 1 FROM public.get_presentation_access_audit()',
    '42501',
    'anon EXECUTE on get_presentation_access_audit is revoked');

  PERFORM rls_test.reset();
END
$t$;

\echo '== admin-only RPCs return empty for authenticated non-admin =='

DO $t$
DECLARE
  v_item  uuid := rls_test.fx_showcase_item();
  v_event uuid := rls_test.fx_open_event();
  v_user  uuid := rls_test.fx_user();
BEGIN
  PERFORM rls_test.as_authenticated(v_user);

  PERFORM rls_test.expect_count(
    format('SELECT count(*) FROM public.get_showcase_download_stats(%L)', v_item),
    0, 'non-admin gets 0 rows from get_showcase_download_stats');

  PERFORM rls_test.expect_count(
    format('SELECT count(*) FROM public.get_event_presentation_download_stats(%L)', v_event),
    0, 'non-admin gets 0 rows from get_event_presentation_download_stats');

  PERFORM rls_test.expect_count(
    'SELECT count(*) FROM public.get_presentation_access_audit()',
    0, 'non-admin gets 0 rows from get_presentation_access_audit');

  PERFORM rls_test.reset();
END
$t$;

\echo '== role helpers cannot be used to escalate =='

DO $t$
DECLARE
  v_user uuid := rls_test.fx_user();
BEGIN
  -- anon
  PERFORM rls_test.as_anon();
  PERFORM rls_test.expect_equals(
    format('SELECT has_role(%L, ''admin''::app_role)::text', v_user),
    'false', 'anon: has_role(random, admin) is false');
  PERFORM rls_test.expect_equals(
    format('SELECT has_role(%L, ''superadmin''::app_role)::text', v_user),
    'false', 'anon: has_role(random, superadmin) is false');
  PERFORM rls_test.expect_equals(
    format('SELECT has_viber_access(%L)::text', v_user),
    'false', 'anon: has_viber_access(random) is false');
  PERFORM rls_test.expect_equals(
    format('SELECT get_membership_tier(%L)::text', v_user),
    'NULL', 'anon: get_membership_tier(random) is NULL');

  -- authenticated non-admin: same expectations against their own uid
  PERFORM rls_test.as_authenticated(v_user);
  PERFORM rls_test.expect_equals(
    format('SELECT has_role(%L, ''admin''::app_role)::text', v_user),
    'false', 'authenticated: has_role(self, admin) is false');
  PERFORM rls_test.expect_equals(
    format('SELECT has_role(%L, ''superadmin''::app_role)::text', v_user),
    'false', 'authenticated: has_role(self, superadmin) is false');

  PERFORM rls_test.reset();
END
$t$;

\echo '== get_event_online_url hides URL from non-attendees =='

DO $t$
DECLARE
  v_event uuid;
  v_user  uuid := rls_test.fx_user();
BEGIN
  INSERT INTO public.events (title, starts_at, is_published, requires_signin, online_url)
  VALUES ('RLS online event',
          now() + interval '7 days', true, true,
          'https://meet.test/secret-room')
  RETURNING id INTO v_event;

  PERFORM rls_test.as_anon();
  PERFORM rls_test.expect_equals(
    format('SELECT public.get_event_online_url(%L)', v_event),
    'NULL', 'anon cannot read online_url');

  PERFORM rls_test.as_authenticated(v_user);
  PERFORM rls_test.expect_equals(
    format('SELECT public.get_event_online_url(%L)', v_event),
    'NULL', 'authenticated non-attendee cannot read online_url');

  PERFORM rls_test.reset();
END
$t$;

\echo '== log_showcase_download is callable by anon (intended public logger) =='

DO $t$
DECLARE
  v_item uuid := rls_test.fx_showcase_item();
BEGIN
  PERFORM rls_test.as_anon();
  PERFORM rls_test.expect_allowed(
    format('SELECT public.log_showcase_download(%L, %L, %L)',
           v_item, 'https://example.test/anon.pdf', 'anon.pdf'),
    'anon may call log_showcase_download (intentional public logger)');

  PERFORM rls_test.reset();
END
$t$;

ROLLBACK;
\echo 'rpc_access: OK'
