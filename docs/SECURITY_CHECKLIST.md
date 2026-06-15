# Security Regression Checklist

Quick pre-release checks for RLS and signed-URL paths. Run through this before every deploy that touches policies, triggers, storage, or RPCs. Pair with `supabase/tests/rls/` and `bun run test`.

## What changed since the last release

Run this first — it tells you which sections below actually need re-verification.

### Pick the release range

```bash
# Last published release tag (adjust the prefix to match your tag scheme).
LAST=$(git describe --tags --abbrev=0 --match 'v*' 2>/dev/null || echo "main~50")
HEAD_REF=HEAD
echo "Comparing $LAST..$HEAD_REF"
```

### 1. Migrations touched

```bash
git diff --name-only "$LAST..$HEAD_REF" -- supabase/migrations/
```

If nothing prints, sections 1 (RLS) and 2 (RPC) can usually be skipped — re-run only the automated gate in section 6 to be safe.

### 2. Policies / triggers / functions added or changed

```bash
git diff "$LAST..$HEAD_REF" -- supabase/migrations/ \
  | grep -iE '^\+.*(CREATE|DROP|ALTER)[[:space:]]+(POLICY|TRIGGER|FUNCTION)' \
  | sed 's/^+//' | sort -u
```

For each line, locate the owning table or function and re-verify:

| If you see…                                | Re-verify section                                    |
| ------------------------------------------ | ---------------------------------------------------- |
| `CREATE POLICY` / `DROP POLICY`            | §0 (GRANT + SQLSTATE), §1 (RLS posture), §6          |
| `CREATE TRIGGER` / `ALTER TRIGGER`         | §1 (privileged-column guard), §7 (preview smoke)     |
| `CREATE FUNCTION ... SECURITY DEFINER`     | §1 (search_path + role check), §2 (RPC contract)     |
| `GRANT` / `REVOKE`                         | §0 (connection-role assertions)                      |
| `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`| §1, §6 (`supabase--linter`)                          |

### 3. Edge functions touched (signed URLs, admin RPCs)

```bash
git diff --name-only "$LAST..$HEAD_REF" -- supabase/functions/
```

Any file under `supabase/functions/` means re-run §3 (signed URLs) and the `bun run test:signed-urls` suite, even if no migration changed.

### 4. Tables changed (column adds / drops)

```bash
git diff "$LAST..$HEAD_REF" -- supabase/migrations/ \
  | grep -iE '^\+.*(CREATE TABLE|ADD COLUMN|DROP COLUMN|ALTER COLUMN)' \
  | sed 's/^+//' | sort -u
```

For each table that gained a column, confirm: (a) it has a `GRANT` line in the same migration (§0), (b) every `SELECT` policy still omits hidden fields (§1, §7), (c) no edge function `select('*')` now leaks the new column.

### 5. Storage buckets / policies

```bash
git diff "$LAST..$HEAD_REF" -- supabase/migrations/ \
  | grep -iE '^\+.*(storage\.(buckets|objects)|create_bucket|update_bucket)' \
  | sed 's/^+//' | sort -u
```

Any hit → re-verify §3 (signed URLs) and confirm public-bucket inventory in §3 still matches reality.

### 6. Security memory / baseline drift

```bash
git diff --stat "$LAST..$HEAD_REF" -- .security/ docs/SECURITY_CHECKLIST.md
```

If `.security/lovable-baseline.json` changed, eyeball the diff: every removed finding must correspond to a real fix, not just a stale export.

### Shortcut: one-shot report

```bash
./scripts/security/changes-since.sh "$LAST"   # if you've added the helper
```

Otherwise paste the five blocks above into a terminal and screenshot the output into the release ticket.



## Expected SQLSTATEs at a glance

| Code     | Name                       | Where it should come from                                                  |
| -------- | -------------------------- | -------------------------------------------------------------------------- |
| `42501`  | insufficient_privilege     | Missing `GRANT`, or RLS policy denies the row                              |
| `42P01`  | undefined_table            | Table dropped/renamed but client still references it (catch in migrations) |
| `23505`  | unique_violation           | Idempotency guard hit (e.g. duplicate `member_badges (user_id, badge_id)`) |
| `P0001` (`raise_exception`) | Trigger guard fired (e.g. `prevent_showcase_status_escalation`, `protect_membership_fields`) |

`42501` is the headline signal. If a guest path returns `00000` (no error) on a write you expect to block, the policy or grant is wrong.

## 0. Connection-role assertions (run before every release)

Run these three blocks via `psql` against the target environment, switching the `SET ROLE` line for each role. They cover the GRANT layer that policies cannot enforce on their own.

```sql
-- A. anon: tracked-public RPCs must succeed; tracked writes must raise 42501
SET ROLE anon;
SELECT public.get_badge_leaderboard() LIMIT 1;                  -- expect: rows, no error
SELECT public.get_event_rsvp_count('00000000-0000-0000-0000-000000000000'); -- expect: 0
DO $$ BEGIN
  BEGIN
    INSERT INTO public.event_feedback (event_id, overall_rating)
    VALUES ('00000000-0000-0000-0000-000000000000', 5);
    RAISE EXCEPTION 'expected 42501, got success';
  EXCEPTION WHEN insufficient_privilege THEN NULL;              -- 42501 ✓
  END;
END $$;
RESET ROLE;

-- B. authenticated (non-admin): own-row writes succeed, cross-user writes 42501
SET ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '<test-user-uuid>';
SELECT public.get_badge_leaderboard() LIMIT 1;                  -- expect: rows
DO $$ BEGIN
  BEGIN
    INSERT INTO public.member_badges (user_id, badge_id)
    VALUES ('<other-user-uuid>', '<some-badge-uuid>');
    RAISE EXCEPTION 'expected 42501, got success';
  EXCEPTION WHEN insufficient_privilege THEN NULL;              -- 42501 ✓
  END;
END $$;
RESET ROLE;

-- C. service_role: privileged writes succeed (no RLS, full GRANT)
SET ROLE service_role;
SELECT has_table_privilege('service_role', 'public.event_feedback', 'INSERT');  -- expect: true
SELECT has_table_privilege('service_role', 'public.member_badges',  'DELETE');  -- expect: true
SELECT has_table_privilege('service_role', 'public.event_rsvps',    'UPDATE');  -- expect: true
RESET ROLE;
```

GRANT-only spot checks (run as superuser, no `SET ROLE` needed):

```sql
-- Every new public table must show explicit grants for the roles its policies target.
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = '<new_table>'
  AND grantee IN ('anon','authenticated','service_role')
ORDER BY grantee, privilege_type;
-- Expect:
--   service_role → SELECT, INSERT, UPDATE, DELETE (always)
--   authenticated → matches policy intent
--   anon → ONLY if a policy explicitly allows anon reads

-- Public RPCs must be EXECUTE-able by guests.
SELECT has_function_privilege('anon',         'public.get_badge_leaderboard()',                   'EXECUTE'), -- true
       has_function_privilege('authenticated','public.get_event_rsvp_count(uuid)',                'EXECUTE'), -- true
       has_function_privilege('anon',         'public.get_event_feedback_public(uuid)',           'EXECUTE'); -- true

-- Admin-only RPCs must NOT be EXECUTE-able by anon.
SELECT has_function_privilege('anon', 'public.get_presentation_access_audit()', 'EXECUTE');       -- expect: false
```



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
