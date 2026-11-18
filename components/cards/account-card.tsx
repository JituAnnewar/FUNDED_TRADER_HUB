import Link from "next/link";
import { TiltCard } from "@/components/motion/tilt-card";
import { GlassPanel } from "@/components/ui/glass-panel";
import { BreachMeter, PhaseBadge, RadialGauge } from "@/components/ui/misc";
import { Money, Pct, Pnl } from "@/components/ui/pnl";
import type { AccountView } from "@/lib/analytics/portfolio";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export function FirmMark({ name, logo, className }: { name: string; logo?: string | null; className?: string }) {
  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element -- remote logos from Supabase storage
    return <img src={logo} alt="" className={cn("size-9 rounded-lg border border-line bg-white/5 object-contain p-1", className)} loading="lazy" />;
  }
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className={cn("grid size-9 place-items-center rounded-lg border border-line bg-gradient-to-br from-elevated to-surface text-xs font-semibold text-accent", className)} aria-hidden="true">
      {initials}
    </span>
  );
}

export function AccountCard({ view }: { view: AccountView }) {
  const { account: a, firm, target, daily, max } = view;
  return (
    <TiltCard max={5}>
      <Link href={`/accounts/${a.id}`} className="block h-full rounded-2xl">
        <GlassPanel className="flex h-full flex-col gap-4 p-5 transition-colors hover:bg-white/[0.02]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <FirmMark name={firm?.name ?? "Firm"} logo={firm?.logo_url} />
              <div>
                <p className="text-sm font-medium">{firm?.name ?? "Unknown firm"}</p>
                <p className="num text-xs text-muted">
                  {formatMoney(a.account_size, { compact: true })} · {a.label}
                  {a.masked_account_id ? ` · ••${a.masked_account_id}` : ""}
                </p>
              </div>
            </div>
            <PhaseBadge phase={a.phase} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-[11px] text-muted">Balance</dt>
                <dd>
                  <Money value={a.current_balance} />
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted">Equity</dt>
                <dd>
                  <Money value={a.current_equity} />
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted">Today</dt>
                <dd>
                  <Pnl value={view.todayPnl} />
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted">Total return</dt>
                <dd>
                  <Pct value={view.returnPct} />
                </dd>
              </div>
            </dl>
            {target && (
              <RadialGauge pct={target.pct} label="Profit target progress" color="var(--c-profit)">
                <span className="num text-sm font-semibold">{Math.min(999, target.pct).toFixed(0)}%</span>
                <span className="text-[9px] tracking-wider text-muted uppercase">target</span>
              </RadialGauge>
            )}
          </div>

          {(daily || max) && (
            <div className="space-y-3">
              {daily && (
                <BreachMeter
                  label="Daily loss"
                  usedPct={daily.usedPct}
                  level={daily.level}
                  detail={
                    <>
                      <span className="num">{formatMoney(daily.distance)}</span> left of <span className="num">{formatMoney(daily.limit)}</span>
                    </>
                  }
                />
              )}
              {max && (
                <BreachMeter
                  label="Max loss"
                  usedPct={max.usedPct}
                  level={max.level}
                  detail={
                    <>
                      <span className="num">{formatMoney(max.distance)}</span> above the breach level
                    </>
                  }
                />
              )}
            </div>
          )}

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[11px] text-muted">
            <span>
              Trading days{" "}
              <span className="num text-fg">
                {view.tradingDaysDone}
                {view.tradingDaysRequired ? ` / ${view.tradingDaysRequired}` : ""}
              </span>
            </span>
            {view.consistency.ok !== null && (
              <span className={view.consistency.ok ? "text-profit" : "text-amber"}>
                Consistency {view.consistency.ok ? "OK" : "over limit"} ({view.consistency.score?.toFixed(0)}% / {view.consistency.limit}%)
              </span>
            )}
          </div>
        </GlassPanel>
      </Link>
    </TiltCard>
  );
}
