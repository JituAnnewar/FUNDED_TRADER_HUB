import { Inbox } from "lucide-react";
import Link from "next/link";
import { GlassPanel } from "@/components/ui/glass-panel";
import type { RiskLevel } from "@/lib/analytics/rules";
import { PHASE_LABELS, type AccountPhase } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  children,
  sub,
  className,
  big = false,
}: {
  label: string;
  children: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
  /** Headline number: larger type and more padding. */
  big?: boolean;
}) {
  return (
    <GlassPanel
      className={cn("spotlight flex flex-col gap-1.5", big ? "p-5 sm:p-6" : "p-4 sm:p-5", className)}
      data-spotlight
    >
      <span className="text-muted text-[11px] font-medium tracking-[0.18em] uppercase">{label}</span>
      <span
        className={cn(
          "font-semibold whitespace-nowrap",
          big ? "text-2xl lg:text-[1.75rem] xl:text-3xl" : "text-xl sm:text-2xl",
        )}
      >
        {children}
      </span>
      {sub && <span className="text-muted text-xs">{sub}</span>}
    </GlassPanel>
  );
}

const PHASE_STYLE: Record<AccountPhase, string> = {
  challenge_phase_1: "border-violet-soft/30 bg-violet/15 text-violet-soft",
  challenge_phase_2: "border-violet-soft/30 bg-violet/15 text-violet-soft",
  funded: "border-profit/30 bg-profit/10 text-profit",
  passed: "border-profit/30 bg-profit/10 text-profit",
  payout_pending: "border-gold/30 bg-gold/10 text-gold",
  breached: "border-loss/30 bg-loss/10 text-loss",
  closed: "border-line-strong bg-white/5 text-muted",
};

export function PhaseBadge({ phase, className }: { phase: AccountPhase; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        PHASE_STYLE[phase],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {PHASE_LABELS[phase]}
    </span>
  );
}

export function Tag({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "loss" | "accent" | "gold";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px]",
        tone === "loss" && "border-loss/25 bg-loss/10 text-loss",
        tone === "accent" && "border-accent/25 bg-accent/10 text-accent",
        tone === "gold" && "border-gold/25 bg-gold/10 text-gold",
        tone === "default" && "border-line text-muted bg-white/[0.03]",
      )}
    >
      {children}
    </span>
  );
}

const LEVEL_BAR: Record<RiskLevel, string> = {
  ok: "bg-profit",
  warning: "bg-amber",
  danger: "bg-loss",
  breached: "bg-loss",
};
const LEVEL_TEXT: Record<RiskLevel, string> = {
  ok: "text-profit",
  warning: "text-amber",
  danger: "text-loss",
  breached: "text-loss",
};
const LEVEL_WORD: Record<RiskLevel, string> = {
  ok: "Safe",
  warning: "Caution",
  danger: "Close to limit",
  breached: "Limit hit",
};

/** Horizontal meter showing how much of a loss limit is used. */
export function BreachMeter({
  label,
  usedPct,
  level,
  detail,
}: {
  label: string;
  usedPct: number;
  level: RiskLevel;
  detail: React.ReactNode;
}) {
  const w = Math.min(100, Math.max(0, usedPct));
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted">{label}</span>
        <span className={cn("num", LEVEL_TEXT[level])}>
          {LEVEL_WORD[level]} · {w.toFixed(0)}% used
        </span>
      </div>
      <div
        className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
        role="meter"
        aria-label={`${label}: ${w.toFixed(0)}% of limit used`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(w)}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-700", LEVEL_BAR[level])}
          style={{ width: `${w}%` }}
        />
        <span className="absolute inset-y-0 left-1/2 w-px bg-white/20" aria-hidden="true" />
        <span className="absolute inset-y-0 left-[80%] w-px bg-white/20" aria-hidden="true" />
      </div>
      <div className="text-muted mt-1 text-[11px]">{detail}</div>
    </div>
  );
}

/** Animated radial gauge (pure SVG + CSS). */
export function RadialGauge({
  pct,
  size = 88,
  stroke = 7,
  color = "var(--c-accent)",
  label,
  children,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  label: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(100, Math.max(0, pct));
  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${p.toFixed(0)}%`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.06)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p / 100)}
          className="gauge-arc"
          style={{ filter: `drop-shadow(0 0 6px ${color})`, ["--c" as string]: c }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <GlassPanel className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="border-line text-muted grid size-11 place-items-center rounded-xl border bg-white/[0.03]">
        <Inbox className="size-5" aria-hidden="true" />
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted max-w-md text-sm leading-relaxed">{body}</p>
      {action && (
        <Link href={action.href} className="text-accent mt-1 text-sm underline-offset-4 hover:underline">
          {action.label}
        </Link>
      )}
    </GlassPanel>
  );
}

export function Section({
  id,
  title,
  eyebrow,
  action,
  children,
  className,
}: {
  id?: string;
  title: string;
  eyebrow?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={cn("mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20", className)}
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          {eyebrow && (
            <p className="text-violet-soft mb-3 text-[11px] font-medium tracking-[0.3em] uppercase">{eyebrow}</p>
          )}
          <h2 id={id ? `${id}-title` : undefined} className="text-3xl font-semibold text-balance sm:text-4xl">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
