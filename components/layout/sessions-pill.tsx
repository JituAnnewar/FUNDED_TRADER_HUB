"use client";

import { useNow } from "@/lib/hooks/use-now";
import { isFxMarketOpen, isMarketOpen, MARKETS } from "@/lib/sessions";
import { formatTimeIST } from "@/lib/time";
import { cn } from "@/lib/utils";

/** Live pill showing which FX sessions are open right now, with the time in IST. */
export function SessionsPill({ className }: { className?: string }) {
  const now = useNow();

  if (now === null) {
    return (
      <div
        className={cn("h-8 w-[178px] rounded-full border border-line bg-white/[0.02]", className)}
        aria-hidden="true"
      />
    );
  }

  const date = new Date(now);
  const fxOpen = isFxMarketOpen(date);
  const states = MARKETS.map((m) => ({ ...m, open: isMarketOpen(date, m) }));
  const openLabels = states.filter((s) => s.open).map((s) => s.label);
  const summary = !fxOpen
    ? "Market closed for the weekend"
    : openLabels.length
      ? `Open now: ${openLabels.join(", ")}`
      : "Between main sessions";

  return (
    <div
      role="status"
      aria-label={`${summary}. ${formatTimeIST(date)} IST.`}
      title={summary}
      className={cn(
        "flex h-8 items-center gap-2.5 rounded-full border border-line bg-white/[0.02] pr-3 pl-2.5 text-[11px]",
        className,
      )}
    >
      <ul className="flex items-center gap-1.5" aria-hidden="true">
        {states.map((s) => (
          <li key={s.id} className="flex items-center gap-1">
            <span
              className={cn(
                "size-1.5 rounded-full",
                s.open ? "animate-pulse-dot bg-profit text-profit" : "bg-white/15",
              )}
            />
            <span className={cn("font-medium tracking-wide", s.open ? "text-fg" : "text-muted/60")}>
              {s.short}
            </span>
          </li>
        ))}
      </ul>
      <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
      <span className="num text-muted" aria-hidden="true">
        {formatTimeIST(date)} <span className="text-muted/60">IST</span>
      </span>
    </div>
  );
}
