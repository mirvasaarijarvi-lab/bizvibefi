#!/usr/bin/env bash
# One-shot "what changed since the last release" report for the security
# checklist. See docs/SECURITY_CHECKLIST.md → "What changed since the last
# release" for the per-section follow-ups.
#
# Usage:
#   scripts/security/changes-since.sh                 # auto-detect last v* tag
#   scripts/security/changes-since.sh v1.4.2          # explicit base
#   scripts/security/changes-since.sh v1.4.2 HEAD~3   # explicit base + head

set -uo pipefail

BASE="${1:-$(git describe --tags --abbrev=0 --match 'v*' 2>/dev/null || echo "")}"
HEAD_REF="${2:-HEAD}"

if [ -z "$BASE" ]; then
  echo "No v* tag found and no base ref passed. Usage: $0 <base-ref> [head-ref]" >&2
  exit 2
fi

if ! git rev-parse --verify --quiet "$BASE" >/dev/null; then
  echo "Unknown ref: $BASE" >&2
  exit 2
fi

hr() { printf '\n──── %s ────\n' "$*"; }

echo "Range: $BASE..$HEAD_REF"
echo "Commits: $(git rev-list --count "$BASE..$HEAD_REF")"

hr "1. Migrations touched"
git diff --name-only "$BASE..$HEAD_REF" -- supabase/migrations/ | sed 's/^/  /' \
  || echo "  (none)"

hr "2. Policies / triggers / functions added or changed"
git diff "$BASE..$HEAD_REF" -- supabase/migrations/ \
  | grep -iE '^\+.*(CREATE|DROP|ALTER)[[:space:]]+(POLICY|TRIGGER|FUNCTION)' \
  | sed 's/^+/  /' | sort -u \
  || echo "  (none)"

hr "3. Edge functions touched"
git diff --name-only "$BASE..$HEAD_REF" -- supabase/functions/ | sed 's/^/  /' \
  || echo "  (none)"

hr "4. Table / column changes"
git diff "$BASE..$HEAD_REF" -- supabase/migrations/ \
  | grep -iE '^\+.*(CREATE TABLE|ADD COLUMN|DROP COLUMN|ALTER COLUMN)' \
  | sed 's/^+/  /' | sort -u \
  || echo "  (none)"

hr "5. Storage buckets / policies"
git diff "$BASE..$HEAD_REF" -- supabase/migrations/ \
  | grep -iE '^\+.*(storage\.(buckets|objects)|create_bucket|update_bucket)' \
  | sed 's/^+/  /' | sort -u \
  || echo "  (none)"

hr "6. Security memory / baseline drift"
git diff --stat "$BASE..$HEAD_REF" -- .security/ docs/SECURITY_CHECKLIST.md \
  || echo "  (no change)"

echo
echo "Map each block to the checklist section noted in docs/SECURITY_CHECKLIST.md."
