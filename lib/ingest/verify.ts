import { createHmac, timingSafeEqual } from "node:crypto";

/** Max allowed clock difference between sender and server. */
export const MAX_SKEW_SECONDS = 300;

export function sign(secret: string, timestamp: string, body: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

/**
 * Verify `X-Signature: sha256=<hex>` over `${X-Timestamp}.${rawBody}`.
 * Rejects stale timestamps to prevent replay.
 */
export function verifySignature(params: { secret: string; timestamp: string | null; signature: string | null; body: string; now?: number }): { ok: true } | { ok: false; reason: string } {
  const { secret, timestamp, signature, body } = params;
  if (!timestamp || !signature) return { ok: false, reason: "Missing X-Timestamp or X-Signature header." };
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: "X-Timestamp must be Unix seconds." };
  const now = Math.floor((params.now ?? Date.now()) / 1000);
  if (Math.abs(now - ts) > MAX_SKEW_SECONDS) return { ok: false, reason: "Timestamp is too old or in the future." };
  const given = signature.replace(/^sha256=/, "").trim();
  if (!/^[0-9a-f]{64}$/i.test(given)) return { ok: false, reason: "Malformed signature." };
  const expected = sign(secret, timestamp, body);
  const ok = timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(given.toLowerCase(), "hex"));
  return ok ? { ok: true } : { ok: false, reason: "Signature does not match." };
}
