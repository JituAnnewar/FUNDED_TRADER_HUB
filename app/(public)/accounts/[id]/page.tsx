import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FirmMark } from "@/components/cards/account-card";
import { PayoutCard } from "@/components/cards/payout-card";
import { TradeTable } from "@/components/cards/trade-table";
import { EquityChart } from "@/components/charts/equity-chart";
import { RiskNote } from "@/components/layout/risk-note";
import { GlassPanel } from "@/components/ui/glass-panel";
import { BreachMeter, EmptyState, PhaseBadge, RadialGauge, Section, StatTile } from "@/components/ui/misc";
import { Money, Pct, Pnl } from "@/components/ui/pnl";
import { getPortfolio } from "@/lib/data/portfolio";
import { getOpenPositions, getPhaseHistory, getSettings } from "@/lib/data/public";
import { formatMoney } from "@/lib/format";
import { formatDateIST, formatDateTimeIST } from "@/lib/time";
import { PHASE_LABELS } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { views } = await getPortfolio();
  const v = views.find((x) => x.account.id === id);
  if (!v) return { title: "Account" };
  const title = `${v.firm?.name ?? ""} ${formatMoney(v.account.account_size, { compact: true })} ${v.account.label}`.trim();
  return { title, description: `${PHASE_LABELS[v.account.phase]} account. Balance ${formatMoney(v.account.current_balance)}.` };
}

export default function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl space-y-4 px-4 pt-20 sm:px-6"><div className="skeleton h-12 w-80" /><div className="skeleton h-96" /></div>}>
      <AccountContent params={params} />
    </Suspense>
  );
}

async function AccountContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [portfolio, history, positions, settings] = await Promise.all([getPortfolio(), getPhaseHistory(), getOpenPositions(), getSettings()]);
  const v = portfolio.views.find((x) => x.account.id === id);
  if (!v) notFound();
  const a = v.account;
  const snaps = portfolio.snapshots.filter((s) => s.account_id === id);
  const trades = portfolio.trades.filter((t) => t.account_id === id);
  const payouts = portfolio.payouts.filter((p) => p.account_id === id);
  const phases = history.filter((h) => h.account_id === id);
  const open = settings.show_open_positions_publicly ? positions.filter((p) => p.account_id === id) : [];
  const label = new Map([[a.id, a.label]]);

  return (
    <>
      <header className="mx-auto max-w-7xl px-4 pt-14 pb-8 sm:px-6 sm:pt-20">
        <Link href="/accounts" className="text-sm text-muted hover:text-fg">
          ← All accounts
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <FirmMark name={v.firm?.name ?? "Firm"} logo={v.firm?.logo_url} className="size-12" />
          <div>
            <h1 className="text-3xl font-semibold sm:text-4xl">
              {v.firm?.name} {formatMoney(a.account_size, { compact: true })} <span className="text-muted">{a.label}</span>
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
              <PhaseBadge phase={a.phase} /> {a.platform} · Started {formatDateIST(new Date(a.start_date))}
              {a.masked_account_id && <span className="num">· ••{a.masked_account_id}</span>}
            </p>
          </div>
        </div>
        {a.status_note && <p className="mt-4 max-w-2xl text-sm text-muted">{a.status_note}</p>}
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="Balance">
            <Money value={a.current_balance} />
          </StatTile>
          <StatTile label="Equity">
            <Money value={a.current_equity} />
          </StatTile>
          <StatTile label="Today">
            <Pnl value={v.todayPnl} />
          </StatTile>
          <StatTile label="Total return">
            <Pct value={v.returnPct} />
          </StatTile>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <GlassPanel className="p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">Balance</h2>
            {snaps.length > 1 ? (
              <EquityChart
                label={`Balance of ${a.label}`}
                series={[
                  { name: "Balance", color: "#29D4FF", points: snaps.map((s) => ({ time: `${s.date}T12:00:00Z`, value: s.balance })) },
                  { name: "Equity", color: "#16F2A0", points: snaps.map((s) => ({ time: `${s.date}T12:00:00Z`, value: s.equity })) },
                ]}
              />
            ) : (
              <p className="text-sm text-muted">The balance chart appears after the second daily update.</p>
            )}
          </GlassPanel>
          <GlassPanel className="space-y-5 p-5">
            {v.target && (
              <div className="flex items-center gap-4">
                <RadialGauge pct={v.target.pct} label="Profit target progress" color="var(--c-profit)" size={96}>
                  <span className="num font-semibold">{Math.min(999, v.target.pct).toFixed(0)}%</span>
                </RadialGauge>
                <div className="text-sm">
                  <p className="text-muted">Profit target</p>
                  <p className="num">
                    {formatMoney(Math.max(0, v.target.profit))} / {formatMoney(v.target.targetAmount)}
                  </p>
                </div>
              </div>
            )}
            {v.daily && (
              <BreachMeter label="Daily loss" usedPct={v.daily.usedPct} level={v.daily.level} detail={<><span className="num">{formatMoney(v.daily.distance)}</span> left of <span className="num">{formatMoney(v.daily.limit)}</span></>} />
            )}
            {v.max && (
              <BreachMeter
                label={`Max loss (${v.rules?.drawdown_type.replace("_", " ")})`}
                usedPct={v.max.usedPct}
                level={v.max.level}
                detail={<>Breach level <span className="num">{formatMoney(v.max.floor ?? 0)}</span> · <span className="num">{formatMoney(v.max.distance)}</span> away</>}
              />
            )}
            <dl className="grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
              <div>
                <dt className="text-xs text-muted">Trading days</dt>
                <dd className="num">
                  {v.tradingDaysDone}
                  {v.tradingDaysRequired ? ` / ${v.tradingDaysRequired}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Consistency</dt>
                <dd className="num">{v.consistency.score === null ? "—" : `${v.consistency.score.toFixed(0)}%`}{v.consistency.limit ? ` / ${v.consistency.limit}%` : ""}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">High-water mark</dt>
                <dd className="num">{formatMoney(a.high_water_mark)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Trades</dt>
                <dd className="num">{v.summary.count}</dd>
              </div>
            </dl>
          </GlassPanel>
        </div>
        <RiskNote />
      </div>

      {phases.length > 0 && (
        <Section id="phases" title="Phase history">
          <ol className="relative space-y-4 border-l border-line pl-6">
            {phases.map((h) => (
              <li key={h.id} className="relative">
                <span className="absolute top-1.5 -left-[29px] size-2.5 rounded-full border-2 border-bg bg-accent" aria-hidden="true" />
                <p className="text-sm">
                  {h.from_phase ? `${PHASE_LABELS[h.from_phase]} → ` : ""}
                  <strong className="font-medium">{PHASE_LABELS[h.to_phase]}</strong>
                </p>
                <p className="num text-xs text-muted">{formatDateIST(new Date(h.changed_at))}</p>
                {h.note && <p className="text-xs text-muted">{h.note}</p>}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {open.length > 0 && (
        <Section id="positions" title="Open positions">
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] text-left text-[11px] tracking-[0.12em] text-muted uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Symbol</th>
                  <th className="px-4 py-3 font-medium">Side</th>
                  <th className="px-4 py-3 text-right font-medium">Size</th>
                  <th className="px-4 py-3 text-right font-medium">Entry</th>
                  <th className="px-4 py-3 font-medium">Opened</th>
                  <th className="px-4 py-3 text-right font-medium">Floating</th>
                </tr>
              </thead>
              <tbody>
                {open.map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="px-4 py-3">{p.symbol}</td>
                    <td className="px-4 py-3">{p.direction === "long" ? "Long" : "Short"}</td>
                    <td className="num px-4 py-3 text-right">{p.size}</td>
                    <td className="num px-4 py-3 text-right">{p.entry_price}</td>
                    <td className="num px-4 py-3 text-muted">{formatDateTimeIST(new Date(p.opened_at))}</td>
                    <td className="px-4 py-3 text-right">
                      <Pnl value={p.floating_pnl} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {payouts.length > 0 && (
        <Section id="account-payouts" title="Payouts from this account">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {payouts.map((p) => (
              <li key={p.id}>
                <PayoutCard payout={p} firmName={v.firm?.name ?? ""} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {snaps.length > 0 && (
        <Section id="snapshots" title="Daily snapshots">
          <div className="max-h-96 overflow-auto rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface text-left text-[11px] tracking-[0.12em] text-muted uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Balance</th>
                  <th className="px-4 py-3 text-right font-medium">Equity</th>
                  <th className="px-4 py-3 text-right font-medium">Day P&amp;L</th>
                </tr>
              </thead>
              <tbody>
                {[...snaps].reverse().map((s) => (
                  <tr key={s.id} className="border-t border-line">
                    <td className="num px-4 py-2 text-muted">{s.date}</td>
                    <td className="num px-4 py-2 text-right">{formatMoney(s.balance)}</td>
                    <td className="num px-4 py-2 text-right">{formatMoney(s.equity)}</td>
                    <td className="px-4 py-2 text-right">
                      <Pnl value={s.day_pnl} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <Section id="account-trades" title="Trades">
        {trades.length ? <TradeTable trades={trades.slice(0, 50)} accountLabel={label} /> : <EmptyState title="No public trades on this account" body="Trades will show here when they are logged." />}
        {trades.length > 50 && (
          <p className="mt-3 text-sm">
            <Link href={`/journal?account=${a.id}`} className="text-accent hover:underline">
              See all {trades.length} trades in the journal →
            </Link>
          </p>
        )}
        <RiskNote className="mt-4" />
      </Section>
    </>
  );
}
