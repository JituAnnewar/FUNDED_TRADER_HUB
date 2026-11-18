/** Date helpers for analytics. Trading days are bucketed by the display time zone (IST). */

export const DISPLAY_TZ = "Asia/Kolkata";

const keyFmt = new Map<string, Intl.DateTimeFormat>();

/** "YYYY-MM-DD" for the calendar day of `date` in `timeZone`. */
export function dayKey(date: Date | string, timeZone = DISPLAY_TZ): string {
  let f = keyFmt.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
    keyFmt.set(timeZone, f);
  }
  return f.format(typeof date === "string" ? new Date(date) : date);
}

const partsFmt = new Map<string, Intl.DateTimeFormat>();

/** Weekday (0 = Sunday) and hour (0–23) of `date` in `timeZone`. */
export function weekdayHour(date: Date | string, timeZone = DISPLAY_TZ): { weekday: number; hour: number } {
  let f = partsFmt.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "2-digit", hourCycle: "h23" });
    partsFmt.set(timeZone, f);
  }
  const parts = f.formatToParts(typeof date === "string" ? new Date(date) : date);
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hr = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  return { weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd), hour: hr };
}

export type RangePreset = "today" | "week" | "month" | "quarter" | "ytd" | "all" | "custom";

export const RANGE_LABELS: Record<RangePreset, string> = {
  today: "Today",
  week: "This week",
  month: "This month",
  quarter: "This quarter",
  ytd: "Year to date",
  all: "All time",
  custom: "Custom",
};

/** Inclusive day-key bounds for a preset relative to `now` (IST). `null` = unbounded. */
export function rangeBounds(
  preset: RangePreset,
  now: Date,
  custom?: { from?: string; to?: string },
): { from: string | null; to: string | null } {
  const today = dayKey(now);
  const [y, m, d] = today.split("-").map(Number) as [number, number, number];
  const utc = (yy: number, mm: number, dd: number) => new Date(Date.UTC(yy, mm - 1, dd));
  const key = (dt: Date) => dt.toISOString().slice(0, 10);
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "week": {
      const dt = utc(y, m, d);
      const dow = (dt.getUTCDay() + 6) % 7; // Monday = 0
      dt.setUTCDate(dt.getUTCDate() - dow);
      return { from: key(dt), to: today };
    }
    case "month":
      return { from: key(utc(y, m, 1)), to: today };
    case "quarter":
      return { from: key(utc(y, Math.floor((m - 1) / 3) * 3 + 1, 1)), to: today };
    case "ytd":
      return { from: key(utc(y, 1, 1)), to: today };
    case "custom":
      return { from: custom?.from ?? null, to: custom?.to ?? null };
    case "all":
    default:
      return { from: null, to: null };
  }
}

export function inRange(key: string, bounds: { from: string | null; to: string | null }): boolean {
  if (bounds.from && key < bounds.from) return false;
  if (bounds.to && key > bounds.to) return false;
  return true;
}
