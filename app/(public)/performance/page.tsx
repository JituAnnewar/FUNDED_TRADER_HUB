import type { Metadata } from "next";
import { Suspense } from "react";
import { EquityChart } from "@/components/charts/equity-chart";
import { PnlCalendar } from "@/components/charts/pnl-calendar";
import { BreakdownBars, DailyBars, Histogram } from "@/components/charts/svg-charts";
import { PageHeader } from "@/components/layout/page-header";
import { RiskNote } from "@/components/layout/risk-note";
import { PerformanceFilters, type FilterDef } from "@/components/performance/filters";
import { TodayPanel } from "@/components/performance/today-panel";
import { GlassPanel } from "@/components/ui/glass-panel";
import { EmptyState, StatTile } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { Pnl, RValue } from "@/components/ui/pnl";
import Link from "next/link";
import { dayKey } from "@/lib/analytics/dates";
import { filterTrades, parseFilters, type SearchParams } from "@/lib/analytics/filter";
import {
  bestWorstDay,
  breakdown,
  byHour,
  byWeekday,
  consistencyScore,
  costOfMistakes,
  dailyPnl,
  equityCurve,
  maxDrawdown,
  rHistogram,
  streaks,
  summarize,
} from "@/lib/analytics/trades";
import { activeMonths, monthLabel } from "@/lib/analytics/recap";
import { getPortfolio } from "@/lib/data/portfolio";
import { getJournalEntries, getStrategies } from "@/lib/data/public";
import { formatMoney, formatPct } from "@/lib/format";
import { TRADE_SESSION_LABELS, type TradeSession } from "@/lib/sessions";

export const metadata: Metadata = {
  title: "Performance",
  description:
    "Net results, win rate, profit factor, drawdown and every other number that matters, across all prop firm accounts.",
};

function duration(ms: number | null): string {
  if (ms === null) return "—";
  const m = Math.round(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ${m % 60}m` : `${Math.floor(h / 24)}d ${h % 24}h`;
}

export default function PerformancePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <>
      <PageHeader
        eyebrow="Track record"
        title="Performance"
        description="Every number comes from net P&L after fees. Pick a date range, or open Filters to narrow it down."
      />
      <Suspense fallback={<PerformanceSkeleton />}>
        <PerformanceContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function PerformanceSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 sm:px-6" aria-label="Loading performance">
      <div className="skeleton h-10 w-full max-w-xl" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
      <div className="skeleton h-80" />
    </div>
  );
}

async function PerformanceContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const [portfolio, strategies, journal] = await Promise.all([getPortfolio(), getStrategies(), getJournalEntries()]);
  const { trades: all, accounts, firms, views, totals } = portfolio;
  const now = new Date(portfolio.generatedAt);
  const f = parseFilters(sp);
  const trades = filterTrades(all, f, accounts, now);

  const accountLabel = new Map(
    accounts.map((a) => [a.id, `${firms.find((x) => x.id === a.firm_id)?.name ?? ""} ${a.label}`.trim()]),
  );
  const strategyName = new Map(strategies.map((s) => [s.id, s.name]));
  const filters: FilterDef[] = [
    { key: "firm", label: "Firms", options: firms.map((x) => ({ value: x.id, label: x.name })) },
    {
      key: "account",
      label: "Accounts",
      options: accounts.map((a) => ({ value: a.id, label: accountLabel.get(a.id) ?? a.label })),
    },
    { key: "strategy", label: "Strategies", options: strategies.map((s) => ({ value: s.id, label: s.name })) },
    {
      key: "symbol",
      label: "Symbols",
      options: [...new Set(all.map((t) => t.symbol))].sort().map((s) => ({ value: s, label: s })),
    },
    {
      key: "session",
      label: "Sessions",
      options: (Object.keys(TRADE_SESSION_LABELS) as TradeSession[]).map((s) => ({
        value: s,
        label: TRADE_SESSION_LABELS[s],
      })),
    },
    {
      key: "direction",
      label: "Directions",
      options: [
        { value: "long", label: "Long" },
        { value: "short", label: "Short" },
      ],
    },
  ];

  const todayRows = views
    .filter((v) => v.isActive)
    .map((v) => ({ id: v.account.id, label: accountLabel.get(v.account.id) ?? v.account.label, pnl: v.todayPnl }));

  const s = summarize(trades);
  const days = dailyPnl(trades);
  const curve = equityCurve(trades);
  const dd = maxDrawdown(
    curve.map((p) => p.value),
    f.account ? accounts.find((a) => a.id === f.account)?.starting_balance : undefined,
  );
  const { best, worst } = bestWorstDay(days);
  const st = streaks(trades);
  const consistency = consistencyScore(days);

  // Per-account curves (top 4 accounts by trade count), shown when no single account is selected.
  const perAccount = f.account
    ? []
    : [...new Set(trades.map((t) => t.account_id))]
        .map((id) => ({ id, list: trades.filter((t) => t.account_id === id) }))
        .sort((a, b) => b.list.length - a.list.length)
        .slice(0, 4);
  const palette = ["#A594FF", "#FBBF24", "#F472B6", "#34D399"];

  const lastDay = days[days.length - 1]?.date ?? dayKey(now);
  const calTrades = trades.map((t) => ({
    id: t.id,
    day: dayKey(t.closed_at ?? t.opened_at),
    symbol: t.symbol,
    direction: t.direction,
    net_pnl: t.net_pnl,
  }));
  const calJournal = journal.map((j) => ({
    date: j.date,
    post_market_review: j.post_market_review,
    lessons: j.lessons,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
      <PerformanceFilters filters={filters} />

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatTile label="Net P&L" big>
              <Pnl value={s.net} glow />
            </StatTile>
            <StatTile label="Win rate" sub={`${s.wins}W · ${s.losses}L · ${s.breakeven} BE`} big>
              <span className="num">{s.winRate === null ? "—" : formatPct(s.winRate * 100, 1, false)}</span>
            </StatTile>
            <StatTile label="Profit factor" big>
              <span className="num">
                {s.profitFactor === null ? "—" : s.profitFactor === Infinity ? "∞" : s.profitFactor.toFixed(2)}
              </span>
            </StatTile>
            <StatTile label="Max drawdown" sub={dd.pct !== null ? formatPct(dd.pct, 2, false) : undefined} big>
              <span className="num text-loss">{dd.amount ? `−${formatMoney(dd.amount)}` : formatMoney(0)}</span>
            </StatTile>
          </div>
          <GlassPanel className="p-5 sm:p-6">
            <h2 className="text-muted mb-4 text-[11px] font-medium tracking-[0.2em] uppercase">More numbers</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              <MiniStat label="Expectancy" sub="per trade">
                {s.expectancy === null ? <span className="text-muted">—</span> : <Pnl value={s.expectancy} />}
              </MiniStat>
              <MiniStat label="Average R" sub={`${s.rCount} trades with risk`}>
                <RValue value={s.avgR} />
              </MiniStat>
              <MiniStat label="Avg win / loss">
                <span className="num">
                  <span className="text-profit">{s.avgWin === null ? "—" : formatMoney(s.avgWin)}</span>
                  <span className="text-muted"> / </span>
                  <span className="text-loss">{s.avgLoss === null ? "—" : formatMoney(s.avgLoss)}</span>
                </span>
              </MiniStat>
              <MiniStat label="Largest win / loss">
                <span className="num">
                  {s.largestWin === null ? "—" : <Pnl value={s.largestWin} />} <span className="text-muted">/</span>{" "}
                  {s.largestLoss === null ? "—" : <Pnl value={s.largestLoss} />}
                </span>
              </MiniStat>
              <MiniStat label="Best / worst day" sub={best && worst ? `${best.date} · ${worst.date}` : undefined}>
                <span className="num">
                  {best ? <Pnl value={best.pnl} /> : "—"} <span className="text-muted">/</span>{" "}
                  {worst ? <Pnl value={worst.pnl} /> : "—"}
                </span>
              </MiniStat>
              <MiniStat label="Current streak" sub={`Longest: ${st.longestWin}W · ${st.longestLoss}L`}>
                <span
                  className={
                    st.current.type === "win"
                      ? "num text-profit"
                      : st.current.type === "loss"
                        ? "num text-loss"
                        : "num text-muted"
                  }
                >
                  {st.current.type ? `${st.current.count} ${st.current.type === "win" ? "wins" : "losses"}` : "—"}
                </span>
              </MiniStat>
              <MiniStat label="Trades" sub={`Avg hold ${duration(s.avgHoldMs)}`}>
                <span className="num">{s.count}</span>
              </MiniStat>
              <MiniStat label="Consistency" sub="Largest day ÷ total profit">
                <span className="num">{consistency === null ? "—" : formatPct(consistency, 0, false)}</span>
              </MiniStat>
            </dl>
          </GlassPanel>
        </div>
        <TodayPanel rows={todayRows} total={totals.todayPnl} />
      </div>
      <RiskNote />

      {trades.length === 0 ? (
        <EmptyState title="No trades in this range" body="Try a wider date range or clear the filters." />
      ) : (
        <>
          <GlassPanel className="p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">Cumulative P&amp;L</h2>
            <EquityChart
              label="Cumulative net P&L"
              height={320}
              series={[
                { name: "All selected", color: "#22D3EE", points: curve },
                ...perAccount.map((a, i) => ({
                  name: accountLabel.get(a.id) ?? "Account",
                  color: palette[i % palette.length]!,
                  points: equityCurve(a.list),
                })),
              ]}
            />
            {perAccount.length > 1 && (
              <ul className="text-muted mt-3 flex flex-wrap gap-4 text-xs">
                <li className="flex items-center gap-1.5">
                  <span className="bg-accent h-0.5 w-4" aria-hidden="true" /> All selected
                </li>
                {perAccount.map((a, i) => (
                  <li key={a.id} className="flex items-center gap-1.5">
                    <span
                      className="h-0.5 w-4"
                      style={{ background: palette[i % palette.length] }}
                      aria-hidden="true"
                    />
                    {accountLabel.get(a.id)}
                  </li>
                ))}
              </ul>
            )}
          </GlassPanel>

          <div className="grid gap-4 lg:grid-cols-2">
            <GlassPanel className="p-4 sm:p-6">
              <h2 className="mb-4 text-lg font-semibold">Daily P&amp;L</h2>
              <DailyBars days={days.slice(-90)} />
            </GlassPanel>
            <GlassPanel className="p-4 sm:p-6">
              <PnlCalendar days={days} trades={calTrades} journal={calJournal} initialMonth={lastDay.slice(0, 7)} />
            </GlassPanel>
          </div>

          <GlassPanel className="p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">Where the P&amp;L comes from</h2>
            <Tabs
              label="Break down net P&L"
              items={[
                {
                  id: "symbol",
                  label: "Symbol",
                  content: (
                    <BreakdownBars
                      label="Net P&L by symbol"
                      keyLabel="Symbol"
                      rows={breakdown(trades, (t) => t.symbol)}
                    />
                  ),
                },
                {
                  id: "session",
                  label: "Session",
                  content: (
                    <BreakdownBars
                      label="Net P&L by session"
                      keyLabel="Session"
                      rows={breakdown(trades, (t) => t.session)}
                      formatKey={(k) => TRADE_SESSION_LABELS[k as TradeSession] ?? k}
                    />
                  ),
                },
                {
                  id: "strategy",
                  label: "Strategy",
                  content: (
                    <BreakdownBars
                      label="Net P&L by strategy"
                      keyLabel="Strategy"
                      rows={breakdown(trades, (t) =>
                        t.strategy_id ? (strategyName.get(t.strategy_id) ?? "Other") : "No strategy",
                      )}
                    />
                  ),
                },
                {
                  id: "weekday",
                  label: "Weekday",
                  content: (
                    <BreakdownBars label="Net P&L by weekday (IST)" keyLabel="Weekday" rows={byWeekday(trades)} />
                  ),
                },
                {
                  id: "hour",
                  label: "Hour (IST)",
                  content: (
                    <BreakdownBars
                      label="Net P&L by hour opened (IST)"
                      keyLabel="Hour"
                      rows={byHour(trades)}
                      formatKey={(k) => `${k}:00`}
                    />
                  ),
                },
                {
                  id: "direction",
                  label: "Direction",
                  content: (
                    <BreakdownBars
                      label="Net P&L by direction"
                      keyLabel="Direction"
                      rows={breakdown(trades, (t) => t.direction)}
                      formatKey={(k) => (k === "long" ? "Long" : "Short")}
                    />
                  ),
                },
              ]}
            />
          </GlassPanel>

          <div className="grid gap-4 lg:grid-cols-2">
            <GlassPanel className="p-5">
              <h3 className="mb-1 font-semibold">R-multiple distribution</h3>
              <p className="text-muted mb-3 text-xs">Trades with risk recorded. Each bar is 0.5R wide.</p>
              <Histogram label="Distribution of R multiples" buckets={rHistogram(trades)} />
            </GlassPanel>
            <GlassPanel className="p-5">
              <h3 className="mb-1 font-semibold">Cost of mistakes</h3>
              <p className="text-muted mb-3 text-xs">Net P&amp;L of trades carrying each mistake tag.</p>
              <BreakdownBars label="Net P&L by mistake tag" keyLabel="Mistake" rows={costOfMistakes(trades)} />
            </GlassPanel>
          </div>
          <RiskNote />
        </>
      )}
      {activeMonths(all, portfolio.payouts).length > 0 && (
        <GlassPanel className="p-5">
          <h2 className="mb-3 font-semibold">Monthly recaps</h2>
          <ul className="flex flex-wrap gap-2">
            {activeMonths(all, portfolio.payouts)
              .slice(0, 12)
              .map((m) => (
                <li key={m}>
                  <Link
                    href={`/recap/${m}`}
                    className="border-line hover:border-violet-soft/50 hover:text-fg block rounded-lg border px-3 py-1.5 text-sm"
                  >
                    {monthLabel(m)}
                  </Link>
                </li>
              ))}
          </ul>
        </GlassPanel>
      )}
    </div>
  );
}

function MiniStat({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="mt-1 text-base font-semibold">{children}</dd>
      {sub && <dd className="text-muted/80 mt-0.5 text-[11px]">{sub}</dd>}
    </div>
  );
}
