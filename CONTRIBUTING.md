# Contributing to GoodVibesCafeFI

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/AminForou/bizvibefi.git
cd bizvibefi

# Install dependencies
bun install

# Start dev server
bun run dev
```

## Code Quality

Before submitting a PR, ensure all checks pass:

```bash
bun run lint        # ESLint
bun run typecheck   # TypeScript
bun run test        # Unit tests
```

## Branch Naming

Use descriptive branch names with a prefix:

- `feat/` — new features (e.g. `feat/add-newsletter-signup`)
- `fix/` — bug fixes (e.g. `fix/navbar-mobile-menu`)
- `docs/` — documentation changes
- `chore/` — maintenance tasks (deps, CI, config)
- `refactor/` — code refactoring without behavior changes

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add newsletter subscription form
fix: correct mobile nav z-index issue
docs: update README with setup instructions
chore: upgrade vite to v5.4
refactor: extract form validation into shared hook
```

## Pull Request Guidelines

1. **Keep PRs focused** — one feature or fix per PR
2. **Write a clear description** — explain what changed and why
3. **Add tests** — include unit tests for new logic and components
4. **Update translations** — if adding user-facing text, update all language files (`en.ts`, `fi.ts`, `sv.ts`)
5. **Ensure CI passes** — lint, typecheck, and tests must all be green
6. **Complete the security review** — see the checklist below before approving

## Required Reviewer Security Check

Before approving any pull request, the reviewer **must** open the project in
Lovable and confirm the **Security panel** is clean. CI covers `npm audit`,
gitleaks, and CodeQL, but the Lovable platform scanners run outside of GitHub
Actions and their findings are only visible inside the project.

Open the project → **More → Security** and verify all three scanners report no
actionable findings:

| Scanner | What it covers | Required state to merge |
| --- | --- | --- |
| `agent_security` | Agent-authored code patterns, auth/RLS misuse, leaked secrets in app code | No findings, or every finding marked `ignore`/`mark_as_fixed` with a justification |
| `supabase_lov` | RLS policies, GRANTs, exposed sensitive columns, edge function auth | Same as above |
| `connector_security_scan` (**Wiz**) | Workspace-wide infra/dependency scan from the linked Wiz connector | Same as above |

Reviewer checklist (paste into the PR review):

- [ ] Opened Security panel and confirmed `agent_security` is clean or all findings triaged
- [ ] Confirmed `supabase_lov` is clean or all findings triaged
- [ ] Confirmed `connector_security_scan` (Wiz) is clean or all findings triaged
- [ ] If any finding was ignored, the rationale is recorded in `@security-memory`
- [ ] The CI `Security summary` job (or its sticky PR comment) shows all checks green

If a scanner flags something new on this PR, do **not** approve. Either fix it,
or — if it is intentional — ignore it via `manage_security_finding` with an
explanation and update `@security-memory` so future scans don't re-raise it.

### PR Title Format

Use the same convention as commit messages:

```
feat: add dark mode toggle
fix: resolve contact form validation edge case
```

## Project Structure

```
src/
├── components/     # Reusable UI components
│   └── ui/         # shadcn/ui primitives
├── hooks/          # Custom React hooks
├── i18n/           # Translations (en, fi, sv)
├── lib/            # Utility functions
├── pages/          # Route-level page components
└── test/           # Test setup and helpers
```

## Design System

- Use **Tailwind semantic tokens** from `index.css` — never hardcode colors
- All colors must use HSL format via CSS variables
- Components should support both light and dark modes

## Translations

This is a multilingual app (English, Finnish, Swedish). When adding user-facing strings:

1. Add the key and English text to `src/i18n/en.ts`
2. Add Finnish translation to `src/i18n/fi.ts`
3. Add Swedish translation to `src/i18n/sv.ts`
4. Use the `useTranslation` hook to access translations in components

## Questions?

Open an issue or start a discussion if you're unsure about anything. We're happy to help!
