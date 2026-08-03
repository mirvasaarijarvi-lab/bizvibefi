
-- Hide private event meeting URLs from anonymous and authenticated direct SELECTs.
-- Authorized users (creator, admin, RSVP'd attendees, signups) still get the URL
-- via the SECURITY DEFINER function public.get_event_online_url(_event_id).
REVOKE SELECT (online_url) ON public.events FROM anon;
REVOKE SELECT (online_url) ON public.events FROM authenticated;

-- Ensure the moderation columns exist before revoking column-level access.
-- These were introduced outside the migration history on the hosted project,
-- so a clean `supabase db reset` needs them created idempotently here.
ALTER TABLE public.showcase_items
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS test_reasons text[],
  ADD COLUMN IF NOT EXISTS test_reasons_other text;

-- Hide internal moderation fields on showcase_items from anonymous readers.
-- Authenticated users (item owner, admins) still see these via existing
-- row-level policies because column-level SELECT is only revoked from anon.
REVOKE SELECT (rejection_reason, test_reasons, test_reasons_other)
  ON public.showcase_items FROM anon;
