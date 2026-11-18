"use client";

import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

/**
 * Accessible tabs (WAI-ARIA tabs pattern: arrow keys, Home/End). Panels are rendered on the server
 * and passed in, so switching tabs costs no data fetching.
 */
export function Tabs({ items, label, className }: { items: TabItem[]; label: string; className?: string }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKey(e: React.KeyboardEvent, i: number) {
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const item = items[next];
    if (!item) return;
    setActive(item.id);
    refs.current[next]?.focus();
  }

  return (
    <div className={className}>
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div
          role="tablist"
          aria-label={label}
          className="border-line inline-flex gap-1 rounded-xl border bg-white/[0.02] p-1"
        >
          {items.map((t, i) => {
            const selected = t.id === active;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                role="tab"
                type="button"
                id={`${base}-tab-${t.id}`}
                aria-selected={selected}
                aria-controls={`${base}-panel-${t.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(t.id)}
                onKeyDown={(e) => onKey(e, i)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
                  selected
                    ? "bg-violet/20 text-fg shadow-[inset_0_0_0_1px_rgb(165_148_255/0.35)]"
                    : "text-muted hover:text-fg",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      {items.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${base}-panel-${t.id}`}
          aria-labelledby={`${base}-tab-${t.id}`}
          hidden={t.id !== active}
          tabIndex={0}
          className="mt-5 animate-[fade-in_0.3s_ease-out] outline-none"
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
