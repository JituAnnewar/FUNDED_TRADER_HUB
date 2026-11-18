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
import { Pnl, RValue } from "@/components/ui/pnl";
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
import { getPortfolio } from "@/lib/data/portfolio";
import { getJournalEntries, getStrategies } from "@/lib/data/public";
import { formatMoney, formatPct } from "@/lib/format";
import { TRADE_SESSION_LABELS, type TradeSession } from "@/lib/sessions";

export const metadata: Metadata = {
  title: "Performance",
  description: "Net results, win rate, profit factor, drawdown and every other number that matters, across all prop firm accounts.",
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
      <PageHeader eyebrow="Track record" title="Performance" description="Every number is calculated from net P&L after fees. Filter by date, firm, account, strategy, symbol, session or direction." />
      <Suspense fallback={<PerformanceSkeleton />}>
        <PerformanceContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function PerformanceSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6" aria-label="Loading performance">
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

  const accountLabel = new Map(accounts.map((a) => [a.id, `${firms.find((x) => x.id === a.firm_id)?.name ?? ""} ${a.label}`.trim()]));
  const strategyName = new Map(strategies.map((s) => [s.id, s.name]));
  const filters: FilterDef[] = [
    { key: "firm", label: "Firms", options: firms.map((x) => ({ value: x.id, label: x.name })) },
    { key: "account", label: "Accounts", options: accounts.map((a) => ({ value: a.id, label: accountLabel.get(a.id) ?? a.label })) },
    { key: "strategy", label: "Strategies", options: strategies.map((s) => ({ value: s.id, label: s.name })) },
    { key: "symbol", label: "Symbols", options: [...new Set(all.map((t) => t.symbol))].sort().map((s) => ({ value: s, label: s })) },
    { key: "session", label: "Sessions", options: (Object.keys(TRADE_SESSION_LABELS) as TradeSession[]).map((s) => ({ value: s, label: TRADE_SESSION_LABELS[s] })) },
    { key: "direction", label: "Directions", options: [{ value: "long", label: "Long" }, { value: "short", label: "Short" }] },
  ];

  const todayRows = views.filter((v) => v.isActive).map((v) => ({ id: v.account.id, label: accountLabel.get(v.account.id) ?? v.account.label, pnl: v.todayPnl }));

  const s = summarize(trades);
  const days = dailyPnl(trades);
  const curve = equityCurve(trades);
  const dd = maxDrawdown(curve.map((p) => p.value), f.account ? accounts.find((a) => a.id === f.account)?.starting_balance : undefined);
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
  const palette = ["#29D4FF", "#F5C451", "#B18CFF", "#FF9F5A"];

  const lastDay = days[days.length - 1]?.date ?? dayKey(now);
  const calTrades = trades.map((t) => ({ id: t.id, day: dayKey(t.closed_at ?? t.opened_at), symbol: t.symbol, direction: t.direction, net_pnl: t.net_pnl }));
  const calJournal = journal.map((j) => ({ date: j.date, post_market_review: j.post_market_review, lessons: j.lessons }));

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6">
      <PerformanceFilters filters={filters} />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          <StatTile label="Net P&L">
            <Pnl value={s.net} glow />
          </StatTile>
          <StatTile label="Win rate" sub={`${s.wins}W · ${s.losses}L · ${s.breakeven} BE`}>
            <span className="num">{s.winRate === null ? "—" : formatPct(s.winRate * 100, 1, false)}</span>
          </StatTile>
          <StatTile label="Profit factor">
            <span className="num">{s.profitFactor === null ? "—" : s.profitFactor === Infinity ? "∞" : s.profitFactor.toFixed(2)}</span>
          </StatTile>
          <StatTile label="Expectancy" sub="per trade">
            {s.expectancy === null ? <span className="text-muted">—</span> : <Pnl value={s.expectancy} />}
          </StatTile>
          <StatTile label="Average R" sub={`${s.rCount} trades with risk`}>
            <RValue value={s.avgR} />
          </StatTile>
          <StatTile label="Avg win / loss">
            <span className="num text-base">
              <span className="text-profit">{s.avgWin === null ? "—" : formatMoney(s.avgWin)}</span>
              <span className="text-muted"> / </span>
              <span className="text-loss">{s.avgLoss === null ? "—" : formatMoney(s.avgLoss)}</span>
            </span>
          </StatTile>
          <StatTile label="Largest win / loss">
            <span className="num text-base">
              {s.largestWin === null ? "—" : <Pnl value={s.largestWin} />} <span className="text-muted">/</span>{" "}
              {s.largestLoss === null ? "—" : <Pnl value={s.largestLoss} />}
            </span>
          </StatTile>
          <StatTile label="Max drawdown" sub={dd.pct !== null ? formatPct(dd.pct, 2, false) : undefined}>
            <span className="num text-loss">{dd.amount ? `−${formatMoney(dd.amount)}` : formatMoney(0)}</span>
          </StatTile>
          <StatTile label="Best / worst day" sub={best && worst ? `${best.date} · ${worst.date}` : undefined}>
            <span className="num text-base">
              {best ? <Pnl value={best.pnl} /> : "—"} <span className="text-muted">/</span> {worst ? <Pnl value={worst.pnl} /> : "—"}
            </span>
          </StatTile>
          <StatTile label="Streaks" sub={`Longest: ${st.longestWin}W · ${st.longestLoss}L`}>
            <span className={st.current.type === "win" ? "num text-profit" : st.current.type === "loss" ? "num text-loss" : "num text-muted"}>
              {st.current.type ? `${st.current.count} ${st.current.type === "win" ? "wins" : "losses"}` : "—"}
            </span>
          </StatTile>
          <StatTile label="Trades" sub={`Avg hold ${duration(s.avgHoldMs)}`}>
            <span className="num">{s.count}</span>
          </StatTile>
          <StatTile label="Consistency" sub="Largest day ÷ total profit">
            <span className="num">{consistency === null ? "—" : formatPct(consistency, 0, false)}</span>
          </StatTile>
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
                { name: "All selected", color: "#16F2A0", points: curve },
                ...perAccount.map((a, i) => ({ name: accountLabel.get(a.id) ?? "Account", color: palette[i % palette.length]!, points: equityCurve(a.list) })),
              ]}
            />
            {perAccount.length > 1 && (
              <ul className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
                <li className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 bg-profit" aria-hidden="true" /> All selected
                </li>
                {perAccount.map((a, i) => (
                  <li key={a.id} className="flex items-center gap-1.5">
                    <span className="h-0.5 w-4" style={{ background: palette[i % palette.length] }} aria-hidden="true" />
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

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <GlassPanel className="p-5">
              <h3 className="mb-4 font-semibold">By symbol</h3>
              <BreakdownBars label="Net P&L by symbol" keyLabel="Symbol" rows={breakdown(trades, (t) => t.symbol)} />
            </GlassPanel>
            <GlassPanel className="p-5">
              <h3 className="mb-4 font-semibold">By session</h3>
              <BreakdownBars
                label="Net P&L by session"
                keyLabel="Session"
                rows={breakdown(trades, (t) => t.session)}
                formatKey={(k) => TRADE_SESSION_LABELS[k as TradeSession] ?? k}
              />
            </GlassPanel>
            <GlassPanel className="p-5">
              <h3 className="mb-4 font-semibold">By strategy</h3>
              <BreakdownBars label="Net P&L by strategy" keyLabel="Strategy" rows={breakdown(trades, (t) => (t.strategy_id ? (strategyName.get(t.strategy_id) ?? "Other") : "No strategy"))} />
            </GlassPanel>
            <GlassPanel className="p-5">
              <h3 className="mb-4 font-semibold">By weekday (IST)</h3>
              <BreakdownBars label="Net P&L by weekday" keyLabel="Weekday" rows={byWeekday(trades)} />
            </GlassPanel>
            <GlassPanel className="p-5">
              <h3 className="mb-4 font-semibold">By hour opened (IST)</h3>
              <BreakdownBars label="Net P&L by hour" keyLabel="Hour" rows={byHour(trades)} formatKey={(k) => `${k}:00`} />
            </GlassPanel>
            <GlassPanel className="p-5">
              <h3 className="mb-4 font-semibold">By direction</h3>
              <BreakdownBars label="Net P&L by direction" keyLabel="Direction" rows={breakdown(trades, (t) => t.direction)} formatKey={(k) => (k === "long" ? "Long" : "Short")} />
            </GlassPanel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <GlassPanel className="p-5">
              <h3 className="mb-1 font-semibold">R-multiple distribution</h3>
              <p className="mb-3 text-xs text-muted">Trades with risk recorded. Each bar is 0.5R wide.</p>
              <Histogram label="Distribution of R multiples" buckets={rHistogram(trades)} />
            </GlassPanel>
            <GlassPanel className="p-5">
              <h3 className="mb-1 font-semibold">Cost of mistakes</h3>
              <p className="mb-3 text-xs text-muted">Net P&amp;L of trades carrying each mistake tag.</p>
              <BreakdownBars label="Net P&L by mistake tag" keyLabel="Mistake" rows={costOfMistakes(trades)} />
            </GlassPanel>
          </div>
          <RiskNote />
        </>
      )}
    </div>
  );
}
