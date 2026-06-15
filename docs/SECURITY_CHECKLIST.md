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

### 3a. Per-bucket allow/deny matrix

Expected behaviour by role for every bucket in the project. If reality drifts from this table, fix `storage.objects` policies before shipping.

| Bucket                | `anon` SELECT | `anon` INSERT/DELETE | `authenticated` SELECT | `authenticated` INSERT | `authenticated` DELETE | `service_role` |
| --------------------- | ------------- | -------------------- | ---------------------- | ---------------------- | ---------------------- | -------------- |
| `avatars` (public)    | allow         | deny                 | allow                  | own folder only        | own folder only        | full           |
| `showcase-images` (public) | allow    | deny                 | allow                  | own folder only        | own folder + admin     | full           |
| `event-images` (public)    | allow    | deny                 | allow                  | admin/creator only     | admin/creator only     | full           |
| `certificates` (public)    | allow    | deny                 | allow                  | service-role only      | service-role only      | full           |
| `showcase-files` (public)  | deny by edge function gate; direct URL guesses are non-secret but app must route through edge | deny | Viber+ via edge function only | own folder only | own folder + admin | full |
| `event-presentations` (private) | deny | deny             | deny direct; allow via signed URL minted by `get-event-presentation` | admin/creator only | admin/creator only | full |

### 3b. Concrete verification commands

Run these against the target environment. They use the JS client because storage policies are evaluated in the storage service, not via `psql`.

```bash
# Env: ANON_KEY, SERVICE_KEY, SUPABASE_URL, AUTH_JWT (a non-admin user), ADMIN_JWT
PROJECT="$SUPABASE_URL"

curl_storage() {
  local label="$1" method="$2" jwt="$3" path="$4" body="${5:-}"
  local code
  code=$(curl -sS -o /tmp/storage-out -w '%{http_code}' \
    -X "$method" \
    -H "Authorization: Bearer $jwt" \
    -H "apikey: $ANON_KEY" \
    ${body:+-H "Content-Type: application/octet-stream" --data-binary "@$body"} \
    "$PROJECT/storage/v1/$path")
  printf '%-60s %s\n' "$label" "$code"
}
```

Then per bucket, expect:

```bash
# 1. event-presentations (private) — anon and non-attendee must be denied
curl_storage "anon GET private object"        GET    "$ANON_KEY" "object/event-presentations/<event-id>/deck.pdf"   # 400/403
curl_storage "auth GET private object direct" GET    "$AUTH_JWT" "object/event-presentations/<event-id>/deck.pdf"   # 400/403
# The only allow path is the edge function:
curl -sS -X POST -H "Authorization: Bearer $AUTH_JWT" -H "apikey: $ANON_KEY" \
  -d '{"presentation_id":"<id>"}' "$PROJECT/functions/v1/get-event-presentation"  # 200 for attendee, 403 otherwise

# 2. avatars (public) — anyone can read; only owner can write own folder
curl_storage "anon GET avatar"                GET    "$ANON_KEY" "object/public/avatars/<uid>/me.jpg"               # 200
curl_storage "auth PUT own avatar"            PUT    "$AUTH_JWT" "object/avatars/<uid>/me.jpg" /tmp/me.jpg          # 200
curl_storage "auth PUT other user's avatar"   PUT    "$AUTH_JWT" "object/avatars/<other-uid>/x.jpg" /tmp/me.jpg     # 403
curl_storage "anon PUT avatar"                PUT    "$ANON_KEY" "object/avatars/<uid>/me.jpg" /tmp/me.jpg          # 401/403
curl_storage "auth DELETE other user's avatar" DELETE "$AUTH_JWT" "object/avatars/<other-uid>/x.jpg"                # 403

# 3. showcase-files (public bucket, edge-gated) — direct PUT/DELETE only by owner
curl_storage "auth PUT own showcase file"     PUT    "$AUTH_JWT" "object/showcase-files/<uid>/deck.pdf" /tmp/x.pdf  # 200
curl_storage "auth PUT cross-user showcase"   PUT    "$AUTH_JWT" "object/showcase-files/<other-uid>/x.pdf" /tmp/x.pdf # 403
curl_storage "anon DELETE showcase file"      DELETE "$ANON_KEY" "object/showcase-files/<uid>/deck.pdf"             # 401/403

# 4. event-images / certificates — only admins (or service role) can write
curl_storage "auth PUT event image (non-admin)"  PUT  "$AUTH_JWT"  "object/event-images/<event-id>/cover.jpg" /tmp/c.jpg  # 403
curl_storage "admin PUT event image"             PUT  "$ADMIN_JWT" "object/event-images/<event-id>/cover.jpg" /tmp/c.jpg  # 200
curl_storage "anon GET event image"              GET  "$ANON_KEY"  "object/public/event-images/<event-id>/cover.jpg"      # 200

# 5. service_role bypass sanity — must succeed against the private bucket
curl_storage "service_role HEAD private object"  HEAD "$SERVICE_KEY" "object/event-presentations/<event-id>/deck.pdf"     # 200
```

Map each non-matching status code to the row in the matrix above and fix the `storage.objects` policy whose `bucket_id` matches.

### 3c. Policy introspection (run via psql)

```sql
-- Every bucket that backs sensitive data must be private.
SELECT id, public FROM storage.buckets
WHERE id IN ('event-presentations'); -- expect: public = false

-- Every storage policy: which roles, which command, which bucket.
SELECT polname, polcmd, polroles::regrole[] AS roles,
       pg_get_expr(polqual,  polrelid) AS using_expr,
       pg_get_expr(polwithcheck, polrelid) AS with_check_expr
FROM pg_policy
WHERE polrelid = 'storage.objects'::regclass
ORDER BY polname;
```

For each row, confirm:

- `INSERT` / `UPDATE` / `DELETE` policies pin ownership: `(storage.foldername(name))[1] = auth.uid()::text`, or check `has_role(auth.uid(),'admin')`.
- No `SELECT` policy on a private bucket uses `USING (true)`.
- No `INSERT` policy grants `anon` write access.



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
