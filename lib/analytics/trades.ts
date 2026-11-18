/**
 * Trade statistics. Pure functions over net P&L (after fees).
 * Definitions follow docs/BRIEF.md §8.
 */
import { dayKey, weekdayHour } from "./dates";

/** The minimal shape analytics needs, so callers can pass full rows or lightweight objects. */
export interface TradeLike {
  id?: string;
  opened_at: string;
  closed_at?: string | null;
  net_pnl: number;
  r_multiple?: number | null;
  symbol?: string;
  session?: string | null;
  direction?: string;
  strategy_id?: string | null;
  account_id?: string;
  mistake_tags?: string[];
}

/** |P&L| below this is a break-even trade. */
export const BREAKEVEN_EPSILON = 0.005;

export type Outcome = "win" | "loss" | "breakeven";

export function outcome(netPnl: number): Outcome {
  if (netPnl > BREAKEVEN_EPSILON) return "win";
  if (netPnl < -BREAKEVEN_EPSILON) return "loss";
  return "breakeven";
}

export interface Summary {
  count: number;
  wins: number;
  losses: number;
  breakeven: number;
  /** wins ÷ closed trades (0–1). null when there are no trades. */
  winRate: number | null;
  grossProfit: number;
  grossLoss: number;
  net: number;
  /** grossProfit ÷ |grossLoss|. Infinity when there are wins but no losses. null when no trades. */
  profitFactor: number | null;
  avgWin: number | null;
  /** Average loss as a positive number. */
  avgLoss: number | null;
  /** Per trade: winRate × avgWin − lossRate × avgLoss. */
  expectancy: number | null;
  /** Mean R over trades with R recorded. */
  avgR: number | null;
  rCount: number;
  largestWin: number | null;
  largestLoss: number | null;
  /** Mean holding time in ms over trades with a close time. */
  avgHoldMs: number | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function summarize(trades: readonly TradeLike[]): Summary {
  let wins = 0;
  let losses = 0;
  let breakeven = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let largestWin: number | null = null;
  let largestLoss: number | null = null;
  let rSum = 0;
  let rCount = 0;
  let holdSum = 0;
  let holdCount = 0;

  for (const t of trades) {
    const o = outcome(t.net_pnl);
    if (o === "win") {
      wins++;
      grossProfit += t.net_pnl;
      largestWin = largestWin === null ? t.net_pnl : Math.max(largestWin, t.net_pnl);
    } else if (o === "loss") {
      losses++;
      grossLoss += t.net_pnl;
      largestLoss = largestLoss === null ? t.net_pnl : Math.min(largestLoss, t.net_pnl);
    } else {
      breakeven++;
    }
    if (t.r_multiple !== null && t.r_multiple !== undefined && Number.isFinite(t.r_multiple)) {
      rSum += t.r_multiple;
      rCount++;
    }
    if (t.closed_at) {
      const ms = new Date(t.closed_at).getTime() - new Date(t.opened_at).getTime();
      if (ms >= 0) {
        holdSum += ms;
        holdCount++;
      }
    }
  }

  const count = trades.length;
  const winRate = count ? wins / count : null;
  const lossRate = count ? losses / count : null;
  const avgWin = wins ? grossProfit / wins : null;
  const avgLoss = losses ? Math.abs(grossLoss) / losses : null;
  const profitFactor = !count ? null : grossLoss === 0 ? (grossProfit > 0 ? Infinity : null) : grossProfit / Math.abs(grossLoss);
  const expectancy =
    winRate === null || lossRate === null ? null : winRate * (avgWin ?? 0) - lossRate * (avgLoss ?? 0);

  return {
    count,
    wins,
    losses,
    breakeven,
    winRate,
    grossProfit: round2(grossProfit),
    grossLoss: round2(grossLoss),
    net: round2(grossProfit + grossLoss),
    profitFactor,
    avgWin,
    avgLoss,
    expectancy,
    avgR: rCount ? rSum / rCount : null,
    rCount,
    largestWin,
    largestLoss,
    avgHoldMs: holdCount ? holdSum / holdCount : null,
  };
}

/** Closing time used for ordering and day bucketing (falls back to open time). */
export function closeTime(t: TradeLike): string {
  return t.closed_at ?? t.opened_at;
}

export function sortByClose<T extends TradeLike>(trades: readonly T[]): T[] {
  return [...trades].sort((a, b) => closeTime(a).localeCompare(closeTime(b)));
}

export interface DayPnl {
  date: string;
  pnl: number;
  trades: number;
}

/** Net P&L per trading day (IST), ascending by date. */
export function dailyPnl(trades: readonly TradeLike[], timeZone?: string): DayPnl[] {
  const map = new Map<string, DayPnl>();
  for (const t of trades) {
    const key = dayKey(closeTime(t), timeZone);
    const cur = map.get(key) ?? { date: key, pnl: 0, trades: 0 };
    cur.pnl = round2(cur.pnl + t.net_pnl);
    cur.trades++;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export interface EquityPoint {
  time: string;
  value: number;
}

/** Cumulative net P&L after each trade, starting from `start`. */
export function equityCurve(trades: readonly TradeLike[], start = 0): EquityPoint[] {
  let v = start;
  return sortByClose(trades).map((t) => {
    v = round2(v + t.net_pnl);
    return { time: closeTime(t), value: v };
  });
}

export interface Drawdown {
  /** Largest peak-to-trough fall, as a positive amount. */
  amount: number;
  /** Fall as % of the peak equity (needs a positive base). null when no base given. */
  pct: number | null;
  peakAt: number;
  troughAt: number;
}

/**
 * Max drawdown of an equity series. `values` are absolute equity values,
 * or cumulative P&L when `base` (the starting balance) is given for the % figure.
 */
export function maxDrawdown(values: readonly number[], base?: number): Drawdown {
  let peak = base ?? (values.length ? values[0]! : 0);
  let peakIdx = -1;
  let best: Drawdown = { amount: 0, pct: base ? 0 : null, peakAt: -1, troughAt: -1 };
  values.forEach((raw, i) => {
    const v = base !== undefined ? base + raw : raw;
    if (v > peak) {
      peak = v;
      peakIdx = i;
    }
    const dd = peak - v;
    if (dd > best.amount) {
      best = {
        amount: round2(dd),
        pct: peak > 0 ? (dd / peak) * 100 : null,
        peakAt: peakIdx,
        troughAt: i,
      };
    }
  });
  return best;
}

export interface Streaks {
  current: { type: "win" | "loss" | null; count: number };
  longestWin: number;
  longestLoss: number;
}

/** Win/loss streaks in close order. Break-evens neither extend nor break a streak. */
export function streaks(trades: readonly TradeLike[]): Streaks {
  let curType: "win" | "loss" | null = null;
  let cur = 0;
  let longestWin = 0;
  let longestLoss = 0;
  for (const t of sortByClose(trades)) {
    const o = outcome(t.net_pnl);
    if (o === "breakeven") continue;
    if (o === curType) cur++;
    else {
      curType = o;
      cur = 1;
    }
    if (o === "win") longestWin = Math.max(longestWin, cur);
    else longestLoss = Math.max(longestLoss, cur);
  }
  return { current: { type: curType, count: cur }, longestWin, longestLoss };
}

export function bestWorstDay(days: readonly DayPnl[]): { best: DayPnl | null; worst: DayPnl | null } {
  if (!days.length) return { best: null, worst: null };
  let best = days[0]!;
  let worst = days[0]!;
  for (const d of days) {
    if (d.pnl > best.pnl) best = d;
    if (d.pnl < worst.pnl) worst = d;
  }
  return { best, worst };
}

/**
 * Consistency score = largest single-day profit ÷ total profit, as a percentage.
 * null when total profit is not positive (rule does not apply).
 */
export function consistencyScore(days: readonly DayPnl[]): number | null {
  const total = days.reduce((s, d) => s + d.pnl, 0);
  if (total <= 0) return null;
  const largest = Math.max(0, ...days.map((d) => d.pnl));
  return (largest / total) * 100;
}

export interface BreakdownRow {
  key: string;
  net: number;
  count: number;
  wins: number;
  winRate: number;
}

/** Group trades by a key and total their net P&L. Sorted by net, descending. */
export function breakdown(trades: readonly TradeLike[], keyOf: (t: TradeLike) => string | null | undefined): BreakdownRow[] {
  const map = new Map<string, BreakdownRow>();
  for (const t of trades) {
    const k = keyOf(t);
    if (k === null || k === undefined || k === "") continue;
    const row = map.get(k) ?? { key: k, net: 0, count: 0, wins: 0, winRate: 0 };
    row.net = round2(row.net + t.net_pnl);
    row.count++;
    if (outcome(t.net_pnl) === "win") row.wins++;
    map.set(k, row);
  }
  return [...map.values()]
    .map((r) => ({ ...r, winRate: r.count ? r.wins / r.count : 0 }))
    .sort((a, b) => b.net - a.net);
}

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function byWeekday(trades: readonly TradeLike[], timeZone?: string): BreakdownRow[] {
  const rows = breakdown(trades, (t) => String(weekdayHour(t.opened_at, timeZone).weekday));
  return rows
    .map((r) => ({ ...r, key: WEEKDAY_LABELS[Number(r.key)] ?? r.key }))
    .sort((a, b) => WEEKDAY_LABELS.indexOf(a.key) - WEEKDAY_LABELS.indexOf(b.key));
}

export function byHour(trades: readonly TradeLike[], timeZone?: string): BreakdownRow[] {
  return breakdown(trades, (t) => String(weekdayHour(t.opened_at, timeZone).hour).padStart(2, "0")).sort((a, b) =>
    a.key.localeCompare(b.key),
  );
}

/** Sum of net P&L of trades carrying each mistake tag (a trade with two tags counts in both). */
export function costOfMistakes(trades: readonly TradeLike[]): BreakdownRow[] {
  const map = new Map<string, BreakdownRow>();
  for (const t of trades) {
    for (const tag of t.mistake_tags ?? []) {
      const row = map.get(tag) ?? { key: tag, net: 0, count: 0, wins: 0, winRate: 0 };
      row.net = round2(row.net + t.net_pnl);
      row.count++;
      if (outcome(t.net_pnl) === "win") row.wins++;
      map.set(tag, row);
    }
  }
  return [...map.values()].map((r) => ({ ...r, winRate: r.count ? r.wins / r.count : 0 })).sort((a, b) => a.net - b.net);
}

/** R-multiple histogram with fixed-width buckets, e.g. [-2,-1), [-1,0), [0,1)... */
export function rHistogram(trades: readonly TradeLike[], width = 0.5, min = -3, max = 5): { label: string; from: number; count: number }[] {
  const buckets: { label: string; from: number; count: number }[] = [];
  for (let f = min; f < max; f += width) {
    buckets.push({ label: `${f.toFixed(1)}R`, from: f, count: 0 });
  }
  for (const t of trades) {
    const r = t.r_multiple;
    if (r === null || r === undefined || !Number.isFinite(r)) continue;
    const clamped = Math.min(max - width / 2, Math.max(min, r));
    const idx = Math.floor((clamped - min) / width);
    const b = buckets[idx];
    if (b) b.count++;
  }
  return buckets;
}

/** Distinct trading days (IST) on which at least one trade closed. */
export function tradingDays(trades: readonly TradeLike[], timeZone?: string): number {
  return new Set(trades.map((t) => dayKey(closeTime(t), timeZone))).size;
}
