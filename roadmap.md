# Dependabot major-version upgrades

- [x] #22 date-fns v4
- [x] #25 vaul v1.1
- [x] #60 jsdom v30 (CI Node bumped to 24 for engine requirement)
- [x] #24 @eslint/js v10 (with eslint v10, globals v17)
- [x] #23 eslint-plugin-react-hooks v7 (compiler rules set to warn)
- [x] #26 react-day-picker v10 (Calendar rewritten for new classNames API)
- [x] #61 lucide-react v1 (pin + override removed)
- [x] #65 vitest v5
- [x] #66 js-yaml override 4.3.2
- [ ] #58 typescript 7 — still blocked upstream: typescript-eslint refuses to load with TS 7 (needs the TS 6 JS API, which has no stable release). Staying on 5.9.3; Dependabot ignores the major.
- [x] #59 tailwindcss v4 — migrated with the official upgrade tool: CSS-first config in src/index.css (@theme, @plugin, @custom-variant dark, @utility container), @tailwindcss/postcss, tailwind.config.ts removed, autoprefixer dropped, typography plugin re-registered. Light/dark screenshots verified.
