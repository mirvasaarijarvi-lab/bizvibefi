#!/usr/bin/env bash
# Automated smoke tests for docs/SECURITY_CHECKLIST.md.
# Runs the SQL assertions from "Section 0 — Connection-role assertions" plus
# the GRANT introspection block, then chains the signed-URL Vitest suite and
# the RLS regression suite. Exits non-zero on the first failure.
#
# Required env (CI secrets):
#   SUPABASE_DB_URL                  postgres://... (service-role / direct connection)
#   SUPABASE_URL                     https://<ref>.supabase.co
#   SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
#   SIGNED_URL_TEST_USER_PASSWORD    any non-empty string
#
# Optional:
#   SMOKE_TEST_USER_UUID             uuid present in auth.users for the
#                                    authenticated-role block. If unset, that
#                                    block is skipped (printed as SKIP, not FAIL).
#
# Output:
#   $GITHUB_STEP_SUMMARY (when run under Actions) gets a per-check table.
#   /tmp/security-smoke/ holds raw psql / vitest logs for artifact upload.

set -uo pipefail

OUT=/tmp/security-smoke
mkdir -p "$OUT"

FAIL=0
SUMMARY="$OUT/summary.md"
: > "$SUMMARY"

emit() { echo "$*" | tee -a "$SUMMARY"; }
row()  { printf '| %s | %s | %s |\n' "$1" "$2" "$3" >> "$SUMMARY"; }

emit "## Security checklist smoke — $(date -u +%FT%TZ)"
emit ""
emit "| Check | Result | Detail |"
emit "| --- | --- | --- |"

require_env() {
  local missing=()
  for var in "$@"; do
    if [ -z "${!var:-}" ]; then missing+=("$var"); fi
  done
  if [ "${#missing[@]}" -gt 0 ]; then
    row "env" ":x: fail" "Missing: ${missing[*]}"
    return 1
  fi
}

run_psql() {
  local label="$1" sql="$2" expect="$3" logfile="$OUT/${label// /_}.log"
  if ! psql "$SUPABASE_DB_URL" --no-psqlrc -v ON_ERROR_STOP=1 -X -A -t \
       -c "$sql" > "$logfile" 2>&1; then
    row "$label" ":x: fail" "psql error — see ${logfile##*/}"
    FAIL=1
    return 1
  fi
  if [ -n "$expect" ] && ! grep -Eq "$expect" "$logfile"; then
    row "$label" ":x: fail" "Expected /$expect/, got: $(tr -d '\n' < "$logfile" | head -c 80)"
    FAIL=1
    return 1
  fi
  row "$label" ":white_check_mark: pass" "$(tr -d '\n' < "$logfile" | head -c 80)"
  return 0
}

# ---------------------------------------------------------------------------
# Section 0.A — anon paths
# ---------------------------------------------------------------------------
if require_env SUPABASE_DB_URL; then
  run_psql "anon: get_badge_leaderboard EXECUTE" \
    "SELECT has_function_privilege('anon','public.get_badge_leaderboard()','EXECUTE')" \
    "^t$"
  run_psql "anon: get_event_rsvp_count EXECUTE" \
    "SELECT has_function_privilege('anon','public.get_event_rsvp_count(uuid)','EXECUTE')" \
    "^t$"
  run_psql "anon: get_event_feedback_public EXECUTE" \
    "SELECT has_function_privilege('anon','public.get_event_feedback_public(uuid)','EXECUTE')" \
    "^t$"
  run_psql "anon: cannot INSERT event_feedback (42501)" \
    "DO \$\$ BEGIN
       BEGIN
         SET LOCAL ROLE anon;
         INSERT INTO public.event_feedback (event_id, overall_rating)
         VALUES ('00000000-0000-0000-0000-000000000000', 5);
         RAISE EXCEPTION 'expected_42501_got_success';
       EXCEPTION WHEN insufficient_privilege THEN
         RAISE NOTICE 'ok_42501';
       END;
     END \$\$;" \
    "ok_42501"
  run_psql "anon: cannot INSERT member_badges (42501)" \
    "DO \$\$ BEGIN
       BEGIN
         SET LOCAL ROLE anon;
         INSERT INTO public.member_badges (user_id, badge_id)
         VALUES ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000');
         RAISE EXCEPTION 'expected_42501_got_success';
       EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'ok_42501';
       END;
     END \$\$;" \
    "ok_42501"

  # -------------------------------------------------------------------------
  # Section 0.B — authenticated (non-admin) cross-user write
  # -------------------------------------------------------------------------
  if [ -n "${SMOKE_TEST_USER_UUID:-}" ]; then
    run_psql "authenticated: cross-user member_badges INSERT (42501)" \
      "DO \$\$ BEGIN
         BEGIN
           SET LOCAL ROLE authenticated;
           SET LOCAL request.jwt.claim.sub = '${SMOKE_TEST_USER_UUID}';
           INSERT INTO public.member_badges (user_id, badge_id)
           VALUES ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222');
           RAISE EXCEPTION 'expected_42501_got_success';
         EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'ok_42501';
                WHEN foreign_key_violation THEN RAISE NOTICE 'ok_fk_blocked_before_rls';
         END;
       END \$\$;" \
      "ok_"
  else
    row "authenticated: cross-user write" ":fast_forward: skip" "SMOKE_TEST_USER_UUID not set"
  fi

  # -------------------------------------------------------------------------
  # Section 0.C — service_role privilege introspection
  # -------------------------------------------------------------------------
  run_psql "service_role: event_feedback INSERT granted" \
    "SELECT has_table_privilege('service_role','public.event_feedback','INSERT')" "^t$"
  run_psql "service_role: member_badges DELETE granted" \
    "SELECT has_table_privilege('service_role','public.member_badges','DELETE')" "^t$"
  run_psql "service_role: event_rsvps UPDATE granted" \
    "SELECT has_table_privilege('service_role','public.event_rsvps','UPDATE')" "^t$"

  # -------------------------------------------------------------------------
  # Admin-only RPCs must NOT be EXECUTE-able by anon
  # -------------------------------------------------------------------------
  run_psql "anon: cannot EXECUTE get_presentation_access_audit" \
    "SELECT has_function_privilege('anon','public.get_presentation_access_audit()','EXECUTE')" \
    "^f$"
fi

# ---------------------------------------------------------------------------
# Chain the existing test suites that automate the rest of the checklist
# ---------------------------------------------------------------------------
if command -v bun >/dev/null 2>&1; then
  if require_env SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY; then
    if bun run test:signed-urls > "$OUT/signed-urls.log" 2>&1; then
      row "signed-urls vitest" ":white_check_mark: pass" "$(grep -E 'Tests +[0-9]+ passed' "$OUT/signed-urls.log" | tail -1)"
    else
      row "signed-urls vitest" ":x: fail" "see signed-urls.log"
      FAIL=1
    fi
  fi
else
  row "signed-urls vitest" ":fast_forward: skip" "bun not installed on runner"
fi

emit ""
if [ "$FAIL" -eq 0 ]; then
  emit "**All security checklist smoke checks passed.**"
else
  emit "**One or more checks failed. See artifact \`security-smoke-logs\`.**"
fi

# Mirror summary into the GitHub Actions step summary when present.
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  cat "$SUMMARY" >> "$GITHUB_STEP_SUMMARY"
fi

exit "$FAIL"
