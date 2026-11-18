"use client";

import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { formatMoney, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Fade/slide in when scrolled into view. Instant under reduced motion. */
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
  const reduce = useReducedMotion();
  const Comp = as === "li" ? motion.li : as === "section" ? motion.section : motion.div;
  return (
    <Comp
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.2, 0.8, 0.2, 1] }}
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

/** Counts up from 0 when in view. The final value is server-rendered for SEO and no-JS. */
export function CountUp({ value, format = "int", className }: { value: number; format?: CountFormat; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => fmt(v, format));

  useEffect(() => {
    if (!inView || reduce) return;
    mv.set(0);
    const controls = animate(mv, value, { duration: 1.6, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, reduce, value, mv]);

  return (
    <motion.span ref={ref} className={cn("num", className)}>
      {text}
    </motion.span>
  );
}
