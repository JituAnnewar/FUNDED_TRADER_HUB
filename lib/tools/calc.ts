/** Trading calculators. Pure functions; all percentages are plain numbers (2 = 2%). */

export function positionSize(p: { balance: number; riskPct: number; stop: number; valuePerUnit: number }): { risk: number; units: number } {
  const risk = (p.balance * p.riskPct) / 100;
  const units = p.stop > 0 && p.valuePerUnit > 0 ? risk / (p.stop * p.valuePerUnit) : 0;
  return { risk, units };
}

/** Minimum win rate (%) to break even at a given reward-to-risk ratio. */
export function breakevenWinRate(rr: number): number {
  return rr > 0 ? (1 / (1 + rr)) * 100 : 100;
}

/** Expectancy in R per trade. */
export function expectancyR(winRatePct: number, rr: number): number {
  const w = winRatePct / 100;
  return w * rr - (1 - w);
}

/** Gain (%) needed to recover from a loss (%). */
export function recoveryPct(lossPct: number): number {
  if (lossPct >= 100) return Infinity;
  return (lossPct / (100 - lossPct)) * 100;
}

export interface ChallengePlan {
  daysToTarget: number;
  /** Days needed with compounding. */
  daysCompounded: number;
  /** true if the planned daily return is above half the daily loss limit (aggressive). */
  aggressive: boolean;
  meetsMinDays: boolean;
}

export function challengePlan(p: { targetPct: number; dailyReturnPct: number; dailyLossPct: number; minDays: number }): ChallengePlan | null {
  if (p.dailyReturnPct <= 0 || p.targetPct <= 0) return null;
  const daysToTarget = Math.ceil(p.targetPct / p.dailyReturnPct);
  const daysCompounded = Math.ceil(Math.log(1 + p.targetPct / 100) / Math.log(1 + p.dailyReturnPct / 100));
  return {
    daysToTarget,
    daysCompounded,
    aggressive: p.dailyLossPct > 0 && p.dailyReturnPct > p.dailyLossPct / 2,
    meetsMinDays: daysToTarget >= p.minDays,
  };
}
