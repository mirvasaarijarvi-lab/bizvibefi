# GoodVibesCafeFI

[![CI](https://github.com/AminForou/bizvibefi/actions/workflows/ci.yml/badge.svg)](https://github.com/AminForou/bizvibefi/actions/workflows/ci.yml)
[![E2E Tests](https://github.com/AminForou/bizvibefi/actions/workflows/e2e.yml/badge.svg)](https://github.com/AminForou/bizvibefi/actions/workflows/e2e.yml)

A multilingual business community website built with React, TypeScript, and Tailwind CSS.

## Getting Started

```bash
bun install
bun run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server |
| `bun run build` | Production build |
| `bun run lint` | Run ESLint |
| `bun run typecheck` | TypeScript check |
| `bun run test` | Unit tests (Vitest) |
| `bun run test:e2e` | E2E tests (Playwright) |

## Security

Pre-release regression checklist: [`docs/SECURITY_CHECKLIST.md`](docs/SECURITY_CHECKLIST.md).

CI runs `npm audit`, `gitleaks`, `supabase db lint`, and a Lovable platform scan diff (`connector_security_scan` + `agent_security`) that fails the build on any new finding vs `.security/lovable-baseline.json`. The full report is uploaded as the `lovable-security-report` artifact on every run. After triaging a finding in Lovable (fix or ignore with rationale in `@security-memory`), refresh the baseline by replacing `.security/lovable-baseline.json` with the new export and commit.



Resolved findings from the latest scan are tracked here with the exact policy/trigger change. See migration `supabase/migrations/20260615075940_c43ef78b-b359-450d-9e3c-c0def9e55824.sql` for the authoritative SQL.

### 1. `event_presentations` — overly broad past-event metadata read (Fixed)

**Issue:** Policy `"Authenticated can view presentation metadata for published past"` let any signed-in user read presentation file paths and titles for every published past event, regardless of attendance.

**Change:** Dropped the broad policy and replaced it with an admin/creator-scoped one. Attendee access stays covered by the pre-existing attendee-scoped policy.

```sql
DROP POLICY IF EXISTS
  "Authenticated can view presentation metadata for published past"
  ON public.event_presentations;

CREATE POLICY "Admins and creators can read presentation metadata"
ON public.event_presentations
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_presentations.event_id
      AND e.created_by = auth.uid()
  )
);
```

### 2. `showcase_items` — status / ownership / type escalation on UPDATE (Fixed)

**Issue:** `prevent_showcase_status_escalation` only guarded INSERTs, so an owner could PATCH a pending row to flip `status` to `approved`, reassign `user_id`, or escalate `type` to `lead`.

**Change:** Trigger function extended to block non-admins from changing `status`, `rejection_reason`, `user_id`, or escalating `type` to `lead` on UPDATE.

```sql
CREATE OR REPLACE FUNCTION public.prevent_showcase_status_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin boolean := has_role(auth.uid(), 'admin'::app_role)
                      OR has_role(auth.uid(), 'superadmin'::app_role);
BEGIN
  IF is_admin THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
    RAISE EXCEPTION 'Only admins can change showcase status or rejection reason';
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Only admins can reassign showcase item ownership';
  END IF;

  IF NEW.type IS DISTINCT FROM OLD.type
     AND NEW.type::text = 'lead' THEN
    RAISE EXCEPTION 'Only admins can change a showcase item type to lead';
  END IF;

  RETURN NEW;
END;
$$;
```

The existing `BEFORE UPDATE` trigger on `public.showcase_items` invokes this function, so all UPDATE paths (PostgREST, edge functions running as `authenticated`, SQL clients) are covered. RLS regression coverage lives in `supabase/tests/rls/`.

