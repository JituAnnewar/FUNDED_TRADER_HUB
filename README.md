# JEETU: Prop Firm Trader Portfolio & Live Journal

**LESS IS MORE.** A public, live record of prop firm accounts, trades and payouts, with a private admin panel to update everything from a phone.

**Live:** https://funded-trader-hub.vercel.app

- **Public site:** 3D hero, performance analytics (equity curve, P&L calendar, breakdowns, R-histogram, cost of mistakes), prop accounts with distance-to-breach meters, payouts with certificate gallery, trade journal, strategy playbook, firm comparison, calculators + Monte Carlo challenge simulator, insights, contact form.
- **Admin (`/admin`):** quick-add trades, end-of-day update, CSV import (MT4/5, cTrader, Tradovate, NinjaTrader, TradingView), HMAC ingest endpoint, uploads, MFA, command palette, installable PWA.

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript strict · Tailwind CSS v4 · Radix · Motion · Lenis · three.js / React Three Fiber / drei / postprocessing · lightweight-charts · react-hook-form + zod · Supabase (Postgres, Auth, Storage, Realtime) · Resend · Vitest · Playwright · Vercel.

## Getting started

See **[SETUP.md](SETUP.md)** (database, admin user, keys, deploy) and **[ADMIN_GUIDE.md](ADMIN_GUIDE.md)** (daily use).

```bash
npm install
cp .env.example .env.local
npm run dev
```

Without Supabase keys the site runs in **preview mode** with generated demo data and a "Demo data" banner.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests (analytics, sessions, CSV, ingest, calculators) |
| `npm run test:e2e` | Playwright smoke tests (`npx playwright install chromium` once) |
| `npm run check` | typecheck + lint + test + build |
| `npm run seed` | Insert demo data into Supabase (`-- --reset` to replace) |

## Folder structure

```
app/(public)/        public pages (+ OG images, share cards, recaps)
app/admin/           login + admin panel (route group (panel))
app/api/             ingest endpoint, admin export
components/          ui, layout, motion, three, charts, cards, admin, tools
lib/analytics/       pure stats: trades, rules/breach, portfolio, recap, filters
lib/admin/           resource configs, server actions, uploads
lib/data/            cached public reads ("use cache" + tags)
lib/import/          CSV presets + normaliser, ingest insert
lib/demo/            deterministic demo data + preview mode
supabase/migrations/ schema, RLS, storage, RPCs
tests/unit, tests/e2e
```

Project notes for contributors: [CLAUDE.md](CLAUDE.md) · decisions: [DECISIONS.md](DECISIONS.md) · status: [PROGRESS.md](PROGRESS.md) · credits: [CREDITS.md](CREDITS.md).

## Screenshots

Add screenshots of the home page, performance page and admin to `docs/screenshots/` and link them here.

## Disclaimer

For education and journaling only. Not financial advice. Most prop firm accounts trade simulated capital; payouts are paid by the firm. Trading carries a substantial risk of loss.
