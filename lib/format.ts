/**
 * Number formatting. All P&L output carries an explicit sign so colour is never the only cue.
 * Uses the true minus sign (U+2212) for negatives.
 */

export const MINUS = "−";

export type Currency = "USD" | "INR";

export type Sign = "positive" | "negative" | "zero";

export function signOf(value: number): Sign {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "zero";
}

const LOCALE: Record<Currency, string> = { USD: "en-US", INR: "en-IN" };
const SYMBOL: Record<Currency, string> = { USD: "$", INR: "₹" };

function grouped(abs: number, currency: Currency, decimals: number): string {
  return new Intl.NumberFormat(LOCALE[currency], {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(abs);
}

export interface MoneyOptions {
  currency?: Currency;
  /** Fixed number of decimals. Defaults to 0 for |v| ≥ 1000, else 2. */
  decimals?: number;
  /** Shorten to K / M (USD) or L / Cr (INR). */
  compact?: boolean;
}

function compactParts(abs: number, currency: Currency): { n: number; suffix: string } {
  if (currency === "INR") {
    if (abs >= 1e7) return { n: abs / 1e7, suffix: "Cr" };
    if (abs >= 1e5) return { n: abs / 1e5, suffix: "L" };
    if (abs >= 1e3) return { n: abs / 1e3, suffix: "K" };
    return { n: abs, suffix: "" };
  }
  if (abs >= 1e6) return { n: abs / 1e6, suffix: "M" };
  if (abs >= 1e3) return { n: abs / 1e3, suffix: "K" };
  return { n: abs, suffix: "" };
}

function body(abs: number, opts: MoneyOptions): string {
  const currency = opts.currency ?? "USD";
  if (opts.compact) {
    const { n, suffix } = compactParts(abs, currency);
    const d = opts.decimals ?? (suffix && n < 100 ? 1 : 0);
    return `${SYMBOL[currency]}${grouped(n, currency, d)}${suffix}`;
  }
  const d = opts.decimals ?? (abs >= 1000 ? 0 : 2);
  return `${SYMBOL[currency]}${grouped(abs, currency, d)}`;
}

/** Unsigned money for balances, sizes, payouts: "$100,000". Negative balances still get "−". */
export function formatMoney(value: number, opts: MoneyOptions = {}): string {
  const s = body(Math.abs(value), opts);
  return value < 0 ? `${MINUS}${s}` : s;
}

/** Signed money for P&L: "+$1,240", "−$312.50", "$0.00". */
export function formatPnl(value: number, opts: MoneyOptions = {}): string {
  const s = body(Math.abs(value), opts);
  if (value > 0) return `+${s}`;
  if (value < 0) return `${MINUS}${s}`;
  return s;
}

/** Signed percentage: "+4.20%", "−1.05%". Input is a percentage number (4.2 → "+4.20%"). */
export function formatPct(value: number, decimals = 2, signed = true): string {
  const s = `${Math.abs(value).toFixed(decimals)}%`;
  if (!signed) return value < 0 ? `${MINUS}${s}` : s;
  if (value > 0) return `+${s}`;
  if (value < 0) return `${MINUS}${s}`;
  return s;
}

/** Signed R multiple: "+2.4R", "−1.0R". */
export function formatR(value: number, decimals = 1): string {
  const s = `${Math.abs(value).toFixed(decimals)}R`;
  if (value > 0) return `+${s}`;
  if (value < 0) return `${MINUS}${s}`;
  return s;
}

export function convert(valueUsd: number, currency: Currency, usdToInr: number): number {
  return currency === "INR" ? valueUsd * usdToInr : valueUsd;
}
