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
