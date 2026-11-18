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
- [x] **Phase 7** — Admin: auth, layout, overview, end-of-day update, Firms, Accounts, Open positions
- [x] **Phase 8** — Admin: Trades, CSV import, ingest endpoint, Payouts, Strategies, Journal, Toolkit, Goals, Posts, Messages, Settings, Data export, command palette, PWA
- [x] **Phase 9** — Realtime, OG images, share cards, SEO, accessibility pass, Lighthouse pass
- [x] **Phase 10** — Docs (SETUP.md, ADMIN_GUIDE.md, README.md) + final QA

## Deferred / not verified

- **Supabase not connected yet.** The live site runs in preview mode (generated demo data). RLS, Realtime, uploads, admin login and the quick-add e2e test can only be verified once a project exists (SETUP.md has the exact SQL checks).
- **Lighthouse:** could not run locally (Chrome cannot be spawned in this environment). PageSpeed Insights results for the live URL are recorded below when available.
- **Sessions globe** (optional 3D widget, brief §3.1.4): not built; the live sessions pill covers the need.
- **Generated DB types:**  is hand-written; run  after linking a project if the schema changes.
- **Screenshots in README:** add once real data is in.
- **Playwright quick-add test** is skipped unless  /  are set.

## Notes for the next session

- All 10 phases built. Live: https://funded-trader-hub.vercel.app (Vercel project `funded-trader-hub`, team `jeetu10`, auto-deploys from GitHub `main`).
- Node.js v26 LTS is a portable install at ~/.local/node-v26.13.1-win-x64 (no admin rights). Prefix commands with `export PATH="$HOME/.local/node-v26.13.1-win-x64:$PATH"`.
- Next.js 16.4: Cache Components on. Use `"use cache"` + `cacheLife` + `cacheTag` for public reads; `proxy.ts` replaces middleware; request-time values need `<Suspense>`.
- Public site complete (Phases 4–6). Preview mode shows demo data until Supabase env vars are set (DECISIONS #14).
