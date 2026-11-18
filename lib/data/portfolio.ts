import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { buildPortfolio } from "@/lib/analytics/portfolio";
import { goalProgress } from "@/lib/analytics/goals";
import { getAccounts, getFirms, getGoals, getPayouts, getSnapshots, getTrades } from "./public";
import { TAGS } from "./tags";

/** Portfolio views computed once per cache window ("today" is evaluated here). */
export async function getPortfolio() {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.accounts, TAGS.snapshots, TAGS.trades, TAGS.payouts, TAGS.firms);
  const [firms, accounts, snapshots, trades, payouts] = await Promise.all([
    getFirms(),
    getAccounts(),
    getSnapshots(),
    getTrades(),
    getPayouts(),
  ]);
  const now = new Date();
  return { ...buildPortfolio({ firms, accounts, snapshots, trades, payouts }, now), firms, accounts, snapshots, trades, payouts, generatedAt: now.toISOString() };
}

export async function getGoalProgress() {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.goals, TAGS.trades, TAGS.payouts, TAGS.accounts);
  const [goals, portfolio] = await Promise.all([getGoals(), getPortfolio()]);
  return goalProgress(goals, {
    totalPayouts: portfolio.totals.totalPayouts,
    fundedCapital: portfolio.totals.fundedCapital,
    trades: portfolio.trades,
    now: new Date(),
  });
}
