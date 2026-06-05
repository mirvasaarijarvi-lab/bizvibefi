-- Re-assert column-level REVOKE on events.online_url to ensure it cannot leak
-- through the row-level SELECT policy, even if a prior migration re-granted defaults.
REVOKE SELECT (online_url) ON public.events FROM anon;
REVOKE SELECT (online_url) ON public.events FROM authenticated;
-- service_role retains full access for edge functions.
GRANT SELECT (online_url) ON public.events TO service_role;