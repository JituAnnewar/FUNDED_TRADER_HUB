# BUILD BRIEF — Prop Firm Trader Portfolio, Live Journal & Admin Platform

> Owner's original brief, stored so any future session can continue the build.
> The contact email has been removed from this copy (it lives in `CONTACT_EMAIL`).

## 0. Inputs
- Trader name: JEETU
- Brand / site name: _(blank → placeholder "JEETU", see DECISIONS.md)_
- Tagline: LESS IS MORE
- Markets traded: Forex / Gold
- Prop firms currently used: NYS, FUNDING PIPS, FTM(O), 5ers
- Contact email: set via `CONTACT_EMAIL` env var
- Socials: Instagram [ ] · X [ ] · YouTube [ ] · Telegram [ ] · Discord [ ] · WhatsApp 8329896591
- Display timezone: Asia/Kolkata (IST). Base currency: USD (optional INR view).

## 1. Role & working rules
Senior full-stack engineer, product designer, creative technologist (WebGL/3D/motion). Build a production-ready, deployable web app: public portfolio + live trading journal + private admin panel (owner updates everything without code).

1. Keep `CLAUDE.md` (summary, stack, conventions, commands) and `PROGRESS.md` (phase checklist) updated.
2. Per phase: typecheck, lint, tests, production build; fix every error; commit with clear message (e.g. `feat(accounts): ...`); tick PROGRESS.md; push.
3. Don't stop for approval between phases. Only stop on true blockers (missing secret). Record decisions in `DECISIONS.md`.
4. PROGRESS.md must always be accurate enough to resume from.
5. Never commit secrets. `.env.example` documents every variable.
6. No dead buttons, no lorem ipsum, no TODOs in shipped paths. Every page works with empty DB (designed empty states) and with lots of data (pagination / virtualised lists).
7. Fewer, well-built features > many half-built. Cuts listed honestly under "Deferred".
8. UI copy: simple, clear English. No hype words.

## 2. Stack
- Next.js App Router + TypeScript strict + RSC where sensible
- Tailwind CSS + shadcn/ui (Radix) + lucide-react
- Motion (`motion/react`); Lenis smooth scroll (off under reduced motion)
- three.js via @react-three/fiber, drei, postprocessing (Bloom)
- TradingView `lightweight-charts` for equity/balance; Recharts or custom SVG for bars, donuts, histograms, heatmaps
- react-hook-form + zod (shared client/server schemas)
- Supabase (Postgres, Auth, Storage, Realtime) via `@supabase/ssr`; mutations via Server Actions; public pages server-rendered + cached; admin writes call `revalidatePath`/`revalidateTag`
- Resend for contact email (optional; works without key, messages saved to DB)
- Honeypot + rate limiting; Cloudflare Turnstile if key provided
- date-fns + date-fns-tz; store UTC, display IST
- Vitest (unit) + Playwright (smoke)
- Vercel free tier; no paid service required for core app

## 3. Design: "Trading terminal meets luxury fintech"
Dark, cinematic, premium. Bloomberg × Apple product page × sci-fi HUD. Must not look like a template.

Tokens: Background `#05070A` · Surface `#0B1016` · Elevated `#111823` · Border `rgba(255,255,255,0.08)` · Profit `#16F2A0` · Loss `#FF3D6E` · Accent cyan `#29D4FF` · Payout gold `#F5C451` · Muted `#8A96A8`.

Type: Space Grotesk (display), Inter (body), JetBrains Mono for numbers with tabular-nums.

Surfaces: glass panels (backdrop blur, 1px gradient borders), faint grid/scanline background, soft neon glow on key numbers. Profit always green with "+", loss red with "−". Never colour alone.

### 3.1 3D
1. Home hero (R3F): glowing 3D candlesticks assembling into a rising chart (staggered spring), infinite neon grid floor into fog, floating data-dust particles, Bloom, slow auto-orbit with mouse parallax (gyro on phones). Overlay: name, tagline, CTAs, big "Total payouts" count-up.
2. Payouts header: procedural rotating gold coin/medal, metallic, env reflections.
3. Account + certificate cards: 3D tilt with moving glare; certificates flip to reveal details.
4. Optional: sessions globe with arcs (Sydney, Tokyo, London, New York).
5. Procedural models only; any external asset must be CC0 and credited in CREDITS.md.

### 3.2 Motion
- Branded loader: candlestick draws itself, morphs into logo (≤1.2s, skipped on repeat visits).
- Page transitions, scroll reveals, staggered lists, count-up stats in view.
- Infinite ticker-tape marquee of recent public trades and payouts.
- P&L values flash green/red on change (Realtime).
- Animated radial gauges for profit target and drawdown usage.
- Magnetic buttons and custom cursor (desktop only).

### 3.3 Performance guardrails (mandatory)
- Every `<Canvas>` via `next/dynamic` (`ssr:false`) after first paint, with static poster meanwhile.
- drei `PerformanceMonitor` + `AdaptiveDpr`; mobile/low-power: fewer particles, DPR ≤ 1.5, no post-processing.
- Reduced motion: no auto-rotate/smooth scroll/parallax; instant transitions; static render instead of 3D.
- Stop rendering when off-screen or tab hidden.
- Lighthouse mobile Perf ≥ 80, desktop ≥ 90; A11y, BP, SEO ≥ 95; mobile LCP < 2.5s.

### 3.4 Responsive
Mobile-first; verify 360/390/768/1024/1440/1920. Tables → cards on mobile; nav → animated full-screen menu. Admin fully usable on phone.

## 4. Data model (Supabase)
Migrations in `supabase/migrations/`, generated TS types, seed script. Every table: `id uuid pk default gen_random_uuid()`, `created_at`, `updated_at` (trigger), `is_demo boolean default false`, `is_public boolean default true` where content could be private.

- **firms**: name, slug, logo_url, website, description, profit_split_pct, drawdown_type (`static`|`trailing_eod`|`trailing_intraday`), max_daily_loss_pct, max_total_loss_pct, profit_target_phase1_pct, profit_target_phase2_pct, min_trading_days, consistency_rule_pct (nullable), payout_frequency, personal_review (md), sort_order
- **accounts**: firm_id, label, account_size, currency, phase (`challenge_phase_1`|`challenge_phase_2`|`funded`|`passed`|`payout_pending`|`breached`|`closed`), platform (MT4, MT5, cTrader, DXtrade, Match-Trader, Tradovate, Rithmic, NinjaTrader, TradingView, Other), masked_account_id (last 4 only), starting_balance, current_balance, current_equity, high_water_mark, start_date, status_note, nullable rule overrides, sort_order
- **account_phase_history**: account_id, from_phase, to_phase, changed_at, note
- **account_snapshots**: account_id, date, balance, equity, day_pnl, note; unique(account_id, date)
- **open_positions**: account_id, symbol, direction (`long`|`short`), size, entry_price, stop_loss, take_profit, opened_at, floating_pnl
- **strategies**: name, slug, summary, timeframes[], markets[], entry_rules, exit_rules, risk_rules (md), checklist (jsonb), cover_image_url, is_active
- **trades**: account_id, strategy_id, symbol, market (`forex`|`index`|`commodity`|`crypto`|`futures`|`stock`), direction, opened_at, closed_at, entry_price, exit_price, stop_loss, take_profit, size, risk_amount, pnl (gross), fees, net_pnl (generated), r_multiple (computed when risk present), session (auto from opened_at, DST-aware: `asia`|`london`|`new_york`|`london_ny_overlap`), timeframe, setup_tags[], mistake_tags[], emotion_before, emotion_after, rating (1–5), followed_plan, notes (md), external_ticket_id (unique per account)
- **trade_images**: trade_id, url, caption, kind (`before`|`after`|`other`), sort_order
- **payouts**: account_id, firm_id, amount, currency, paid_on, method (bank, crypto, Rise, Deel, other), certificate_url, verification_url, note, is_featured
- **journal_entries**: date (unique), pre_market_plan, post_market_review, mood (1–5), focus (1–5), lessons, tags[]
- **toolkit_items**: category (`platform`|`charting`|`indicator`|`hardware`|`broker`|`education`|`other`), name, description, url, image_url, is_affiliate, sort_order
- **goals**: title, metric (`total_payouts`|`monthly_pnl`|`funded_capital`|`custom`), target_amount, current_override (nullable), deadline
- **posts**: title, slug, excerpt, body (md), cover_url, published_at
- **contact_messages**: name, email, category (`mentorship`|`collaboration`|`business`|`general`), subject, message, status (`new`|`read`|`replied`|`archived`), ip_hash, user_agent
- **site_settings** (single row): brand name, tagline, hero copy, about, avatar_url, socials (jsonb), section visibility toggles, show_open_positions_publicly, usd_to_inr_rate, disclaimer text, SEO defaults, show_tradingview_widgets
- **admins**: user_id → auth.users
- **activity_log**: actor, action, entity, entity_id, diff (jsonb)

Buckets: `certificates`, `trade-screenshots`, `firm-logos`, `site-media`. Client-side compress/resize (max 2000px, WebP). PDFs allowed for certificates with image thumbnail.

## 5. Security & RLS
- RLS on every table and bucket.
- Anon: SELECT only `is_public = true` rows and public-safe columns (views; never ip_hash, user_agent, private notes).
- Writes only when `auth.uid()` in `admins`.
- contact_messages: anon INSERT only via validated, rate-limited server action (3 per 10 min per IP hash). Admin read only.
- Service-role key never in browser.
- Public sign-ups disabled; one admin created manually (SETUP.md). Support TOTP MFA.
- Never store prop firm/broker passwords. Account numbers masked.
- Admin inactivity auto-logout. Every admin write → activity_log.

## 6. Public pages
Global: sticky glass navbar; live market-sessions pill (IST); ticker tape; footer with socials, disclaimer, privacy; one-line risk disclaimer under every P&L section.

1. **Home `/`**: 3D hero; count-up stats (total payouts, funded capital, # funded accounts, win rate, PF, trading days); latest payouts strip; active accounts preview; equity teaser; strategies teaser; toolkit teaser; goals progress; contact CTA; optional lazy TradingView widgets (settings toggle).
2. **Performance `/performance`**: ranges (today, week, month, quarter, YTD, all, custom) + filters (firm, account, strategy, symbol, session, direction). KPIs: net P&L, win rate, PF, expectancy, avg R, avg win/loss, largest win/loss, max DD, best/worst day, current/longest streaks, trade count, avg hold, consistency. Charts: cumulative equity (all/per account), daily P&L bars, P&L calendar heatmap (click day → trades + journal), breakdowns by symbol/session/weekday/hour/strategy/direction, R histogram, cost of mistakes. Today panel via Realtime.
3. **Accounts `/accounts`**: cards filterable by firm, size (5K…200K, custom), phase. Card: logo, size, phase badge, balance/equity, today P&L, total return %, target ring, distance-to-breach meters (amber ≥50% used, red ≥80%), trading days done/required, consistency status. Summary bar: capital by phase. `/accounts/[id]`: equity curve, phase timeline, snapshots, trades, payouts, open positions (if public).
4. **Payouts `/payouts`**: gold total counter, timeline, cumulative chart, by-firm breakdown, certificate masonry gallery (lightbox zoom, 3D tilt), "Verified" badge, share button.
5. **Firms `/firms`**: per-firm rules, his accounts and payouts, personal review; side-by-side rules comparison.
6. **Journal `/journal`**: public trade log (table desktop / cards mobile; search, filters, pagination). `/journal/[id]`: before/after slider, plan vs execution, tags, emotions, rating, notes, R. Daily journal entries view.
7. **Strategies `/strategies`** + `/strategies/[slug]`: rules, checklist, example trades, auto stats + own equity curve.
8. **Toolkit `/toolkit`**: grouped items, affiliate links labelled.
9. **Tools `/tools`**: position size, R:R + break-even win rate, drawdown recovery, prop challenge planner, Monte Carlo challenge simulator (Web Worker; pass vs breach probability, distribution, sample paths).
10. **Insights `/insights`**: markdown blog, reading time, OG image per post.
11. **About `/about`**: story, milestone timeline, goals progress.
12. **Contact `/contact`**: animated form, inline validation, honeypot, rate limit, success animation; Telegram/WhatsApp/Instagram/X/YouTube/Discord buttons; DB + Resend.
13. **Legal**: `/disclaimer` (educational/journaling only; not advice or solicitation; past performance ≠ future; most prop accounts are simulated, payouts paid by firm; substantial risk), `/privacy`.
14. **404/error** in theme ("Stopped out: this page doesn't exist").

## 7. Admin `/admin`
- Login (email+password, optional TOTP), middleware protection, inactivity logout.
- Overview: today P&L, accounts close to breach, unread messages, recent activity, quick actions.
- End-of-day update: table of active accounts (balance, equity, today P&L, note) → "Save all" creates snapshots + updates accounts; prefilled from last snapshot; keyboard-driven; phone-friendly.
- Firms CRUD with logo upload. Accounts: create (firm → rules prefill → size → phase), move phases with history, breach/close, reorder, public/private.
- Open positions: add/update/close; close → convert to trade.
- Trades: quick add (<15s on phone), full form, multi-screenshot upload (drag-drop, paste), bulk edit tags/visibility, duplicate.
- CSV import: upload → mapping UI with presets (MT4/MT5, cTrader, Tradovate, NinjaTrader, TradingView, generic) → preview with row errors → dedupe by external_ticket_id → import; save custom presets.
- `POST /api/ingest/trade` with HMAC secret header; documented in SETUP.md.
- Payouts CRUD with certificate upload (image/PDF), featured toggle.
- Strategies, Journal (daily template), Toolkit, Goals, Posts: CRUD with markdown editor + preview.
- Messages inbox: read, replied, archive, mailto reply.
- Site settings (all of site_settings).
- Data: export JSON + CSV; "Remove all demo data".
- Lists: search, filter, sort, pagination, optimistic UI, toasts, delete confirms; writes revalidate public pages.
- Command palette (Ctrl/Cmd+K). Installable PWA.

## 8. Analytics definitions (`lib/analytics/`, pure, tested; net P&L after fees)
- Win rate = wins ÷ closed trades (BE counted separately)
- Profit factor = gross profit ÷ |gross loss| ("∞" when no losses)
- Expectancy = (win rate × avg win) − (loss rate × avg loss)
- Avg R = mean r_multiple over trades with risk
- Max drawdown = largest peak-to-trough of cumulative equity ($ and %)
- Consistency score = largest single-day profit ÷ total profit, vs firm rule
- Distance to daily breach = daily limit − today's loss ($, %)
- Distance to max breach by drawdown type: static (from starting balance), trailing intraday (from HWM), EOD trailing (from highest EOD balance in snapshots)
- Streaks, best/worst day, avg hold, P&L by weekday/hour/session/symbol/strategy/direction
- Cost of mistakes = sum net P&L per mistake tag
- Locale formatting, currency sign, explicit +/−; optional INR via manual rate.

## 9. Seed data
3 firms, 6 accounts (varied sizes/phases), ~150 trades over 3 months, daily snapshots, 6 payouts with placeholder certificates, 3 strategies, toolkit items, journal entries, 2 goals. All `is_demo = true`. Script + admin button to delete demo data. "Demo data" banner on public site while demo rows exist.

## 10. SEO, sharing, a11y
Per-page metadata, sitemap, robots, JSON-LD (Person + WebSite), canonicals, admin noindex. Dynamic OG images (home, payouts, accounts, trades, monthly recaps). Share cards for payouts + monthly recap. WCAG 2.1 AA: keyboard nav, focus rings, chart aria + data-table fallback, contrast, signs not just colour.

## 11. Code quality
Structure: `app/(public)`, `app/admin`, `app/api`, `components/{ui,three,charts,motion,admin}`, `lib/{supabase,analytics,validation,import,utils}`, `supabase/migrations`, `scripts`, `tests`. Strict TS, no `any`, ESLint + Prettier, shared zod schemas. Shimmer skeletons, error boundaries, friendly empty states (+ admin shortcut when logged in). Vitest for analytics, sessions, CSV parsers. Playwright: home renders, admin redirects when logged out, quick-add trade flow.

## 12. Phases
1. Scaffold, tooling, tokens, fonts, layout shell, navbar, footer, loader
2. Supabase schema, migrations, RLS, buckets, types, seed
3. Analytics engine + tests
4. 3D hero, motion system, perf guardrails
5. Public: Home, Performance, Accounts, Payouts
6. Public: Firms, Journal, Strategies, Toolkit, Tools, About, Insights, Contact, Legal, 404
7. Admin: auth, layout, overview, EOD update, Firms, Accounts, Open positions
8. Admin: Trades, CSV import, ingest, Payouts, Strategies, Journal, Toolkit, Goals, Posts, Messages, Settings, Export, command palette, PWA
9. Realtime, OG images, share cards, SEO, a11y, Lighthouse
10. Docs + final QA (360px & 1920px, empty DB & seed)

## 13. Docs (for a non-developer)
- SETUP.md: Supabase project → migrations → buckets → disable sign-ups → admin user + `admins` row → `.env.local` → run locally → Vercel deploy + env vars → custom domain → MFA → optional Resend/Turnstile → ingest endpoint.
- ADMIN_GUIDE.md: 2-minute daily routine, firms/accounts, phase moves, phone logging, CSV import, certificates, visibility, demo data removal, backups.
- README.md: overview, stack, scripts, structure, screenshots.

## 14. Definition of done
Build/typecheck/lint/tests pass. Every page works at 360 & 1920 px, empty DB & seed. Anon can only write contact messages (verified with anon key). 3D degrades gracefully; Lighthouse met or gap documented. Admin can do all of §7 without code/DB. PROGRESS.md ticked; deferred listed.
