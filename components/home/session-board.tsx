"use client";

import { useNow } from "@/lib/hooks/use-now";
import { isFxMarketOpen, isMarketOpen, MARKETS } from "@/lib/sessions";
import { formatTimeIST } from "@/lib/time";
import { cn } from "@/lib/utils";

const fmt = new Map<string, Intl.DateTimeFormat>();
function localTime(date: Date, timeZone: string): string {
  let f = fmt.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    fmt.set(timeZone, f);
  }
  return f.format(date);
}

/** Live strip of the four FX sessions under the hero, matching the lit-up cities on the globe. */
export function SessionBoard({ className }: { className?: string }) {
  const now = useNow();
  const date = now === null ? null : new Date(now);
  const weekend = date !== null && !isFxMarketOpen(date);

  return (
    <div className={cn("w-full", className)}>
      <div className="text-muted mb-2 flex items-center justify-between text-[11px] tracking-[0.2em] uppercase">
        <span>Market sessions</span>
        <span className="num tracking-normal normal-case">{date ? `${formatTimeIST(date)} IST` : " "}</span>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="list">
        {MARKETS.map((m) => {
          const open = date !== null && isMarketOpen(date, m);
          return (
            <li
              key={m.id}
              className={cn(
                "glass flex items-center justify-between gap-2 !rounded-xl px-3 py-2.5 transition-colors",
                open && "bg-accent/[0.06]",
              )}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{m.label}</span>
                <span className="num text-muted block text-[11px]">{date ? localTime(date, m.timeZone) : "--:--"}</span>
              </span>
              <span
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase",
                  open ? "bg-accent/15 text-accent" : "text-muted bg-white/[0.04]",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    open ? "animate-pulse-dot bg-accent text-accent" : "bg-white/25",
                  )}
                  aria-hidden="true"
                />
                {date === null ? "…" : open ? "Open" : weekend ? "Weekend" : "Closed"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
