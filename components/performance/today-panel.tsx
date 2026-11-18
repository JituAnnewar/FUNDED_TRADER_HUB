"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { formatPnl } from "@/lib/format";
import { browserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

export interface TodayRow {
  id: string;
  label: string;
  pnl: number;
}

/** Today's P&L per account. Subscribes to Supabase Realtime and flashes values when they change. */
export function TodayPanel({ rows, total }: { rows: TodayRow[]; total: number }) {
  const router = useRouter();
  const prev = useRef(new Map(rows.map((r) => [r.id, r.pnl])));
  const [flash, setFlash] = useState<Record<string, "up" | "down">>({});
  const [live, setLive] = useState(false);

  useEffect(() => {
    const changed: Record<string, "up" | "down"> = {};
    for (const r of rows) {
      const before = prev.current.get(r.id);
      if (before !== undefined && before !== r.pnl) changed[r.id] = r.pnl > before ? "up" : "down";
    }
    prev.current = new Map(rows.map((r) => [r.id, r.pnl]));
    if (Object.keys(changed).length === 0) return;
    const t1 = setTimeout(() => setFlash(changed), 0);
    const t2 = setTimeout(() => setFlash({}), 1300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [rows]);

  useEffect(() => {
    const sb = browserClient();
    if (!sb) return;
    const channel = sb
      .channel("today-pnl")
      .on("postgres_changes", { event: "*", schema: "public", table: "account_snapshots" }, () => router.refresh())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "accounts" }, () => router.refresh())
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      void sb.removeChannel(channel);
    };
  }, [router]);

  return (
    <GlassPanel className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium tracking-wide text-muted uppercase">Today</h2>
        <span className={cn("flex items-center gap-1.5 text-[11px]", live ? "text-profit" : "text-muted")}>
          <span className={cn("size-1.5 rounded-full", live ? "animate-pulse-dot bg-profit text-profit" : "bg-white/20")} aria-hidden="true" />
          {live ? "Live" : "Updates on refresh"}
        </span>
      </div>
      <p className={cn("num text-3xl font-semibold", total > 0 ? "text-profit glow-profit" : total < 0 ? "text-loss glow-loss" : "text-fg")} aria-live="polite">
        {formatPnl(total)}
      </p>
      {rows.length > 0 ? (
        <ul className="mt-4 divide-y divide-line text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-2">
              <span className="text-muted">{r.label}</span>
              <span
                className={cn(
                  "num px-1",
                  r.pnl > 0 ? "text-profit" : r.pnl < 0 ? "text-loss" : "text-muted",
                  flash[r.id] === "up" && "flash-profit",
                  flash[r.id] === "down" && "flash-loss",
                )}
              >
                {formatPnl(r.pnl)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">No active accounts.</p>
      )}
    </GlassPanel>
  );
}
