"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";

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
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.9) return; // already on screen: leave visible
    el.dataset.reveal = "hidden";
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          el.dataset.reveal = "shown";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Comp = as;
  return (
    <Comp ref={ref as React.Ref<never>} className={cn("reveal", className)} style={{ ["--reveal-delay" as string]: `${delay}s` }}>
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
export function CountUp({ value, format = "int", className }: { value: number; format?: CountFormat; className?: string }) {
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
