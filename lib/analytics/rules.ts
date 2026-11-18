/**
 * Prop firm rule math: effective rules, distance to breach, target progress.
 *
 * Conventions (recorded in DECISIONS.md):
 * - Daily loss limit = max_daily_loss_pct × starting balance. Today's loss = −min(0, today's P&L).
 * - Max loss floor by drawdown type:
 *   static            → starting balance − limit
 *   trailing_intraday → high-water mark − limit, never above starting balance
 *   trailing_eod      → highest end-of-day balance (snapshots, incl. start) − limit, never above starting balance
 * - Usage % = (limit − distance) ÷ limit. Warning ≥ 50 %, danger ≥ 80 %.
 */
import type { Account, AccountPhase, DrawdownType, Firm, RuleSet, Snapshot } from "../types";

export function effectiveRules(account: Account, firm: Pick<Firm, keyof RuleSet>): RuleSet {
  return {
    drawdown_type: account.drawdown_type ?? firm.drawdown_type,
    max_daily_loss_pct: account.max_daily_loss_pct ?? firm.max_daily_loss_pct,
    max_total_loss_pct: account.max_total_loss_pct ?? firm.max_total_loss_pct,
    profit_target_phase1_pct: account.profit_target_phase1_pct ?? firm.profit_target_phase1_pct,
    profit_target_phase2_pct: account.profit_target_phase2_pct ?? firm.profit_target_phase2_pct,
    min_trading_days: account.min_trading_days ?? firm.min_trading_days,
    consistency_rule_pct: account.consistency_rule_pct ?? firm.consistency_rule_pct,
  };
}

export type RiskLevel = "ok" | "warning" | "danger" | "breached";

export function riskLevel(usedPct: number): RiskLevel {
  if (usedPct >= 100) return "breached";
  if (usedPct >= 80) return "danger";
  if (usedPct >= 50) return "warning";
  return "ok";
}

export interface BreachDistance {
  limit: number;
  /** Money left before breach (can be negative once breached). */
  distance: number;
  /** Distance as % of starting balance. */
  distancePct: number;
  /** Share of the limit already used, 0–100+. */
  usedPct: number;
  level: RiskLevel;
  /** The balance/equity level that would breach. */
  floor?: number;
}

function build(limit: number, distance: number, starting: number, floor?: number): BreachDistance {
  const usedPct = limit > 0 ? Math.max(0, ((limit - distance) / limit) * 100) : 0;
  return {
    limit,
    distance,
    distancePct: starting > 0 ? (distance / starting) * 100 : 0,
    usedPct,
    level: riskLevel(usedPct),
    floor,
  };
}

export function dailyBreach(startingBalance: number, dailyPct: number | null, todayPnl: number): BreachDistance | null {
  if (!dailyPct) return null;
  const limit = (startingBalance * dailyPct) / 100;
  const todayLoss = Math.max(0, -todayPnl);
  return build(limit, limit - todayLoss, startingBalance);
}

export function maxBreach(params: {
  startingBalance: number;
  equity: number;
  highWaterMark: number;
  drawdownType: DrawdownType;
  maxPct: number | null;
  snapshots?: readonly Pick<Snapshot, "balance">[];
}): BreachDistance | null {
  const { startingBalance, equity, highWaterMark, drawdownType, maxPct, snapshots = [] } = params;
  if (!maxPct) return null;
  const limit = (startingBalance * maxPct) / 100;
  let floor: number;
  if (drawdownType === "static") {
    floor = startingBalance - limit;
  } else if (drawdownType === "trailing_intraday") {
    floor = Math.min(Math.max(highWaterMark, startingBalance) - limit, startingBalance);
  } else {
    const highestEod = Math.max(startingBalance, ...snapshots.map((s) => s.balance));
    floor = Math.min(highestEod - limit, startingBalance);
  }
  return build(limit, equity - floor, startingBalance, floor);
}

export function targetPctFor(phase: AccountPhase, rules: RuleSet): number | null {
  if (phase === "challenge_phase_1") return rules.profit_target_phase1_pct;
  if (phase === "challenge_phase_2") return rules.profit_target_phase2_pct;
  return null;
}

export interface TargetProgress {
  targetAmount: number;
  profit: number;
  /** 0–100 (clamped at 0, may exceed 100). */
  pct: number;
}

export function targetProgress(startingBalance: number, balance: number, targetPct: number | null): TargetProgress | null {
  if (!targetPct) return null;
  const targetAmount = (startingBalance * targetPct) / 100;
  const profit = balance - startingBalance;
  return { targetAmount, profit, pct: targetAmount > 0 ? Math.max(0, (profit / targetAmount) * 100) : 0 };
}

export interface ConsistencyStatus {
  score: number | null;
  limit: number | null;
  ok: boolean | null;
}

export function consistencyStatus(score: number | null, limit: number | null): ConsistencyStatus {
  if (limit === null || score === null) return { score, limit, ok: null };
  return { score, limit, ok: score <= limit };
}

export function totalReturnPct(startingBalance: number, balance: number): number {
  return startingBalance > 0 ? ((balance - startingBalance) / startingBalance) * 100 : 0;
}

/** Bucket an account size into a filter label. */
export function sizeBucket(size: number): string {
  const known = [5_000, 10_000, 25_000, 50_000, 100_000, 200_000];
  return known.includes(size) ? `${size / 1000}K` : "Custom";
}
