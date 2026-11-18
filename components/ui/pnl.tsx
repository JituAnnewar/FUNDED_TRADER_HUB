import { formatMoney, formatPct, formatPnl, formatR, type MoneyOptions } from "@/lib/format";
import { cn } from "@/lib/utils";

function tone(v: number): string {
  if (v > 0) return "text-profit";
  if (v < 0) return "text-loss";
  return "text-muted";
}

/** Signed money with colour + explicit sign. Never colour alone. */
export function Pnl({
  value,
  className,
  glow = false,
  ...opts
}: { value: number; className?: string; glow?: boolean } & MoneyOptions) {
  return (
    <span className={cn("num", tone(value), glow && (value > 0 ? "glow-profit" : value < 0 ? "glow-loss" : ""), className)}>
      {formatPnl(value, opts)}
    </span>
  );
}

export function Money({ value, className, ...opts }: { value: number; className?: string } & MoneyOptions) {
  return <span className={cn("num", className)}>{formatMoney(value, opts)}</span>;
}

export function Pct({ value, className, decimals = 2, signed = true }: { value: number; className?: string; decimals?: number; signed?: boolean }) {
  return <span className={cn("num", signed && tone(value), className)}>{formatPct(value, decimals, signed)}</span>;
}

export function RValue({ value, className }: { value: number | null; className?: string }) {
  if (value === null) return <span className={cn("num text-muted", className)}>—</span>;
  return <span className={cn("num", tone(value), className)}>{formatR(value)}</span>;
}
