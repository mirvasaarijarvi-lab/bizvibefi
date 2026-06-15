# Security Regression Checklist

Quick pre-release checks for RLS and signed-URL paths. Run through this before every deploy that touches policies, triggers, storage, or RPCs. Pair with `supabase/tests/rls/` and `bun run test`.

## 1. RLS posture (per touched table)

- [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` is on every new/changed public table (check `supabase--linter`).
- [ ] `GRANT` statements exist for every role referenced in policies (`authenticated`, `anon`, `service_role`). No table reachable via PostgREST without an explicit grant.
- [ ] No `USING (true)` or `WITH CHECK (true)` policies on `authenticated` unless the row is genuinely public.
- [ ] `anon` only has policies on truly public reads. Never on writes.
- [ ] Cross-user writes are blocked: INSERT/UPDATE policies pin `user_id = auth.uid()` in `WITH CHECK`.
- [ ] Privileged columns (`status`, `role`, `membership_tier`, `user_id`, `rejection_reason`, `type=lead`) are guarded by a `BEFORE UPDATE` trigger, not just by client code.
- [ ] `SECURITY DEFINER` functions all set `search_path = public` and check `has_role(auth.uid(), ...)` before exposing admin data.

## 2. RPC contract

- [ ] Every public-facing RPC has a row in `supabase/tests/rls/rpc_access_public.sql` asserting `anon` + `authenticated` access.
- [ ] Admin-only RPCs return empty or raise `42501` for non-admins.
- [ ] No RPC echoes hidden profile fields (`contact_email`, `contact_phone`, etc.) when `profile_visibility` opts them out.
- [ ] Role probe (`role_probe.sql`) green on PG15 + PG17 matrix.

## 3. Signed-URL & storage paths

- [ ] Private buckets (`event-presentations`) never linked with a public URL; only `createSignedUrl` with a TTL ≤ 1 hour.
- [ ] Signed URLs are minted server-side (edge function) after re-checking access (admin OR creator OR `going` RSVP OR matching `event_signups.email`).
- [ ] Every signed-URL mint writes to `presentation_access_log` (allowed=true/false + reason) so denials are auditable.
- [ ] Public buckets (`avatars`, `showcase-images`, `event-images`, `certificates`, `showcase-files`) only hold content meant to be world-readable. No PII, no draft/rejected uploads.
- [ ] Storage RLS: INSERT pinned to `auth.uid()::text = (storage.foldername(name))[1]`. DELETE blocked for non-owners/non-admins.
- [ ] `showcase-files` downloads gated to Viber+ at the edge function, not just in the UI.

## 4. Auth boundaries

- [ ] No client code reads `localStorage`/`sessionStorage` to decide admin status. Always `has_role` via RPC.
- [ ] Roles live in `public.user_roles`, never on `profiles`.
- [ ] No anonymous sign-ups enabled. Email confirm stays on unless explicitly opted out.
- [ ] Google provider configured if "Sign in with Google" UI is shown.

## 5. Secrets & logging

- [ ] No `SUPABASE_SERVICE_ROLE_KEY` referenced in client code or committed `.env`.
- [ ] Edge functions never `console.log` JWTs, signed URLs, emails, or service-role keys.
- [ ] Newly added secrets registered via the secrets tool, not hard-coded.

## 6. Automated gates (must be green)

- [ ] `supabase/tests/rls/` full suite passes (`role_probe`, `perf`, `rpc_access_public`, per-table files).
- [ ] `supabase--linter` shows no new ERROR-level findings.
- [ ] `security--run_security_scan` reviewed; any new finding either fixed or `ignore`d with rationale in `@security-memory`.
- [ ] CI matrix (PG15 + PG17, anon/authenticated/service_role) green.

## 7. Smoke test in preview (5 min)

- [ ] Logged-out: members directory hides email/phone; presentations return 403; private bucket URLs 404.
- [ ] Logged-in non-admin: cannot PATCH another user's `profiles` row, cannot flip own `membership_tier`, cannot approve own showcase item.
- [ ] Admin: download stats and presentation audit RPCs return data.
- [ ] Event attendee (RSVP `going`): receives signed presentation URL; non-attendee on same event does not.

---

Owner: whoever ships the release. File issues against this list, not against memory.
