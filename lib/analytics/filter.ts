import type { Account, Trade } from "../types";
import { dayKey, inRange, rangeBounds, type RangePreset } from "./dates";

export type SearchParams = Record<string, string | string[] | undefined>;

export function param(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v || undefined;
}

const PRESETS: RangePreset[] = ["today", "week", "month", "quarter", "ytd", "all", "custom"];

export interface TradeFilters {
  range: RangePreset;
  from?: string;
  to?: string;
  firm?: string;
  account?: string;
  strategy?: string;
  symbol?: string;
  session?: string;
  direction?: string;
  q?: string;
}

export function parseFilters(sp: SearchParams): TradeFilters {
  const r = param(sp, "range") as RangePreset | undefined;
  return {
    range: r && PRESETS.includes(r) ? r : "all",
    from: param(sp, "from"),
    to: param(sp, "to"),
    firm: param(sp, "firm"),
    account: param(sp, "account"),
    strategy: param(sp, "strategy"),
    symbol: param(sp, "symbol"),
    session: param(sp, "session"),
    direction: param(sp, "direction"),
    q: param(sp, "q"),
  };
}

export function filterTrades(trades: readonly Trade[], f: TradeFilters, accounts: readonly Account[], now: Date): Trade[] {
  const bounds = rangeBounds(f.range, now, { from: f.from, to: f.to });
  const firmAccounts = f.firm ? new Set(accounts.filter((a) => a.firm_id === f.firm).map((a) => a.id)) : null;
  const q = f.q?.trim().toLowerCase();
  return trades.filter((t) => {
    if (!inRange(dayKey(t.closed_at ?? t.opened_at), bounds)) return false;
    if (firmAccounts && !firmAccounts.has(t.account_id)) return false;
    if (f.account && t.account_id !== f.account) return false;
    if (f.strategy && t.strategy_id !== f.strategy) return false;
    if (f.symbol && t.symbol !== f.symbol) return false;
    if (f.session && t.session !== f.session) return false;
    if (f.direction && t.direction !== f.direction) return false;
    if (q) {
      const hay = `${t.symbol} ${t.notes ?? ""} ${t.setup_tags.join(" ")} ${t.mistake_tags.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
