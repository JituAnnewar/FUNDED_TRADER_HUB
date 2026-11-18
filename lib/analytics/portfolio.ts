/** Derives per-account views and portfolio totals from raw rows. Pure. */
import { ACTIVE_PHASES, type Account, type AccountPhase, type Firm, type Payout, type RuleSet, type Snapshot } from "../types";
import { dayKey } from "./dates";
import {
  consistencyStatus,
  dailyBreach,
  effectiveRules,
  maxBreach,
  targetPctFor,
  targetProgress,
  totalReturnPct,
  type BreachDistance,
  type ConsistencyStatus,
  type TargetProgress,
} from "./rules";
import { consistencyScore, dailyPnl, summarize, tradingDays, type Summary, type TradeLike } from "./trades";

export interface AccountView {
  account: Account;
  firm: Firm | null;
  rules: RuleSet | null;
  todayPnl: number;
  returnPct: number;
  target: TargetProgress | null;
  daily: BreachDistance | null;
  max: BreachDistance | null;
  tradingDaysDone: number;
  tradingDaysRequired: number | null;
  consistency: ConsistencyStatus;
  summary: Summary;
  isActive: boolean;
}

export interface PortfolioTotals {
  totalPayouts: number;
  payoutCount: number;
  fundedCapital: number;
  fundedAccounts: number;
  activeAccounts: number;
  capitalByPhase: { phase: AccountPhase; capital: number; count: number }[];
  todayPnl: number;
}

export interface PortfolioInput {
  firms: readonly Firm[];
  accounts: readonly Account[];
  snapshots: readonly Snapshot[];
  trades: readonly (TradeLike & { account_id: string })[];
  payouts: readonly Payout[];
}

const FUNDED: AccountPhase[] = ["funded", "payout_pending"];

export function buildPortfolio(input: PortfolioInput, now: Date): { views: AccountView[]; totals: PortfolioTotals; today: string } {
  const today = dayKey(now);
  const firmById = new Map(input.firms.map((f) => [f.id, f]));
  const snapsBy = groupBy(input.snapshots, (s) => s.account_id);
  const tradesBy = groupBy(input.trades, (t) => t.account_id);

  const views = input.accounts.map((account): AccountView => {
    const firm = firmById.get(account.firm_id) ?? null;
    const rules = firm ? effectiveRules(account, firm) : null;
    const snaps = snapsBy.get(account.id) ?? [];
    const trades = tradesBy.get(account.id) ?? [];
    const todaySnap = snaps.find((s) => s.date === today);
    const todayFromTrades = trades.filter((t) => dayKey(t.closed_at ?? t.opened_at) === today).reduce((s, t) => s + t.net_pnl, 0);
    const todayPnl = todaySnap ? todaySnap.day_pnl : Math.round(todayFromTrades * 100) / 100;
    const isActive = ACTIVE_PHASES.includes(account.phase);
    const days = dailyPnl(trades);
    return {
      account,
      firm,
      rules,
      todayPnl,
      returnPct: totalReturnPct(account.starting_balance, account.current_balance),
      target: rules ? targetProgress(account.starting_balance, account.current_balance, targetPctFor(account.phase, rules)) : null,
      daily: rules && isActive ? dailyBreach(account.starting_balance, rules.max_daily_loss_pct, todayPnl) : null,
      max:
        rules && isActive
          ? maxBreach({
              startingBalance: account.starting_balance,
              equity: account.current_equity,
              highWaterMark: account.high_water_mark,
              drawdownType: rules.drawdown_type,
              maxPct: rules.max_total_loss_pct,
              snapshots: snaps,
            })
          : null,
      tradingDaysDone: Math.max(tradingDays(trades), snaps.filter((s) => s.day_pnl !== 0).length),
      tradingDaysRequired: rules?.min_trading_days ?? null,
      consistency: consistencyStatus(consistencyScore(days), rules?.consistency_rule_pct ?? null),
      summary: summarize(trades),
      isActive,
    };
  });

  const phaseMap = new Map<AccountPhase, { capital: number; count: number }>();
  for (const v of views) {
    if (!v.isActive) continue;
    const cur = phaseMap.get(v.account.phase) ?? { capital: 0, count: 0 };
    cur.capital += v.account.account_size;
    cur.count++;
    phaseMap.set(v.account.phase, cur);
  }

  const totals: PortfolioTotals = {
    totalPayouts: round2(input.payouts.reduce((s, p) => s + p.amount, 0)),
    payoutCount: input.payouts.length,
    fundedCapital: views.filter((v) => FUNDED.includes(v.account.phase)).reduce((s, v) => s + v.account.account_size, 0),
    fundedAccounts: views.filter((v) => FUNDED.includes(v.account.phase)).length,
    activeAccounts: views.filter((v) => v.isActive).length,
    capitalByPhase: ACTIVE_PHASES.filter((p) => phaseMap.has(p)).map((phase) => ({ phase, ...phaseMap.get(phase)! })),
    todayPnl: round2(views.filter((v) => v.isActive).reduce((s, v) => s + v.todayPnl, 0)),
  };

  return { views, totals, today };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function groupBy<T, K>(rows: readonly T[], key: (r: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const r of rows) {
    const k = key(r);
    const list = m.get(k);
    if (list) list.push(r);
    else m.set(k, [r]);
  }
  return m;
}
