/**
 * Market session detection.
 *
 * Every market is defined in its own IANA time zone, so daylight-saving
 * shifts (London, New York, Sydney) are handled by the platform's Intl data
 * rather than hard-coded UTC offsets.
 */

export type MarketId = "sydney" | "tokyo" | "london" | "new_york";

export type TradeSession = "asia" | "london" | "new_york" | "london_ny_overlap";

export interface MarketDefinition {
  id: MarketId;
  label: string;
  short: string;
  timeZone: string;
  /** Local opening hour (inclusive), 24h clock. */
  open: number;
  /** Local closing hour (exclusive), 24h clock. */
  close: number;
}

export const MARKETS: readonly MarketDefinition[] = [
  { id: "sydney", label: "Sydney", short: "SYD", timeZone: "Australia/Sydney", open: 7, close: 16 },
  { id: "tokyo", label: "Tokyo", short: "TYO", timeZone: "Asia/Tokyo", open: 9, close: 18 },
  { id: "london", label: "London", short: "LDN", timeZone: "Europe/London", open: 8, close: 17 },
  { id: "new_york", label: "New York", short: "NY", timeZone: "America/New_York", open: 8, close: 17 },
] as const;

export const TRADE_SESSION_LABELS: Record<TradeSession, string> = {
  asia: "Asia",
  london: "London",
  new_york: "New York",
  london_ny_overlap: "London / NY overlap",
};

interface ZonedParts {
  /** 0 = Sunday … 6 = Saturday, in the given zone. */
  weekday: number;
  /** Fractional hour in the given zone, e.g. 13.5 for 13:30. */
  hour: number;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = formatterCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    formatterCache.set(timeZone, f);
  }
  return f;
}

export function zonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = formatterFor(timeZone).formatToParts(date);
  let weekday = 0;
  let hour = 0;
  let minute = 0;
  for (const p of parts) {
    if (p.type === "weekday") weekday = WEEKDAYS.indexOf(p.value);
    else if (p.type === "hour") hour = Number(p.value) % 24;
    else if (p.type === "minute") minute = Number(p.value);
  }
  return { weekday, hour: hour + minute / 60 };
}

/**
 * The spot FX / gold market runs from Sunday 17:00 to Friday 17:00 New York time.
 */
export function isFxMarketOpen(date: Date): boolean {
  const { weekday, hour } = zonedParts(date, "America/New_York");
  if (weekday === 6) return false; // Saturday
  if (weekday === 5) return hour < 17; // Friday until 17:00
  if (weekday === 0) return hour >= 17; // Sunday from 17:00
  return true;
}

function withinHours(date: Date, m: MarketDefinition): boolean {
  const { hour } = zonedParts(date, m.timeZone);
  return hour >= m.open && hour < m.close;
}

/** Whether a given market's main session is open at `date` (respects the FX weekend). */
export function isMarketOpen(date: Date, market: MarketDefinition): boolean {
  if (!isFxMarketOpen(date)) return false;
  const { weekday } = zonedParts(date, market.timeZone);
  if (weekday === 0 || weekday === 6) return false;
  return withinHours(date, market);
}

export function openMarkets(date: Date): MarketDefinition[] {
  return MARKETS.filter((m) => isMarketOpen(date, m));
}

function market(id: MarketId): MarketDefinition {
  const m = MARKETS.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown market ${id}`);
  return m;
}

/**
 * Bucket a trade's open time into one of four sessions.
 * Overlap wins over single sessions; anything outside London and New York hours is "asia".
 * Only local hours are used (not the weekend rule) so imported weekend crypto trades still get a bucket.
 */
export function sessionForTrade(openedAt: Date): TradeSession {
  const london = withinHours(openedAt, market("london"));
  const ny = withinHours(openedAt, market("new_york"));
  if (london && ny) return "london_ny_overlap";
  if (ny) return "new_york";
  if (london) return "london";
  return "asia";
}
