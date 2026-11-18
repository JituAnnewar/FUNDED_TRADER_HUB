import Papa from "papaparse";
import { describe, expect, it } from "vitest";
import { autoMap, normalizeRows, parseDate, parseDirection, parseNumber, PRESETS } from "@/lib/import/csv";

const preset = (id: string) => PRESETS.find((p) => p.id === id)!;
const parse = (csv: string) => Papa.parse<Record<string, string>>(csv.trim(), { header: true, skipEmptyLines: true, transformHeader: (h, i) => h || `col${i}` });

describe("parsers", () => {
  it("numbers", () => {
    expect(parseNumber("1,234.50")).toBe(1234.5);
    expect(parseNumber("-$312.00")).toBe(-312);
    expect(parseNumber("(45.10)")).toBe(-45.1);
    expect(parseNumber("1.234,56")).toBe(1234.56);
    expect(parseNumber("−20")).toBe(-20);
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
  });
  it("dates with offset", () => {
    expect(parseDate("2026.11.18 14:30:00", 120)?.toISOString()).toBe("2026-11-18T12:30:00.000Z");
    expect(parseDate("2026-11-18 09:00", 330)?.toISOString()).toBe("2026-11-18T03:30:00.000Z");
    expect(parseDate("11/18/2026 2:05:00 PM", 0)?.toISOString()).toBe("2026-11-18T14:05:00.000Z");
    expect(parseDate("2026-11-18T10:00:00Z", 120)?.toISOString()).toBe("2026-11-18T10:00:00.000Z");
    expect(parseDate("nope", 0)).toBeNull();
  });
  it("directions", () => {
    expect(parseDirection("Buy")).toBe("long");
    expect(parseDirection("sell limit")).toBe("short");
    expect(parseDirection("Short")).toBe("short");
    expect(parseDirection("balance")).toBeNull();
  });
});

describe("MetaTrader preset", () => {
  const csv = `Time,Position,Symbol,Type,Volume,Price,S / L,T / P,Time,Price,Commission,Swap,Profit
2026.11.17 10:00:00,1001,XAUUSD,buy,0.50,2650.10,2640.00,2680.00,2026.11.17 12:30:00,2662.30,-3.50,0.00,610.00
2026.11.17 15:00:00,1002,EURUSD,sell,1.00,1.08500,1.08700,1.08100,2026.11.17 16:10:00,1.08620,-7.00,-1.20,-120.00
2026.11.16 00:00:00,,,balance,,,,,,,,,10000.00`;
  const { data, meta } = parse(csv);
  const mapping = autoMap(meta.fields ?? [], preset("mt"));
  it("maps duplicate Time/Price headers", () => {
    expect(mapping.opened_at).toBe("Time");
    expect(mapping.closed_at).toBe("Time_1");
    expect(mapping.entry_price).toBe("Price");
    expect(mapping.exit_price).toBe("Price_1");
  });
  const rows = normalizeRows(data, mapping, { offsetMinutes: 120 });
  it("normalises trades and skips balance rows", () => {
    expect(rows.map((r) => r.status)).toEqual(["ok", "ok", "skipped"]);
    const a = rows[0]!.row!;
    expect(a).toMatchObject({ external_ticket_id: "1001", symbol: "XAUUSD", direction: "long", pnl: 610, fees: 3.5, entry_price: 2650.1, exit_price: 2662.3 });
    expect(a.opened_at).toBe("2026-11-17T08:00:00.000Z");
    const b = rows[1]!.row!;
    expect(b).toMatchObject({ direction: "short", pnl: -120, fees: 8.2 });
  });
});

describe("Tradovate preset", () => {
  const csv = `symbol,qty,buyPrice,sellPrice,pnl,boughtTimestamp,soldTimestamp,buyFillId
MNQZ6,2,21000.25,20990.00,-41.00,11/18/2026 15:10:00,11/18/2026 15:02:00,77`;
  const { data, meta } = parse(csv);
  const rows = normalizeRows(data, autoMap(meta.fields ?? [], preset("tradovate")), { offsetMinutes: 0, mode: "tradovate" });
  it("infers short when sold first", () => {
    expect(rows[0]!.row).toMatchObject({ direction: "short", entry_price: 20990, exit_price: 21000.25, pnl: -41 });
    expect(rows[0]!.row!.opened_at).toBe("2026-11-18T15:02:00.000Z");
  });
});

describe("validation", () => {
  it("reports row errors and auto-generates stable ticket IDs", () => {
    const { data, meta } = parse(`symbol,side,open time,pnl\nGBPUSD,flat,2026-11-18 10:00,5\n,buy,bad,x\nUSDJPY,buy,2026-11-18 11:00,12`);
    const rows = normalizeRows(data, autoMap(meta.fields ?? [], preset("generic")), { offsetMinutes: 0 });
    expect(rows[0]!.status).toBe("error");
    expect(rows[1]!.errors.length).toBeGreaterThanOrEqual(3);
    expect(rows[2]!.row!.external_ticket_id).toMatch(/^auto-/);
    const again = normalizeRows(data, autoMap(meta.fields ?? [], preset("generic")), { offsetMinutes: 0 });
    expect(again[2]!.row!.external_ticket_id).toBe(rows[2]!.row!.external_ticket_id);
  });
});
