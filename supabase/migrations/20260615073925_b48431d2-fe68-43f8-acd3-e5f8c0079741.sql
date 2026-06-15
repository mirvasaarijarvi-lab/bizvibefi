
REVOKE EXECUTE ON FUNCTION public.get_showcase_download_stats(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_event_presentation_download_stats(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_showcase_download_stats(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_event_presentation_download_stats(uuid) TO authenticated, service_role;
