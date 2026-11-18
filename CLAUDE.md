# CLAUDE.md

Prop firm trader portfolio + live trading journal + private admin panel for **JEETU**
("LESS IS MORE"). Forex and Gold. Firms: NYS, FundingPips, FTMO, The5ers.

Read in this order when resuming: `PROGRESS.md` → `DECISIONS.md` → `docs/BRIEF.md` (full spec).

## Stack
- Next.js App Router, TypeScript strict, React Server Components by default
- Tailwind CSS v4 (tokens in `app/globals.css` via `@theme`), shadcn-style primitives in `components/ui`, lucide-react
- Motion (`motion/react`), Lenis (off under reduced motion)
- three.js / @react-three/fiber / drei / postprocessing (Phase 4)
- lightweight-charts + custom SVG charts (Phase 5)
- Supabase via `@supabase/ssr`, Server Actions for writes (Phase 2+)
- react-hook-form + zod, date-fns + date-fns-tz (store UTC, show Asia/Kolkata)
- Vitest (unit, `tests/unit`), Playwright (smoke, `tests/e2e`)
- npm, deployed on Vercel

## Commands
```
npm run dev         # local dev server on :3000
npm run build       # production build
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run format      # prettier --write
npm test            # vitest run
npm run test:e2e    # playwright (needs `npx playwright install chromium` once)
npm run check       # typecheck + lint + test + build (run before every commit)
```

## Structure
```
app/(public)/      public pages (layout has navbar, ticker, footer)
app/admin/         admin panel (Phase 7+)
app/api/           route handlers (ingest, etc.)
components/ui      primitives (Button, GlassPanel, ...)
components/layout  navbar, footer, mobile menu, sessions pill
components/motion  loader, reveals, count-up
components/three   R3F scenes (always loaded via next/dynamic ssr:false)
components/charts  charts
lib/               site config, utils, sessions, format, analytics, supabase, validation, import
supabase/migrations
scripts/           seed etc.
tests/unit, tests/e2e
```

## Conventions
- Numbers: always `font-mono tabular-nums` (`.num` utility). P&L uses `formatPnl` from `lib/format.ts`: "+" green / "−" (U+2212) red, never colour alone.
- Colours only via tokens: `bg`, `surface`, `elevated`, `line`, `profit`, `loss`, `accent`, `gold`, `muted`.
- Every P&L section ends with `<RiskNote />`.
- All times stored UTC; display with `lib/time.ts` helpers (IST).
- No `any`. Shared zod schemas in `lib/validation`.
- Client components only when needed (interactivity, motion, three).
- Commit style: `feat(scope): ...`, `fix(scope): ...`, `chore: ...`.
- Copy: plain English, no hype.
