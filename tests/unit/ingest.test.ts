import { describe, expect, it } from "vitest";
import { sign, verifySignature } from "@/lib/ingest/verify";

const secret = "test-secret";
const body = JSON.stringify({ account_id: "x", symbol: "XAUUSD" });
const now = 1_795_000_000_000;
const ts = String(Math.floor(now / 1000));

describe("ingest signature", () => {
  it("accepts a valid signature", () => {
    expect(verifySignature({ secret, timestamp: ts, signature: `sha256=${sign(secret, ts, body)}`, body, now }).ok).toBe(true);
  });
  it("rejects a tampered body", () => {
    expect(verifySignature({ secret, timestamp: ts, signature: `sha256=${sign(secret, ts, body)}`, body: body + " ", now }).ok).toBe(false);
  });
  it("rejects stale timestamps (replay)", () => {
    const old = String(Number(ts) - 3600);
    expect(verifySignature({ secret, timestamp: old, signature: sign(secret, old, body), body, now })).toEqual({ ok: false, reason: "Timestamp is too old or in the future." });
  });
  it("rejects missing headers and malformed signatures", () => {
    expect(verifySignature({ secret, timestamp: null, signature: null, body, now }).ok).toBe(false);
    expect(verifySignature({ secret, timestamp: ts, signature: "abc", body, now }).ok).toBe(false);
  });
});
