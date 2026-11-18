import { describe, expect, it } from "vitest";
import { isFxMarketOpen, MARKETS, openMarkets, sessionForTrade } from "@/lib/sessions";

const ids = (d: Date) => openMarkets(d).map((m) => m.id);

describe("isFxMarketOpen", () => {
  it("is closed on Saturday", () => {
    expect(isFxMarketOpen(new Date("2026-11-14T12:00:00Z"))).toBe(false);
  });
  it("opens Sunday 17:00 New York time (winter, UTC-5 → 22:00 UTC)", () => {
    expect(isFxMarketOpen(new Date("2026-11-15T21:59:00Z"))).toBe(false);
    expect(isFxMarketOpen(new Date("2026-11-15T22:00:00Z"))).toBe(true);
  });
  it("opens Sunday 17:00 New York time (summer, UTC-4 → 21:00 UTC)", () => {
    expect(isFxMarketOpen(new Date("2026-07-12T20:59:00Z"))).toBe(false);
    expect(isFxMarketOpen(new Date("2026-07-12T21:00:00Z"))).toBe(true);
  });
  it("closes Friday 17:00 New York time", () => {
    expect(isFxMarketOpen(new Date("2026-11-20T21:59:00Z"))).toBe(true);
    expect(isFxMarketOpen(new Date("2026-11-20T22:00:00Z"))).toBe(false);
  });
});

describe("openMarkets", () => {
  it("London opens 08:00 local in winter (08:00 UTC)", () => {
    expect(ids(new Date("2026-11-18T07:59:00Z"))).not.toContain("london");
    expect(ids(new Date("2026-11-18T08:00:00Z"))).toContain("london");
  });
  it("London opens 08:00 local in summer (07:00 UTC, BST)", () => {
    expect(ids(new Date("2026-07-15T07:00:00Z"))).toContain("london");
  });
  it("New York opens 08:00 local in summer (12:00 UTC, EDT)", () => {
    expect(ids(new Date("2026-07-15T11:59:00Z"))).not.toContain("new_york");
    expect(ids(new Date("2026-07-15T12:00:00Z"))).toContain("new_york");
  });
  it("Tokyo has no DST and is open at 01:00 UTC (10:00 JST)", () => {
    expect(ids(new Date("2026-11-18T01:00:00Z"))).toContain("tokyo");
  });
  it("nothing is open on Saturday", () => {
    expect(ids(new Date("2026-11-14T10:00:00Z"))).toEqual([]);
  });
  it("defines four markets", () => {
    expect(MARKETS).toHaveLength(4);
  });
});

describe("sessionForTrade", () => {
  it("maps Tokyo morning to asia", () => {
    expect(sessionForTrade(new Date("2026-11-18T02:00:00Z"))).toBe("asia");
  });
  it("maps London-only hours to london", () => {
    expect(sessionForTrade(new Date("2026-11-18T10:00:00Z"))).toBe("london");
  });
  it("maps winter overlap (13:00–17:00 UTC) correctly", () => {
    expect(sessionForTrade(new Date("2026-11-18T14:00:00Z"))).toBe("london_ny_overlap");
  });
  it("maps summer overlap (12:00–16:00 UTC) correctly", () => {
    expect(sessionForTrade(new Date("2026-07-15T12:30:00Z"))).toBe("london_ny_overlap");
  });
  it("maps NY afternoon to new_york", () => {
    expect(sessionForTrade(new Date("2026-11-18T19:00:00Z"))).toBe("new_york");
  });
  it("handles the US/UK DST gap week (US on EDT, UK still GMT)", () => {
    // 2026-03-10: New York is UTC-4, London is UTC+0. NY opens 12:00 UTC, London closes 17:00 UTC.
    expect(sessionForTrade(new Date("2026-03-10T12:30:00Z"))).toBe("london_ny_overlap");
    expect(sessionForTrade(new Date("2026-03-10T11:30:00Z"))).toBe("london");
  });
});
