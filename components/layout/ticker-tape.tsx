import { formatMoney, formatPnl } from "@/lib/format";
import type { Firm, Payout, Trade } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Item {
  key: string;
  at: string;
  node: React.ReactNode;
}

/** Infinite marquee of recent public trades and payouts. Hidden when there is nothing to show. */
export function TickerTape({ trades, payouts, firms }: { trades: Trade[]; payouts: Payout[]; firms: Firm[] }) {
  const firmName = new Map(firms.map((f) => [f.id, f.name]));
  const items: Item[] = [
    ...trades.slice(0, 14).map((t) => ({
      key: `t${t.id}`,
      at: t.closed_at ?? t.opened_at,
      node: (
        <>
          <span className="text-fg">{t.symbol}</span>{" "}
          <span className={cn(t.net_pnl > 0 ? "text-profit" : t.net_pnl < 0 ? "text-loss" : "text-muted")}>{formatPnl(t.net_pnl)}</span>
        </>
      ),
    })),
    ...payouts.slice(0, 6).map((p) => ({
      key: `p${p.id}`,
      at: p.paid_on,
      node: (
        <>
          <span className="text-muted">Payout</span> <span className="text-gold">{formatMoney(p.amount)}</span>{" "}
          <span className="text-muted">{firmName.get(p.firm_id) ?? ""}</span>
        </>
      ),
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  if (items.length < 3) return null;
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((it) => (
        <li key={it.key} className="num flex items-center gap-2 px-5 text-xs whitespace-nowrap">
          <span className="size-1 rounded-full bg-accent/60" aria-hidden="true" />
          {it.node}
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className="group relative flex h-9 items-center overflow-hidden border-b border-line bg-surface/60 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]"
      role="region"
      aria-label="Recent trades and payouts"
    >
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none" style={{ ["--marquee-duration" as string]: `${items.length * 4}s` }}>
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
