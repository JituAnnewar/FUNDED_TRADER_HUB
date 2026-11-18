"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatPnl } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface CalendarTrade {
  id: string;
  day: string;
  symbol: string;
  direction: string;
  net_pnl: number;
}
export interface CalendarJournal {
  date: string;
  post_market_review: string | null;
  lessons: string | null;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Month-view P&L heatmap. Clicking a day shows its trades and journal entry. */
export function PnlCalendar({
  days,
  trades,
  journal,
  initialMonth,
}: {
  days: { date: string; pnl: number; trades: number }[];
  trades: CalendarTrade[];
  journal: CalendarJournal[];
  initialMonth: string; // "YYYY-MM"
}) {
  const [month, setMonth] = useState(initialMonth);
  const [selected, setSelected] = useState<string | null>(null);
  const byDay = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const max = useMemo(() => Math.max(1, ...days.map((d) => Math.abs(d.pnl))), [days]);

  const [y, m] = month.split("-").map(Number) as [number, number];
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7;
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`),
  ];
  const monthTotal = cells.reduce((s, c) => s + (c ? (byDay.get(c)?.pnl ?? 0) : 0), 0);

  const shift = (delta: number) => {
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    setMonth(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
    setSelected(null);
  };

  const selTrades = selected ? trades.filter((t) => t.day === selected) : [];
  const selJournal = selected ? journal.find((j) => j.date === selected) : undefined;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">
            {MONTHS[m - 1]} {y}
          </h3>
          <p className="text-muted text-xs">
            Month total{" "}
            <span className={cn("num", monthTotal > 0 ? "text-profit" : monthTotal < 0 ? "text-loss" : "")}>
              {formatPnl(monthTotal)}
            </span>
          </p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => shift(-1)}
            className="border-line grid size-9 place-items-center rounded-lg border hover:bg-white/5"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            className="border-line grid size-9 place-items-center rounded-lg border hover:bg-white/5"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        className="text-muted grid grid-cols-7 gap-1 text-center text-[10px] tracking-wider uppercase sm:gap-1.5"
        aria-hidden="true"
      >
        {DOW.map((d) => (
          <div key={d} className="pb-1">
            {d}
          </div>
        ))}
      </div>
      <div
        className="grid grid-cols-7 gap-1 sm:gap-1.5"
        role="group"
        aria-label={`P&L calendar for ${MONTHS[m - 1]} ${y}`}
      >
        {cells.map((c, i) => {
          if (!c) return <div key={`e${i}`} aria-hidden="true" />;
          const d = byDay.get(c);
          const intensity = d ? 0.15 + (Math.abs(d.pnl) / max) * 0.6 : 0;
          const bg = d
            ? d.pnl >= 0
              ? `rgb(52 211 153 / ${intensity})`
              : `rgb(248 113 113 / ${intensity})`
            : undefined;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setSelected(c === selected ? null : c)}
              aria-pressed={c === selected}
              aria-label={`${c}${d ? `: ${formatPnl(d.pnl)}, ${d.trades} trades` : ": no trades"}`}
              className={cn(
                "flex aspect-square flex-col items-start justify-between rounded-md border p-1 text-left transition-colors sm:aspect-[1.25] sm:p-1.5",
                c === selected ? "border-accent" : "border-line hover:border-line-strong",
                !d && "bg-white/[0.015]",
              )}
              style={bg ? { backgroundColor: bg } : undefined}
            >
              <span className="num text-muted text-[10px]">{Number(c.slice(8))}</span>
              {d && (
                <span className="num text-fg hidden text-[10px] leading-none sm:block">
                  {formatPnl(d.pnl, { compact: true })}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="border-line mt-4 rounded-xl border bg-white/[0.02] p-4" aria-live="polite">
          <h4 className="num mb-2 text-sm font-medium">{selected}</h4>
          {selTrades.length ? (
            <ul className="divide-line divide-y text-sm">
              {selTrades.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/journal/${t.id}`}
                    className="hover:text-accent flex items-center justify-between gap-3 py-2"
                  >
                    <span>
                      {t.symbol} <span className="text-muted">· {t.direction}</span>
                    </span>
                    <span
                      className={cn("num", t.net_pnl > 0 ? "text-profit" : t.net_pnl < 0 ? "text-loss" : "text-muted")}
                    >
                      {formatPnl(t.net_pnl)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted text-sm">No public trades on this day.</p>
          )}
          {selJournal && (
            <div className="border-line mt-3 border-t pt-3 text-sm">
              <p className="text-muted mb-1 text-xs tracking-wider uppercase">Journal</p>
              {selJournal.post_market_review && <p className="text-fg/90">{selJournal.post_market_review}</p>}
              {selJournal.lessons && <p className="text-muted mt-1">Lesson: {selJournal.lessons}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
