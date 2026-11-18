import type { Payout, Trade } from "../types";
import { dayKey } from "./dates";
import { bestWorstDay, dailyPnl, summarize, type DayPnl, type Summary } from "./trades";

export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function isMonthKey(m: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(m);
}

export function monthLabel(m: string): string {
  const [y, mo] = m.split("-").map(Number) as [number, number];
  return `${MONTH_NAMES[mo - 1]} ${y}`;
}

export interface MonthRecap {
  month: string;
  summary: Summary;
  days: DayPnl[];
  best: DayPnl | null;
  worst: DayPnl | null;
  bestTrade: Trade | null;
  payouts: Payout[];
  payoutTotal: number;
}

export function monthRecap(month: string, trades: readonly Trade[], payouts: readonly Payout[]): MonthRecap {
  const list = trades.filter((t) => dayKey(t.closed_at ?? t.opened_at).startsWith(month));
  const days = dailyPnl(list);
  const { best, worst } = bestWorstDay(days);
  const bestTrade = list.reduce<Trade | null>((b, t) => (!b || t.net_pnl > b.net_pnl ? t : b), null);
  const monthPayouts = payouts.filter((p) => p.paid_on.startsWith(month));
  return { month, summary: summarize(list), days, best, worst, bestTrade, payouts: monthPayouts, payoutTotal: monthPayouts.reduce((s, p) => s + p.amount, 0) };
}

/** Months (newest first) that have at least one trade or payout. */
export function activeMonths(trades: readonly Trade[], payouts: readonly Payout[]): string[] {
  const set = new Set<string>();
  for (const t of trades) set.add(dayKey(t.closed_at ?? t.opened_at).slice(0, 7));
  for (const p of payouts) set.add(p.paid_on.slice(0, 7));
  return [...set].sort().reverse();
}
