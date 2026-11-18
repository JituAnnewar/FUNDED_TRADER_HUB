import type { Metadata } from "next";
import Link from "next/link";
import { Sparkline } from "@/components/charts/svg-charts";
import { PageHeader } from "@/components/layout/page-header";
import { RiskNote } from "@/components/layout/risk-note";
import { Reveal } from "@/components/motion/reveal";
import { TiltCard } from "@/components/motion/tilt-card";
import { GlassPanel } from "@/components/ui/glass-panel";
import { EmptyState, Tag } from "@/components/ui/misc";
import { Pnl } from "@/components/ui/pnl";
import { equityCurve, summarize } from "@/lib/analytics/trades";
import { getStrategies, getTrades } from "@/lib/data/public";
import { formatPct } from "@/lib/format";

export const metadata: Metadata = {
  title: "Strategies",
  description: "The setups I trade, the rules I follow, and live statistics for each one.",
};

export default async function StrategiesPage() {
  const [strategies, trades] = await Promise.all([getStrategies(), getTrades()]);
  return (
    <>
      <PageHeader
        eyebrow="Playbook"
        title="Strategies"
        description="Each strategy's numbers are calculated from the trades tagged with it."
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {strategies.length === 0 ? (
          <EmptyState
            title="No strategies published yet"
            body="The playbook will appear here with rules, checklists and live stats."
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {strategies.map((s, i) => {
              const list = trades.filter((t) => t.strategy_id === s.id);
              const sum = summarize(list);
              return (
                <Reveal as="li" key={s.id} delay={i * 0.05}>
                  <TiltCard max={5}>
                    <Link href={`/strategies/${s.slug}`} className="block h-full rounded-2xl">
                      <GlassPanel className="flex h-full flex-col gap-4 p-5 transition-colors hover:bg-white/[0.02]">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h2 className="text-lg font-semibold">{s.name}</h2>
                            <p className="text-muted mt-1 text-sm leading-relaxed">{s.summary}</p>
                          </div>
                          {!s.is_active && <Tag>Retired</Tag>}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {s.timeframes.map((t) => (
                            <Tag key={t} tone="accent">
                              {t}
                            </Tag>
                          ))}
                          {s.markets.map((m) => (
                            <Tag key={m}>{m}</Tag>
                          ))}
                        </div>
                        <Sparkline values={equityCurve(list).map((p) => p.value)} />
                        <dl className="border-line mt-auto grid grid-cols-3 gap-2 border-t pt-3 text-sm">
                          <div>
                            <dt className="text-muted text-[11px]">Trades</dt>
                            <dd className="num">{sum.count}</dd>
                          </div>
                          <div>
                            <dt className="text-muted text-[11px]">Win rate</dt>
                            <dd className="num">
                              {sum.winRate === null ? "—" : formatPct(sum.winRate * 100, 0, false)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted text-[11px]">Net</dt>
                            <dd>
                              <Pnl value={sum.net} compact />
                            </dd>
                          </div>
                        </dl>
                      </GlassPanel>
                    </Link>
                  </TiltCard>
                </Reveal>
              );
            })}
          </ul>
        )}
        <RiskNote className="mt-4" />
      </div>
    </>
  );
}
