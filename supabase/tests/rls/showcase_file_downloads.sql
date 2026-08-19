-- RLS regression: public.showcase_file_downloads + admin RPCs
\set ON_ERROR_STOP on
\ir _helpers.sql

BEGIN;

\echo '== showcase_file_downloads =='

DO $t$
DECLARE
  v_item uuid := rls_test.fx_showcase_item();
  v_user uuid := rls_test.fx_user();
BEGIN
  -- Write via the SECURITY DEFINER RPC (the only intended write path)
  PERFORM rls_test.as_authenticated(v_user);
  PERFORM public.log_showcase_download(v_item, 'https://example.test/file.pdf', 'file.pdf');

  -- Same user must not be able to read the log back
  PERFORM rls_test.expect_count(
    'SELECT count(*) FROM public.showcase_file_downloads',
    0, 'authenticated user cannot read showcase_file_downloads');

  -- Direct writes must be denied for authenticated callers
  PERFORM rls_test.expect_denied(
    format('INSERT INTO public.showcase_file_downloads(item_id, file_url, user_id, user_email)
            VALUES (%L, %L, %L, %L)',
           v_item, 'https://evil.test/x', v_user, 'spoof@example.com'),
    'authenticated cannot INSERT into showcase_file_downloads');

  PERFORM rls_test.expect_no_rows_affected(
    'UPDATE public.showcase_file_downloads SET file_name = ''tampered''',
    'authenticated cannot UPDATE showcase_file_downloads');

  PERFORM rls_test.expect_no_rows_affected(
    'DELETE FROM public.showcase_file_downloads',
    'authenticated cannot DELETE showcase_file_downloads');

  -- anon: same expectations
  PERFORM rls_test.as_anon();
  PERFORM rls_test.expect_count(
    'SELECT count(*) FROM public.showcase_file_downloads',
    0, 'anon cannot read showcase_file_downloads');
  PERFORM rls_test.expect_denied(
    format('INSERT INTO public.showcase_file_downloads(item_id, file_url, user_email)
            VALUES (%L, %L, %L)',
           v_item, 'https://evil.test/x', 'anon@example.com'),
    'anon cannot INSERT into showcase_file_downloads');

  PERFORM rls_test.reset();
END
$t$;

\echo '== admin download-stat RPCs =='

DO $t$
DECLARE
  v_item  uuid := rls_test.fx_showcase_item();
  v_event uuid := rls_test.fx_open_event();
BEGIN
  PERFORM rls_test.as_anon();
  PERFORM rls_test.expect_denied(
    format('SELECT * FROM public.get_showcase_download_stats(%L)', v_item),
    'anon cannot EXECUTE get_showcase_download_stats');
  PERFORM rls_test.expect_denied(
    format('SELECT * FROM public.get_event_presentation_download_stats(%L)', v_event),
    'anon cannot EXECUTE get_event_presentation_download_stats');
  PERFORM rls_test.reset();
END
$t$;

ROLLBACK;
\echo 'showcase_file_downloads: OK'
