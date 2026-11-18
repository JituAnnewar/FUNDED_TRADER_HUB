import { describe, expect, it } from "vitest";
import { formatMoney, formatPct, formatPnl, formatR, MINUS } from "@/lib/format";

describe("formatPnl", () => {
  it("adds + to profit", () => expect(formatPnl(1240)).toBe("+$1,240"));
  it("uses a true minus for loss", () => expect(formatPnl(-312.5)).toBe(`${MINUS}$312.50`));
  it("shows zero without a sign", () => expect(formatPnl(0)).toBe("$0.00"));
  it("supports INR with Indian grouping", () =>
    expect(formatPnl(150000, { currency: "INR" })).toBe("+₹1,50,000"));
  it("compacts", () => expect(formatPnl(12500, { compact: true })).toBe("+$12.5K"));
});

describe("formatMoney", () => {
  it("formats balances", () => expect(formatMoney(100000)).toBe("$100,000"));
  it("compacts millions", () => expect(formatMoney(1_250_000, { compact: true })).toBe("$1.3M"));
  it("compacts lakhs", () => expect(formatMoney(250000, { currency: "INR", compact: true })).toBe("₹2.5L"));
});

describe("formatPct / formatR", () => {
  it("signs percentages", () => {
    expect(formatPct(4.2)).toBe("+4.20%");
    expect(formatPct(-1.05)).toBe(`${MINUS}1.05%`);
    expect(formatPct(50, 0, false)).toBe("50%");
  });
  it("signs R", () => {
    expect(formatR(2.4)).toBe("+2.4R");
    expect(formatR(-1)).toBe(`${MINUS}1.0R`);
  });
});
