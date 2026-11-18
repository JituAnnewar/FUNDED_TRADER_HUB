"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";

/*
 * One shared IntersectionObserver for every <Reveal>. Its first callback reports all elements at once
 * (after layout, no forced reflow): anything already on screen stays visible, the rest is hidden and
 * revealed when it scrolls in. Reading getBoundingClientRect per element instead caused one full
 * layout per element on load.
 */
let observer: IntersectionObserver | null = null;
const seen = new WeakSet<Element>();
function revealObserver(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        if (!seen.has(el)) {
          seen.add(el);
          if (e.isIntersecting) {
            observer?.unobserve(el);
            continue;
          }
          el.dataset.reveal = "hidden";
          continue;
        }
        if (e.isIntersecting) {
          el.dataset.reveal = "shown";
          observer?.unobserve(el);
        }
      }
    },
    { rootMargin: "0px 0px -60px 0px" },
  );
  return observer;
}

/**
 * Fade/slide in when scrolled into view. CSS transition + IntersectionObserver (no animation library),
 * so it costs almost nothing on first load. Content is visible without JS and under reduced motion.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = revealObserver();
    io.observe(el);
    return () => io.unobserve(el);
  }, []);
  const Comp = as;
  return (
    <Comp
      ref={ref as React.Ref<never>}
      className={cn("reveal", className)}
      style={{ ["--reveal-delay" as string]: `${delay}s` }}
    >
      {children}
    </Comp>
  );
}

type CountFormat = "money" | "moneyCompact" | "int" | "pct" | "decimal";

function fmt(v: number, format: CountFormat): string {
  switch (format) {
    case "money":
      return formatMoney(v, { decimals: 0 });
    case "moneyCompact":
      return formatMoney(v, { compact: true });
    case "pct":
      return formatPct(v, 1, false);
    case "decimal":
      return v.toFixed(2);
    case "int":
    default:
      return Math.round(v).toLocaleString("en-US");
  }
}

/** Counts up from 0 the first time it scrolls into view. The final value is server-rendered. */
export function CountUp({
  value,
  format = "int",
  className,
}: {
  value: number;
  format?: CountFormat;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [text, setText] = useState(() => fmt(value, format));

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const dur = 1600;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 4);
        setText(fmt(value * eased, format));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, format]);

  return (
    <span ref={ref} className={cn("num", className)}>
      {text}
    </span>
  );
}
