-- Remove authenticated INSERT on admin_notifications (only service_role via edge function)
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.admin_notifications;

-- Revoke anonymous access to profile enumeration RPCs
REVOKE EXECUTE ON FUNCTION public.list_public_profiles() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_public_profile(uuid) FROM anon;