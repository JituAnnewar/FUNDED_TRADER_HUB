"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { RANGE_LABELS, type RangePreset } from "@/lib/analytics/dates";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef {
  key: string;
  label: string;
  options: FilterOption[];
}

const RANGES: RangePreset[] = ["today", "week", "month", "quarter", "ytd", "all", "custom"];

const selectCls =
  "h-9 rounded-lg border border-line bg-surface px-2.5 text-sm text-fg outline-none focus-visible:border-accent [&>option]:bg-surface";

/** URL-driven filters (shareable links, server-rendered results). */
export function PerformanceFilters({ filters, showRange = true }: { filters: FilterDef[]; showRange?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const range = (params.get("range") as RangePreset | null) ?? "all";

  const set = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  return (
    <div className={cn("space-y-3 transition-opacity", pending && "opacity-60")} aria-busy={pending}>
      {showRange && (
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="inline-flex gap-1 rounded-xl border border-line bg-white/[0.02] p-1" role="group" aria-label="Date range">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={range === r}
                onClick={() => set({ range: r === "all" ? null : r, ...(r !== "custom" ? { from: null, to: null } : {}) })}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs whitespace-nowrap transition-colors",
                  range === r ? "bg-accent text-bg" : "text-muted hover:text-fg",
                )}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
      )}
      {showRange && range === "custom" && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-muted">From</span>
            <input type="date" defaultValue={params.get("from") ?? ""} onChange={(e) => set({ from: e.target.value })} className={selectCls} />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-muted">To</span>
            <input type="date" defaultValue={params.get("to") ?? ""} onChange={(e) => set({ to: e.target.value })} className={selectCls} />
          </label>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <label key={f.key} className="flex items-center gap-2">
            <span className="sr-only">{f.label}</span>
            <select value={params.get(f.key) ?? ""} onChange={(e) => set({ [f.key]: e.target.value })} className={selectCls}>
              <option value="">All {f.label.toLowerCase()}</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ))}
        {[...params.keys()].some((k) => k !== "range" && k !== "page") && (
          <button type="button" onClick={() => router.replace(pathname, { scroll: false })} className="h-9 rounded-lg px-3 text-sm text-accent hover:bg-white/5">
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
