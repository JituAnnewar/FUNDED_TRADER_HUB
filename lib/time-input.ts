/**
 * Conversions between UTC ISO strings and `<input type="datetime-local">` values in IST.
 * IST has no daylight saving, so a fixed +05:30 offset is exact.
 */
const IST_OFFSET_MIN = 330;

export function isoToIstLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  return new Date(t + IST_OFFSET_MIN * 60_000).toISOString().slice(0, 16);
}

export function istLocalToIso(local: string | null | undefined): string | null {
  if (!local) return null;
  const t = Date.parse(`${local.length === 16 ? `${local}:00` : local}+05:30`);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

/** Today's date (YYYY-MM-DD) in IST. */
export function todayIst(now = new Date()): string {
  return new Date(now.getTime() + IST_OFFSET_MIN * 60_000).toISOString().slice(0, 10);
}
