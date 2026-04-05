# Contributing to BizVibeFI

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
