import { SITE } from "@/lib/site";

const cache = new Map<string, Intl.DateTimeFormat>();

function fmt(key: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  let f = cache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat("en-IN", { timeZone: SITE.timeZone, ...opts });
    cache.set(key, f);
  }
  return f;
}

/** "14:05" in IST */
export function formatTimeIST(date: Date): string {
  return fmt("time", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
}

/** "18 Nov 2026" in IST */
export function formatDateIST(date: Date): string {
  return fmt("date", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

/** "18 Nov 2026, 14:05" in IST */
export function formatDateTimeIST(date: Date): string {
  return fmt("datetime", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}
