/** Server-rendered SVG charts. Every chart has an aria label and a data-table fallback. */
import type { BreakdownRow, DayPnl } from "@/lib/analytics/trades";
import { formatPnl } from "@/lib/format";
import { cn } from "@/lib/utils";

function DataTable({ caption, head, rows }: { caption: string; head: [string, string]; rows: [string, string][] }) {
  return (
    <details className="mt-2 text-xs text-muted">
      <summary className="cursor-pointer select-none hover:text-fg">Show data as a table</summary>
      <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-line">
        <table className="w-full text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-surface">
            <tr>
              <th className="px-3 py-1.5 font-medium">{head[0]}</th>
              <th className="px-3 py-1.5 text-right font-medium">{head[1]}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([a, b], i) => (
              <tr key={i} className="border-t border-line">
                <td className="px-3 py-1">{a}</td>
                <td className="num px-3 py-1 text-right">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** Daily P&L bars around a zero line. */
export function DailyBars({ days, label = "Daily P&L", height = 180 }: { days: DayPnl[]; label?: string; height?: number }) {
  const w = 1000;
  const max = Math.max(1, ...days.map((d) => Math.abs(d.pnl)));
  const mid = height / 2;
  const bw = days.length ? w / days.length : w;
  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="h-44 w-full" role="img" aria-label={`${label}, ${days.length} days`}>
        <line x1="0" x2={w} y1={mid} y2={mid} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
        {days.map((d, i) => {
          const h = (Math.abs(d.pnl) / max) * (mid - 6);
          const up = d.pnl >= 0;
          return (
            <rect
              key={d.date}
              x={i * bw + bw * 0.15}
              width={Math.max(1, bw * 0.7)}
              y={up ? mid - h : mid}
              height={Math.max(1, h)}
              rx={Math.min(3, bw * 0.2)}
              fill={up ? "var(--c-profit)" : "var(--c-loss)"}
              opacity={0.85}
            >
              <title>{`${d.date}: ${formatPnl(d.pnl)}`}</title>
            </rect>
          );
        })}
      </svg>
      <DataTable caption={label} head={["Day", "Net P&L"]} rows={days.map((d) => [d.date, formatPnl(d.pnl)])} />
    </figure>
  );
}

/** Horizontal bars for a breakdown (symbol, session, weekday...). */
export function BreakdownBars({ rows, label, keyLabel = "Group", formatKey }: { rows: BreakdownRow[]; label: string; keyLabel?: string; formatKey?: (k: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.net)));
  const name = (k: string) => (formatKey ? formatKey(k) : k);
  if (!rows.length) return <p className="text-sm text-muted">No trades in this range.</p>;
  return (
    <figure aria-label={label}>
      <ul className="space-y-2.5">
        {rows.map((r) => {
          const pct = (Math.abs(r.net) / max) * 100;
          const up = r.net >= 0;
          return (
            <li key={r.key} className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3 text-xs">
              <span className="truncate text-muted" title={name(r.key)}>
                {name(r.key)}
              </span>
              <span className="relative h-2 rounded-full bg-white/[0.04]">
                <span
                  className={cn("absolute inset-y-0 left-0 rounded-full", up ? "bg-profit/80" : "bg-loss/80")}
                  style={{ width: `${Math.max(2, pct)}%` }}
                />
              </span>
              <span className="num flex w-28 justify-end gap-2">
                <span className={up ? "text-profit" : "text-loss"}>{formatPnl(r.net, { compact: Math.abs(r.net) >= 10_000 })}</span>
                <span className="text-muted/70">{r.count}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <DataTable
        caption={label}
        head={[keyLabel, "Net P&L (trades, win rate)"]}
        rows={rows.map((r) => [name(r.key), `${formatPnl(r.net)} (${r.count}, ${(r.winRate * 100).toFixed(0)}%)`])}
      />
    </figure>
  );
}

/** Vertical histogram (R multiples). */
export function Histogram({ buckets, label }: { buckets: { label: string; from: number; count: number }[]; label: string }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const w = 600;
  const h = 160;
  const bw = w / Math.max(1, buckets.length);
  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h + 18}`} className="h-48 w-full" role="img" aria-label={label}>
        {buckets.map((b, i) => {
          const bh = (b.count / max) * (h - 8);
          return (
            <g key={b.label}>
              <rect
                x={i * bw + 2}
                y={h - bh}
                width={bw - 4}
                height={Math.max(b.count ? 2 : 0, bh)}
                rx="2"
                fill={b.from >= 0 ? "var(--c-profit)" : "var(--c-loss)"}
                opacity={0.8}
              >
                <title>{`${b.label}: ${b.count} trades`}</title>
              </rect>
              {i % 2 === 0 && (
                <text x={i * bw + bw / 2} y={h + 14} textAnchor="middle" fontSize="10" fill="#8A96A8" fontFamily="monospace">
                  {b.from.toFixed(0)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <DataTable caption={label} head={["Bucket", "Trades"]} rows={buckets.map((b) => [b.label, String(b.count)])} />
    </figure>
  );
}

/** Small inline sparkline for cards. */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return null;
  const w = 120;
  const h = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / span) * (h - 4) - 2}`).join(" ");
  const up = values[values.length - 1]! >= values[0]!;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-8 w-full", className)} aria-hidden="true" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={up ? "var(--c-profit)" : "var(--c-loss)"} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
