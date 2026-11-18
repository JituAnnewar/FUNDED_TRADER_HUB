import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DailyBars } from "@/components/charts/svg-charts";
import { RiskNote } from "@/components/layout/risk-note";
import { GlassPanel } from "@/components/ui/glass-panel";
import { StatTile } from "@/components/ui/misc";
import { Pnl } from "@/components/ui/pnl";
import { ShareButton } from "@/components/ui/share-button";
import { activeMonths, isMonthKey, monthLabel, monthRecap } from "@/lib/analytics/recap";
import { getPayouts, getTrades } from "@/lib/data/public";
import { formatMoney, formatPct } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ month: string }> }): Promise<Metadata> {
  const { month } = await params;
  if (!isMonthKey(month)) return { title: "Monthly recap" };
  return { title: `${monthLabel(month)} recap`, description: `Trading results for ${monthLabel(month)}.` };
}

export default function RecapPage({ params }: { params: Promise<{ month: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl space-y-4 px-4 pt-20 sm:px-6">
          <div className="skeleton h-12 w-72" />
          <div className="skeleton h-72" />
        </div>
      }
    >
      <RecapContent params={params} />
    </Suspense>
  );
}

async function RecapContent({ params }: { params: Promise<{ month: string }> }) {
  const { month } = await params;
  if (!isMonthKey(month)) notFound();
  const [trades, payouts] = await Promise.all([getTrades(), getPayouts()]);
  const r = monthRecap(month, trades, payouts);
  const months = activeMonths(trades, payouts);
  const i = months.indexOf(month);
  const prev = i >= 0 ? months[i + 1] : months.find((m) => m < month);
  const next = i > 0 ? months[i - 1] : undefined;
  const s = r.summary;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-14 sm:px-6 sm:pt-20">
      <Link href="/performance" className="text-sm text-muted hover:text-fg">
        ← Performance
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.25em] text-accent uppercase">Monthly recap</p>
          <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{monthLabel(month)}</h1>
        </div>
        <ShareButton title={`${monthLabel(month)} trading recap`} path={`/recap/${month}`} imagePath={`/recap/${month}/share`} />
      </div>

      {s.count === 0 && r.payouts.length === 0 ? (
        <p className="mt-10 text-muted">No public trades or payouts in this month.</p>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Net P&L">
              <Pnl value={s.net} glow />
            </StatTile>
            <StatTile label="Win rate" sub={`${s.count} trades`}>
              <span className="num">{s.winRate === null ? "—" : formatPct(s.winRate * 100, 1, false)}</span>
            </StatTile>
            <StatTile label="Profit factor">
              <span className="num">{s.profitFactor === null ? "—" : s.profitFactor === Infinity ? "∞" : s.profitFactor.toFixed(2)}</span>
            </StatTile>
            <StatTile label="Payouts">
              <span className="num text-gold">{formatMoney(r.payoutTotal)}</span>
            </StatTile>
          </div>
          {r.days.length > 0 && (
            <GlassPanel className="mt-4 p-4 sm:p-6">
              <h2 className="mb-4 font-semibold">Daily P&amp;L</h2>
              <DailyBars days={r.days} label={`Daily P&L, ${monthLabel(month)}`} />
            </GlassPanel>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <StatTile label="Best day" sub={r.best?.date}>
              {r.best ? <Pnl value={r.best.pnl} /> : "—"}
            </StatTile>
            <StatTile label="Worst day" sub={r.worst?.date}>
              {r.worst ? <Pnl value={r.worst.pnl} /> : "—"}
            </StatTile>
            <StatTile label="Best trade" sub={r.bestTrade?.symbol}>
              {r.bestTrade ? (
                <Link href={`/journal/${r.bestTrade.id}`} className="hover:underline">
                  <Pnl value={r.bestTrade.net_pnl} />
                </Link>
              ) : (
                "—"
              )}
            </StatTile>
          </div>
        </>
      )}

      <nav className="mt-8 flex justify-between text-sm" aria-label="Other months">
        {prev ? (
          <Link href={`/recap/${prev}`} className="text-accent hover:underline">
            ← {monthLabel(prev)}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/recap/${next}`} className="text-accent hover:underline">
            {monthLabel(next)} →
          </Link>
        )}
      </nav>
      <RiskNote className="mt-8" />
    </div>
  );
}
