import { describe, expect, it } from "vitest";
import { breakevenWinRate, challengePlan, expectancyR, positionSize, recoveryPct } from "@/lib/tools/calc";
import { simulateChallenge } from "@/lib/tools/monte-carlo";

describe("calculators", () => {
  it("position size", () => {
    const r = positionSize({ balance: 100_000, riskPct: 0.5, stop: 20, valuePerUnit: 10 });
    expect(r.risk).toBe(500);
    expect(r.units).toBe(2.5);
  });
  it("break-even win rate", () => {
    expect(breakevenWinRate(1)).toBe(50);
    expect(breakevenWinRate(2)).toBeCloseTo(33.33, 1);
  });
  it("expectancy in R", () => expect(expectancyR(50, 2)).toBeCloseTo(0.5));
  it("recovery", () => {
    expect(recoveryPct(50)).toBe(100);
    expect(recoveryPct(10)).toBeCloseTo(11.11, 1);
    expect(recoveryPct(100)).toBe(Infinity);
  });
  it("challenge plan", () => {
    const p = challengePlan({ targetPct: 8, dailyReturnPct: 1, dailyLossPct: 5, minDays: 4 })!;
    expect(p.daysToTarget).toBe(8);
    expect(p.daysCompounded).toBe(8);
    expect(p.aggressive).toBe(false);
    expect(p.meetsMinDays).toBe(true);
    expect(challengePlan({ targetPct: 8, dailyReturnPct: 0, dailyLossPct: 5, minDays: 4 })).toBeNull();
  });
});

describe("Monte Carlo", () => {
  const base = { winRatePct: 50, avgR: 2, riskPct: 1, targetPct: 8, dailyLossPct: 5, maxLossPct: 10, drawdownType: "static" as const, tradesPerDay: 2, maxDays: 60, sims: 2000, seed: 7 };
  it("outcome shares sum to 100%", () => {
    const r = simulateChallenge(base);
    expect(r.passPct + r.breachDailyPct + r.breachMaxPct + r.timeoutPct).toBeCloseTo(100);
    expect(r.distribution.reduce((s, b) => s + b.count, 0)).toBe(2000);
    expect(r.samples.length).toBeGreaterThan(0);
  });
  it("a positive edge passes more often than a negative one", () => {
    const good = simulateChallenge(base);
    const bad = simulateChallenge({ ...base, winRatePct: 25, avgR: 1 });
    expect(good.passPct).toBeGreaterThan(70);
    expect(bad.passPct).toBeLessThan(10);
  });
  it("is deterministic for a seed", () => {
    expect(simulateChallenge(base).passPct).toBe(simulateChallenge(base).passPct);
  });
  it("trailing drawdown breaches at least as often as static", () => {
    const s = simulateChallenge(base);
    const t = simulateChallenge({ ...base, drawdownType: "trailing_intraday" });
    expect(t.breachMaxPct).toBeGreaterThanOrEqual(s.breachMaxPct);
  });
});
