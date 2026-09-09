-- 1) Column-level protection for recruitment_posts.apply_email (same pattern as events.online_url)
REVOKE SELECT ON public.recruitment_posts FROM authenticated;

GRANT SELECT (
  id, user_id, type, title, description, organization, location, is_remote,
  employment_type, apply_url, allow_contact_request, tags, status,
  rejection_reason, expires_at, created_at, updated_at
) ON public.recruitment_posts TO authenticated;

-- Writes (including apply_email on the user's own post) stay allowed; RLS still applies.
GRANT INSERT, UPDATE, DELETE ON public.recruitment_posts TO authenticated;
GRANT ALL ON public.recruitment_posts TO service_role;

COMMENT ON COLUMN public.recruitment_posts.apply_email IS
  'Applicant contact email. Direct SELECT is revoked from anon and authenticated; read it through public.list_public_recruitment_posts(), public.list_my_recruitment_posts() or public.list_all_recruitment_posts_admin().';

-- 2) email_unsubscribe_tokens: confirm service-role-only access is intentional.
COMMENT ON TABLE public.email_unsubscribe_tokens IS
  'Unsubscribe tokens. Intentionally not readable by anon or authenticated: the handle-email-unsubscribe edge function validates and consumes tokens with the service role.';
