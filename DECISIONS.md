# DECISIONS

Decisions made without stopping for approval (brief §1.3). Newest at the bottom.

| # | Date | Decision | Why |
|---|------|----------|-----|
| 1 | 2026-11-18 | Brand name defaults to **"JEETU"** (placeholder). It lives in `lib/site.ts` now and moves to `site_settings` in Phase 2, editable from admin. | Brand name was left blank in the brief. |
| 2 | 2026-11-18 | WhatsApp link uses `wa.me/918329896591` (India +91 prefix added). | Number was given without a country code; display timezone is IST. |
| 3 | 2026-11-18 | Contact email is **not** committed. It is read from `CONTACT_EMAIL` in `.env.local` / Vercel env. | Repo may be public; avoid exposing a personal address to scrapers. |
| 4 | 2026-11-18 | Markets: Forex and Gold (XAUUSD). Firms: NYS, FundingPips, FTMO ("FTM" in brief), The5ers. Firm data is seeded as demo data in Phase 2 and editable in admin. | From brief §0. "FTM" read as FTMO. |
| 5 | 2026-11-18 | Package manager: npm (ships with Node; no extra install). | Fewer moving parts for a non-developer owner. |
| 6 | 2026-11-18 | Market sessions are computed from each market's own IANA time zone (Australia/Sydney, Asia/Tokyo, Europe/London, America/New_York) so DST is handled automatically. Trade `session` buckets: `asia` (Tokyo 09:00–18:00 local, or Sydney when Tokyo closed), `london` (08:00–17:00 London), `new_york` (08:00–17:00 NY), `london_ny_overlap` when both London and NY are open. | Brief §4 requires DST-correct sessions. |
| 7 | 2026-11-18 | Next.js 16.4 with Cache Components. Public reads are `"use cache"` functions in `lib/data/public.ts`, tagged per table (`lib/data/tags.ts`); admin writes call `updateTag`. | Matches "server-rendered and cached; writes revalidate" with the current Next.js model. |
| 8 | 2026-11-18 | Private columns (`trades.private_notes`, `accounts.private_notes`) hidden from anon with column-level GRANTs; contact form uses the `submit_contact_message` security-definer RPC (rate limit enforced in SQL). | Keeps the service-role key out of the contact path; RLS + grants verified in SQL. |
| 9 | 2026-11-18 | Activity log written by a Postgres trigger on every content table (skips demo rows and service-role writes). Phase history written by a trigger on `accounts.phase`. | "Every admin write goes to activity_log" cannot be forgotten in app code. |
| 10 | 2026-11-18 | Breach math: daily limit = % × starting balance; trailing floors never rise above starting balance; usage amber ≥ 50 %, red ≥ 80 %. Trade `session` is computed in the app (`lib/sessions.ts`) on every write path. | Common prop-firm conventions; owner can override per account. |
| 11 | 2026-11-18 | Added a `milestones` table (About timeline) — not in the brief's table list but required by §6.11. | Timeline must be editable without code. |
| 12 | 2026-11-18 | DB types are hand-written in `lib/types.ts` instead of `supabase gen types` (no project linked yet). | Regenerate once a project exists; shapes match the migrations. |
| 13 | 2026-11-18 | Hosting: Vercel project `funded-trader-hub` connected to the GitHub repo; pushes to `main` auto-deploy. | Owner asked for a live link first. |
| 14 | 2026-11-18 | **Preview mode**: when Supabase env vars are missing, public pages render generated demo data (with the Demo banner) instead of empty states. Set `DEMO_PREVIEW=off` to disable. | Lets the owner review the live site before the database exists. Real data replaces it automatically once Supabase is connected. |
| 15 | 2026-11-18 | Admin CRUD is config-driven: `lib/admin/resources.ts` defines fields per table; one zod schema per resource is built from it and used by both react-hook-form and the Server Actions. Generic pages live at `/admin/r/[resource]`. | Consistent validation and UX across 11 resources with far less code. |
| 16 | 2026-11-18 | Datetime inputs in admin are IST (`datetime-local`) and converted to UTC ISO before saving (`lib/time-input.ts`). | Owner thinks in IST; DB stays UTC. |
| 17 | 2026-11-18 | CSV import: rows without a ticket ID get a stable hash-based ID (`auto-…`) so re-importing the same file never duplicates. Commission is always treated as a cost; negative swap is a cost, positive swap adds to P&L. | De-duplication must work for every export format. |
| 18 | 2026-11-18 | Ingest auth: `X-Timestamp` + `X-Signature: sha256=HMAC(INGEST_SECRET, "<ts>.<body>")`, ±5 min window. Uses the service-role client server-side only. | Replay-safe, easy to implement in MQL5 and webhooks. |
| 19 | 2026-11-18 | PWA: manifest + minimal network-only service worker scoped to /admin (no page caching, so data is never stale). | Installable admin on phone without stale-data risk. |
