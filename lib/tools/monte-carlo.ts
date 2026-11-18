/**
 * Monte Carlo prop-challenge simulator. Balance is tracked in % of the starting balance (start = 100).
 * Each trade risks a fixed % of the starting balance; a win pays riskPct × avgR, a loss costs riskPct.
 */
import type { DrawdownType } from "../types";

export interface McInput {
  winRatePct: number;
  avgR: number;
  riskPct: number;
  targetPct: number;
  dailyLossPct: number;
  maxLossPct: number;
  drawdownType: DrawdownType;
  tradesPerDay: number;
  maxDays: number;
  sims: number;
  seed?: number;
}

export type McOutcome = "pass" | "breach_daily" | "breach_max" | "timeout";

export interface McResult {
  passPct: number;
  breachDailyPct: number;
  breachMaxPct: number;
  timeoutPct: number;
  /** Median days to pass, among passing runs. */
  medianDaysToPass: number | null;
  /** Histogram of final balance change (%) */
  distribution: { from: number; to: number; count: number }[];
  /** A few sample equity paths (balance after each trade). */
  samples: { outcome: McOutcome; path: number[] }[];
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function simulateChallenge(input: McInput): McResult {
  const rand = mulberry32(input.seed ?? 12345);
  const sims = Math.max(1, Math.min(20_000, Math.floor(input.sims)));
  const p = input.winRatePct / 100;
  const counts: Record<McOutcome, number> = { pass: 0, breach_daily: 0, breach_max: 0, timeout: 0 };
  const finals: number[] = [];
  const passDays: number[] = [];
  const samples: McResult["samples"] = [];

  for (let s = 0; s < sims; s++) {
    let bal = 100;
    let hwm = 100;
    let eodHigh = 100;
    let outcome: McOutcome = "timeout";
    const keepPath = samples.length < 8;
    const path: number[] = keepPath ? [100] : [];
    let day = 0;
    outer: for (day = 1; day <= input.maxDays; day++) {
      const dayStart = bal;
      for (let k = 0; k < input.tradesPerDay; k++) {
        bal += rand() < p ? input.riskPct * input.avgR : -input.riskPct;
        hwm = Math.max(hwm, bal);
        if (keepPath) path.push(bal);
        if (input.dailyLossPct > 0 && dayStart - bal >= input.dailyLossPct) {
          outcome = "breach_daily";
          break outer;
        }
        const floor =
          input.drawdownType === "static"
            ? 100 - input.maxLossPct
            : input.drawdownType === "trailing_intraday"
              ? Math.min(hwm - input.maxLossPct, 100)
              : Math.min(eodHigh - input.maxLossPct, 100);
        if (bal <= floor) {
          outcome = "breach_max";
          break outer;
        }
        if (bal >= 100 + input.targetPct) {
          outcome = "pass";
          break outer;
        }
      }
      eodHigh = Math.max(eodHigh, bal);
    }
    counts[outcome]++;
    if (outcome === "pass") passDays.push(day);
    finals.push(bal - 100);
    if (keepPath) samples.push({ outcome, path });
  }

  // Distribution of final change, 20 buckets between min and max.
  const lo = Math.floor(Math.min(...finals));
  const hi = Math.ceil(Math.max(...finals));
  const width = Math.max(0.5, (hi - lo) / 20);
  const distribution = Array.from({ length: 20 }, (_, i) => ({ from: lo + i * width, to: lo + (i + 1) * width, count: 0 }));
  for (const f of finals) {
    const idx = Math.min(19, Math.max(0, Math.floor((f - lo) / width)));
    distribution[idx]!.count++;
  }
  passDays.sort((a, b) => a - b);

  return {
    passPct: (counts.pass / sims) * 100,
    breachDailyPct: (counts.breach_daily / sims) * 100,
    breachMaxPct: (counts.breach_max / sims) * 100,
    timeoutPct: (counts.timeout / sims) * 100,
    medianDaysToPass: passDays.length ? passDays[Math.floor(passDays.length / 2)]! : null,
    distribution,
    samples,
  };
}
