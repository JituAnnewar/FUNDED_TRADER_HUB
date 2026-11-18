# PROGRESS

Single source of truth for the build. A new session should read this file first,
then `CLAUDE.md` and `DECISIONS.md`, and continue from the first unticked item.

Full brief: `docs/BRIEF.md`.

## Phases

- [x] **Phase 1** — Scaffold, tooling, design tokens, fonts, layout shell, navbar, footer, loader
  - [x] Next.js (App Router) + TypeScript strict + Tailwind + ESLint + Prettier
  - [x] Vitest + Playwright configured
  - [x] Design tokens (CSS variables → Tailwind theme), fonts (Space Grotesk, Inter, JetBrains Mono)
  - [x] Layout shell: grid background, glass navbar, mobile full-screen menu, footer, disclaimer
  - [x] Live market-sessions pill (IST), DST-aware session detection + tests
  - [x] Branded loader (skipped on repeat visits and under reduced motion)
  - [x] Placeholder routes for every public page (no dead links), themed 404 + error page
  - [x] `.env.example`
- [x] **Phase 2** — Supabase schema, migrations, RLS, storage buckets, types, seed script
  - [x] `supabase/migrations` (schema + security). Types in `lib/types.ts` (hand-written, mirrors schema)
  - [x] Demo generator `lib/demo` + `npm run seed` (+ `--reset`)
- [x] **Phase 3** — Analytics engine + unit tests (`lib/analytics`: trades, rules, dates, portfolio)
- [x] **Phase 4** — 3D hero scene, motion system, performance guardrails
- [x] **Phase 5** — Public: Home, Performance, Accounts, Payouts
- [x] **Phase 6** — Public: Firms, Journal, Strategies, Toolkit, Tools (calculators + Monte Carlo), About, Insights, Contact, Legal, 404
- [ ] **Phase 7** — Admin: auth, layout, overview, end-of-day update, Firms, Accounts, Open positions
- [ ] **Phase 8** — Admin: Trades, CSV import, ingest endpoint, Payouts, Strategies, Journal, Toolkit, Goals, Posts, Messages, Settings, Data export, command palette, PWA
- [ ] **Phase 9** — Realtime, OG images, share cards, SEO, accessibility pass, Lighthouse pass
- [ ] **Phase 10** — Docs (SETUP.md, ADMIN_GUIDE.md, README.md) + final QA

## Deferred

_Nothing yet._

## Notes for the next session

- Node.js v26 LTS is a portable install at ~/.local/node-v26.13.1-win-x64 (no admin rights). Prefix commands with `export PATH="$HOME/.local/node-v26.13.1-win-x64:$PATH"`.
- Next.js 16.4: Cache Components on. Use `"use cache"` + `cacheLife` + `cacheTag` for public reads; `proxy.ts` replaces middleware; request-time values need `<Suspense>`.
- Public site complete (Phases 4–6). Preview mode shows demo data until Supabase env vars are set (DECISIONS #14).
