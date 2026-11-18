import { describe, expect, it } from "vitest";
import { rangeBounds } from "@/lib/analytics/dates";
import {
  dailyBreach,
  effectiveRules,
  maxBreach,
  riskLevel,
  targetProgress,
} from "@/lib/analytics/rules";
import {
  bestWorstDay,
  breakdown,
  consistencyScore,
  costOfMistakes,
  dailyPnl,
  equityCurve,
  maxDrawdown,
  rHistogram,
  streaks,
  summarize,
  tradingDays,
  type TradeLike,
} from "@/lib/analytics/trades";
import type { Account, Firm, Payout, Snapshot, Trade } from "@/lib/types";

const t = (iso: string, net: number, extra: Partial<TradeLike> = {}): TradeLike => ({
  opened_at: iso,
  closed_at: iso,
  net_pnl: net,
  ...extra,
});

const SAMPLE: TradeLike[] = [
  t("2026-11-02T08:00:00Z", 200, { r_multiple: 2, symbol: "XAUUSD", mistake_tags: [] }),
  t("2026-11-02T10:00:00Z", -100, { r_multiple: -1, symbol: "EURUSD", mistake_tags: ["fomo"] }),
  t("2026-11-03T08:00:00Z", 300, { r_multiple: 3, symbol: "XAUUSD" }),
  t("2026-11-04T08:00:00Z", 0, { symbol: "GBPUSD" }),
  t("2026-11-05T08:00:00Z", -50, { r_multiple: -0.5, symbol: "EURUSD", mistake_tags: ["fomo", "early exit"] }),
];

describe("summarize", () => {
  const s = summarize(SAMPLE);
  it("counts outcomes with break-evens separate", () => {
    expect(s.count).toBe(5);
    expect(s.wins).toBe(2);
    expect(s.losses).toBe(2);
    expect(s.breakeven).toBe(1);
  });
  it("computes win rate over all closed trades", () => expect(s.winRate).toBeCloseTo(0.4));
  it("computes profit factor", () => expect(s.profitFactor).toBeCloseTo(500 / 150));
  it("computes expectancy = WR×avgWin − LR×avgLoss", () => expect(s.expectancy).toBeCloseTo(0.4 * 250 - 0.4 * 75));
  it("averages R only where present", () => {
    expect(s.rCount).toBe(4);
    expect(s.avgR).toBeCloseTo(0.875);
  });
  it("finds largest win and loss", () => {
    expect(s.largestWin).toBe(300);
    expect(s.largestLoss).toBe(-100);
  });
  it("net equals total", () => expect(s.net).toBe(350));
  it("returns Infinity PF with no losses", () => expect(summarize([t("2026-11-01T00:00:00Z", 10)]).profitFactor).toBe(Infinity));
  it("handles empty input", () => {
    const e = summarize([]);
    expect(e.winRate).toBeNull();
    expect(e.profitFactor).toBeNull();
    expect(e.expectancy).toBeNull();
  });
});

describe("daily, equity, drawdown", () => {
  it("buckets by IST day", () => {
    // 20:00 UTC on Nov 2 is 01:30 IST on Nov 3
    const days = dailyPnl([t("2026-11-02T20:00:00Z", 10), t("2026-11-03T05:00:00Z", 5)]);
    expect(days).toEqual([{ date: "2026-11-03", pnl: 15, trades: 2 }]);
  });
  it("builds a cumulative curve", () => {
    expect(equityCurve(SAMPLE).map((p) => p.value)).toEqual([200, 100, 400, 400, 350]);
  });
  it("measures max drawdown in $ and % from a base", () => {
    const dd = maxDrawdown([200, 100, 400, 400, 350], 10_000);
    expect(dd.amount).toBe(100);
    expect(dd.pct).toBeCloseTo((100 / 10_200) * 100);
  });
  it("measures drawdown on absolute values", () => {
    expect(maxDrawdown([100, 120, 90, 130, 80]).amount).toBe(50);
  });
  it("best and worst day", () => {
    const { best, worst } = bestWorstDay(dailyPnl(SAMPLE));
    expect(best?.pnl).toBe(300);
    expect(worst?.pnl).toBe(-50);
  });
  it("counts trading days", () => expect(tradingDays(SAMPLE)).toBe(4));
});

describe("streaks", () => {
  it("skips break-evens", () => {
    const s = streaks([
      t("2026-11-01T01:00:00Z", 1),
      t("2026-11-01T02:00:00Z", 1),
      t("2026-11-01T03:00:00Z", 0),
      t("2026-11-01T04:00:00Z", 1),
      t("2026-11-01T05:00:00Z", -1),
    ]);
    expect(s.longestWin).toBe(3);
    expect(s.longestLoss).toBe(1);
    expect(s.current).toEqual({ type: "loss", count: 1 });
  });
});

describe("consistency, breakdowns, mistakes, histogram", () => {
  it("consistency = largest day ÷ total profit", () => {
    expect(consistencyScore(dailyPnl(SAMPLE))).toBeCloseTo((300 / 350) * 100);
    expect(consistencyScore([{ date: "x", pnl: -5, trades: 1 }])).toBeNull();
  });
  it("breaks down by symbol", () => {
    const rows = breakdown(SAMPLE, (x) => x.symbol);
    expect(rows[0]).toMatchObject({ key: "XAUUSD", net: 500, count: 2, winRate: 1 });
  });
  it("cost of mistakes counts each tag", () => {
    const rows = costOfMistakes(SAMPLE);
    expect(rows.find((r) => r.key === "fomo")?.net).toBe(-150);
    expect(rows.find((r) => r.key === "early exit")?.net).toBe(-50);
  });
  it("R histogram places values", () => {
    const h = rHistogram(SAMPLE, 1, -2, 4);
    expect(h.find((b) => b.from === 2)?.count).toBe(1);
    expect(h.find((b) => b.from === -1)?.count).toBe(2);
  });
});

describe("rules", () => {
  const firm = {
    drawdown_type: "static",
    max_daily_loss_pct: 5,
    max_total_loss_pct: 10,
    profit_target_phase1_pct: 8,
    profit_target_phase2_pct: 5,
    min_trading_days: 4,
    consistency_rule_pct: null,
  } as Pick<Firm, "drawdown_type" | "max_daily_loss_pct" | "max_total_loss_pct" | "profit_target_phase1_pct" | "profit_target_phase2_pct" | "min_trading_days" | "consistency_rule_pct">;

  it("account overrides win over firm rules", () => {
    const acc = { drawdown_type: "trailing_eod", max_daily_loss_pct: 4 } as Account;
    const r = effectiveRules({ ...acc, max_total_loss_pct: null, profit_target_phase1_pct: null, profit_target_phase2_pct: null, min_trading_days: null, consistency_rule_pct: null }, firm);
    expect(r.drawdown_type).toBe("trailing_eod");
    expect(r.max_daily_loss_pct).toBe(4);
    expect(r.max_total_loss_pct).toBe(10);
  });
  it("daily breach distance", () => {
    const d = dailyBreach(100_000, 5, -2_000)!;
    expect(d.limit).toBe(5_000);
    expect(d.distance).toBe(3_000);
    expect(d.usedPct).toBeCloseTo(40);
    expect(d.level).toBe("ok");
  });
  it("static max loss from starting balance", () => {
    const m = maxBreach({ startingBalance: 100_000, equity: 95_000, highWaterMark: 104_000, drawdownType: "static", maxPct: 10 })!;
    expect(m.floor).toBe(90_000);
    expect(m.distance).toBe(5_000);
    expect(m.level).toBe("warning");
  });
  it("trailing intraday from high-water mark, capped at start", () => {
    const m = maxBreach({ startingBalance: 100_000, equity: 99_000, highWaterMark: 104_000, drawdownType: "trailing_intraday", maxPct: 6 })!;
    expect(m.floor).toBe(98_000);
    expect(m.distance).toBe(1_000);
    expect(m.level).toBe("danger");
    const capped = maxBreach({ startingBalance: 100_000, equity: 110_000, highWaterMark: 112_000, drawdownType: "trailing_intraday", maxPct: 6 })!;
    expect(capped.floor).toBe(100_000);
  });
  it("trailing EOD from highest snapshot balance", () => {
    const m = maxBreach({
      startingBalance: 100_000,
      equity: 100_500,
      highWaterMark: 106_000,
      drawdownType: "trailing_eod",
      maxPct: 5,
      snapshots: [{ balance: 101_000 }, { balance: 103_000 }, { balance: 100_500 }],
    })!;
    expect(m.floor).toBe(98_000);
    expect(m.distance).toBe(2_500);
  });
  it("risk levels", () => {
    expect(riskLevel(10)).toBe("ok");
    expect(riskLevel(50)).toBe("warning");
    expect(riskLevel(80)).toBe("danger");
    expect(riskLevel(100)).toBe("breached");
  });
  it("target progress", () => {
    const p = targetProgress(100_000, 104_000, 8)!;
    expect(p.targetAmount).toBe(8_000);
    expect(p.pct).toBeCloseTo(50);
  });
});

describe("rangeBounds", () => {
  const now = new Date("2026-11-18T06:00:00Z"); // Wed, IST 11:30
  it("week starts Monday", () => expect(rangeBounds("week", now)).toEqual({ from: "2026-11-16", to: "2026-11-18" }));
  it("quarter", () => expect(rangeBounds("quarter", now).from).toBe("2026-10-01"));
  it("all is unbounded", () => expect(rangeBounds("all", now)).toEqual({ from: null, to: null }));
});

describe("demo data + portfolio", async () => {
  const { generateDemoData } = await import("@/lib/demo/generate");
  const { buildPortfolio } = await import("@/lib/analytics/portfolio");
  const now = new Date("2026-11-18T06:00:00Z");
  const d = generateDemoData(now);
  it("generates the brief's demo volumes", () => {
    expect(d.firms).toHaveLength(3);
    expect(d.accounts).toHaveLength(6);
    expect(d.trades.length).toBeGreaterThan(120);
    expect(d.trades.length).toBeLessThan(200);
    expect(d.payouts).toHaveLength(6);
    expect(d.strategies).toHaveLength(3);
    expect(d.goals).toHaveLength(2);
    expect([...d.trades, ...d.accounts, ...d.payouts].every((r) => r.is_demo === true)).toBe(true);
  });
  it("is deterministic", () => {
    expect(generateDemoData(now).trades[10]).toEqual(d.trades[10]);
  });
  it("builds a portfolio", () => {
    const trades = d.trades.map((t) => ({ ...(t as unknown as Trade), net_pnl: Number(t.pnl) - Number(t.fees) }));
    const p = buildPortfolio(
      {
        firms: d.firms as unknown as Firm[],
        accounts: d.accounts as unknown as Account[],
        snapshots: d.snapshots as unknown as Snapshot[],
        trades,
        payouts: d.payouts as unknown as Payout[],
      },
      now,
    );
    expect(p.views).toHaveLength(6);
    expect(p.totals.fundedAccounts).toBe(3);
    expect(p.totals.fundedCapital).toBe(250_000);
    expect(p.totals.payoutCount).toBe(6);
    const breached = p.views.find((v) => v.account.phase === "breached")!;
    expect(breached.isActive).toBe(false);
    expect(breached.max).toBeNull();
    const p1 = p.views.find((v) => v.account.phase === "challenge_phase_1")!;
    expect(p1.target?.targetAmount).toBe(2_000);
  });
});
