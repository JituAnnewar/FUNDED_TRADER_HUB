import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TradeTable } from "@/components/cards/trade-table";
import { EquityChart } from "@/components/charts/equity-chart";
import { RiskNote } from "@/components/layout/risk-note";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Markdown } from "@/components/ui/markdown";
import { EmptyState, Section, StatTile, Tag } from "@/components/ui/misc";
import { Pnl, RValue } from "@/components/ui/pnl";
import { equityCurve, summarize } from "@/lib/analytics/trades";
import { getAccounts, getFirms, getStrategies, getTrades } from "@/lib/data/public";
import { formatPct } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = (await getStrategies()).find((x) => x.slug === slug);
  return s ? { title: s.name, description: s.summary ?? undefined } : { title: "Strategy" };
}

export default function StrategyPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl space-y-4 px-4 pt-20 sm:px-6">
          <div className="skeleton h-12 w-72" />
          <div className="skeleton h-80" />
        </div>
      }
    >
      <StrategyContent params={params} />
    </Suspense>
  );
}

async function StrategyContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [strategies, trades, accounts, firms] = await Promise.all([
    getStrategies(),
    getTrades(),
    getAccounts(),
    getFirms(),
  ]);
  const s = strategies.find((x) => x.slug === slug);
  if (!s) notFound();
  const list = trades.filter((t) => t.strategy_id === s.id);
  const sum = summarize(list);
  const label = new Map(
    accounts.map((a) => [a.id, `${firms.find((f) => f.id === a.firm_id)?.name ?? ""} ${a.label}`.trim()]),
  );
  const examples = [...list]
    .filter((t) => t.net_pnl > 0)
    .sort((a, b) => (b.r_multiple ?? 0) - (a.r_multiple ?? 0))
    .slice(0, 5);

  return (
    <>
      <header className="mx-auto max-w-5xl px-4 pt-14 pb-6 sm:px-6 sm:pt-20">
        <Link href="/strategies" className="text-muted hover:text-fg text-sm">
          ← Strategies
        </Link>
        <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">{s.name}</h1>
        {s.summary && <p className="text-muted mt-3 max-w-2xl">{s.summary}</p>}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {s.timeframes.map((t) => (
            <Tag key={t} tone="accent">
              {t}
            </Tag>
          ))}
          {s.markets.map((m) => (
            <Tag key={m}>{m}</Tag>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-4 px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Net P&L">
            <Pnl value={sum.net} />
          </StatTile>
          <StatTile label="Win rate" sub={`${sum.count} trades`}>
            <span className="num">{sum.winRate === null ? "—" : formatPct(sum.winRate * 100, 1, false)}</span>
          </StatTile>
          <StatTile label="Profit factor">
            <span className="num">
              {sum.profitFactor === null ? "—" : sum.profitFactor === Infinity ? "∞" : sum.profitFactor.toFixed(2)}
            </span>
          </StatTile>
          <StatTile label="Average R">
            <RValue value={sum.avgR} />
          </StatTile>
        </div>
        {list.length > 1 && (
          <GlassPanel className="p-4 sm:p-6">
            <h2 className="mb-4 font-semibold">Equity curve</h2>
            <EquityChart
              label={`${s.name} cumulative P&L`}
              series={[{ name: s.name, color: "#A594FF", points: equityCurve(list) }]}
              height={260}
            />
          </GlassPanel>
        )}
        <RiskNote />
      </div>

      <Section id="rules" title="Rules" className="max-w-5xl">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["Entry", s.entry_rules],
            ["Exit", s.exit_rules],
            ["Risk", s.risk_rules],
          ].map(([title, body]) =>
            body ? (
              <GlassPanel key={title} className="p-5">
                <h3 className="text-accent mb-2 text-xs tracking-[0.16em] uppercase">{title}</h3>
                <Markdown className="text-sm">{body}</Markdown>
              </GlassPanel>
            ) : null,
          )}
          {s.checklist.length > 0 && (
            <GlassPanel className="p-5">
              <h3 className="text-accent mb-3 text-xs tracking-[0.16em] uppercase">Pre-trade checklist</h3>
              <ul className="space-y-2 text-sm">
                {s.checklist.map((c) => (
                  <li key={c.text} className="flex gap-2">
                    <CheckCircle2 className="text-profit mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {c.text}
                  </li>
                ))}
              </ul>
            </GlassPanel>
          )}
        </div>
      </Section>

      <Section id="examples" title="Example trades" className="max-w-5xl">
        {examples.length ? (
          <TradeTable trades={examples} accountLabel={label} />
        ) : (
          <EmptyState title="No example trades yet" body="Winning trades tagged with this strategy will appear here." />
        )}
      </Section>
    </>
  );
}
