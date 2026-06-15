# RLS regression tests

Each `*.sql` file (except `_helpers.sql`) is a self-contained psql script run
in CI by `.github/workflows/security.yml` against a freshly-reset local
Supabase DB. They fail-fast on `ON_ERROR_STOP=1`, so any `RAISE EXCEPTION`
aborts the PR.

## Adding a new table or edge case

1. Create `supabase/tests/rls/<table>.sql`.
2. Start with:

   ```sql
   \set ON_ERROR_STOP on
   \ir _helpers.sql
   BEGIN;
   ```

3. Use the shared helpers in the `rls_test` schema:

   - `rls_test.as_anon()` / `rls_test.as_authenticated(uuid)` / `rls_test.reset()`
   - `rls_test.expect_allowed(sql, msg)`
   - `rls_test.expect_denied(sql, msg)` — passes on `insufficient_privilege` or `check_violation`
   - `rls_test.expect_count(sql, n, msg)`
   - `rls_test.expect_equals(sql, expected_text, msg)` — pass `'NULL'` to assert SQL NULL
   - `rls_test.expect_sqlstate(sql, sqlstate, msg)` — e.g. `'42501'` for `insufficient_privilege`
   - `rls_test.expect_under_ms(sql, max_ms, msg [, runs=3])` — runs `runs` times and asserts the best (min) wall-clock duration is under `max_ms`. Use for performance regression checks; see `perf.sql`.
   - `rls_test.snapshot(label, sql)` — runs `sql` as table owner (RLS bypassed) and emits one tagged NOTICE per row. CI harvests these into `rls-fixtures.md` so mismatched-count failures are debuggable without re-running locally.
   - `rls_test.snapshot_fixtures()` — convenience snapshot of the cached fixture ids plus row counts on the hot tables. Call once near the top of every test file, right after fixtures are materialised.

4. Reuse fixtures instead of inserting your own:

   - `rls_test.fx_open_event()` — published, guest-signup OK
   - `rls_test.fx_locked_event()` — published, requires sign-in
   - `rls_test.fx_past_event()` — ended >2 days ago, used by public feedback RPC
   - `rls_test.fx_showcase_item()` — approved showcase row
   - `rls_test.fx_user()` — fresh random uuid

   Add new fixtures in `_helpers.sql` whenever a row is needed by 2+ tests.

5. End with `ROLLBACK;` so the DB stays clean for the next file.

## Running locally

```bash
supabase db reset --linked=false
DB_URL=$(supabase status -o env | awk -F= '/^DB_URL=/{gsub(/"/,"",$2); print $2}')
for f in supabase/tests/rls/*.sql; do
  base=$(basename "$f")
  case "$base" in _*|role_probe.sql) continue ;; esac
  psql "$DB_URL" --set ON_ERROR_STOP=1 -f "$f" || exit 1
done
```

## CI matrix

`.github/workflows/security.yml` runs the suite as a matrix:

- **Postgres major version** — `pg_major: [15, 17]`. Each cell boots a
  fresh Supabase stack pinned to that PG release (config.toml is patched
  per-cell), so guest-access regressions specific to one major (planner
  changes, new system role grants) are caught before merge.
- **Connection role** — after the in-file role-switching tests, a smoke
  step re-runs the guest-facing surface (`get_badge_leaderboard`,
  `get_event_rsvp_count`, plus a privileged write probe) under real
  connection roles `anon`, `authenticated`, `service_role`. This catches
  GRANT-level regressions the inner `SET LOCAL ROLE` assertions miss
  (e.g. EXECUTE accidentally revoked from anon). The probe lives in
  `role_probe.sql`; results are mirrored into `rls-role-matrix.md`.

Run the role probe locally:

```bash
for ROLE in anon authenticated service_role; do
  echo "----- $ROLE -----"
  psql "$DB_URL" -v "role=$ROLE" -f supabase/tests/rls/role_probe.sql
done
```
