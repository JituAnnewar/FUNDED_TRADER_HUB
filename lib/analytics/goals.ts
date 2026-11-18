import type { Goal } from "../types";
import { dayKey } from "./dates";
import type { TradeLike } from "./trades";

export interface GoalProgress {
  goal: Goal;
  current: number;
  pct: number;
}

export function goalProgress(
  goals: readonly Goal[],
  ctx: { totalPayouts: number; fundedCapital: number; trades: readonly TradeLike[]; now: Date },
): GoalProgress[] {
  const month = dayKey(ctx.now).slice(0, 7);
  const monthly = ctx.trades.filter((t) => dayKey(t.closed_at ?? t.opened_at).startsWith(month)).reduce((s, t) => s + t.net_pnl, 0);
  return goals.map((goal) => {
    let current = 0;
    if (goal.current_override !== null) current = goal.current_override;
    else if (goal.metric === "total_payouts") current = ctx.totalPayouts;
    else if (goal.metric === "funded_capital") current = ctx.fundedCapital;
    else if (goal.metric === "monthly_pnl") current = monthly;
    return { goal, current, pct: goal.target_amount > 0 ? Math.max(0, Math.min(100, (current / goal.target_amount) * 100)) : 0 };
  });
}
