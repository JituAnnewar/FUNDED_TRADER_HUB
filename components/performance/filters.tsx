"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { useState, useTransition } from "react";
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
  const activeCount = filters.filter((f) => params.get(f.key)).length;
  const [open, setOpen] = useState(activeCount > 0);

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
      <div className="flex flex-wrap items-center gap-2">
        {showRange && (
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div
              className="border-line inline-flex gap-1 rounded-xl border bg-white/[0.02] p-1"
              role="group"
              aria-label="Date range"
            >
              {RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={range === r}
                  onClick={() =>
                    set({ range: r === "all" ? null : r, ...(r !== "custom" ? { from: null, to: null } : {}) })
                  }
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs whitespace-nowrap transition-colors",
                    range === r
                      ? "bg-[image:var(--grad-button)] text-white shadow-[0_6px_18px_-8px_rgb(124_92_255/0.9)]"
                      : "text-muted hover:text-fg",
                  )}
                >
                  {RANGE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
        )}
        {filters.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm transition-colors",
              open || activeCount
                ? "border-violet-soft/40 bg-violet/10 text-fg"
                : "border-line text-muted hover:text-fg bg-white/[0.02]",
            )}
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filters
            {activeCount > 0 && (
              <span className="num bg-violet grid size-5 place-items-center rounded-full text-[11px] text-white">
                {activeCount}
              </span>
            )}
          </button>
        )}
        {[...params.keys()].some((k) => k !== "range" && k !== "page") && (
          <button
            type="button"
            onClick={() => router.replace(pathname, { scroll: false })}
            className="text-accent inline-flex h-9 items-center gap-1 rounded-xl px-3 text-sm hover:bg-white/5"
          >
            <X className="size-3.5" aria-hidden="true" /> Clear
          </button>
        )}
      </div>
      {showRange && range === "custom" && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-muted">From</span>
            <input
              type="date"
              defaultValue={params.get("from") ?? ""}
              onChange={(e) => set({ from: e.target.value })}
              className={selectCls}
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-muted">To</span>
            <input
              type="date"
              defaultValue={params.get("to") ?? ""}
              onChange={(e) => set({ to: e.target.value })}
              className={selectCls}
            />
          </label>
        </div>
      )}
      {open && filters.length > 0 && (
        <div className="glass flex animate-[rise_0.3s_ease-out] flex-wrap gap-2 !rounded-xl p-3">
          {filters.map((f) => (
            <label key={f.key} className="flex items-center gap-2">
              <span className="sr-only">{f.label}</span>
              <select
                value={params.get(f.key) ?? ""}
                onChange={(e) => set({ [f.key]: e.target.value })}
                className={selectCls}
              >
                <option value="">All {f.label.toLowerCase()}</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
