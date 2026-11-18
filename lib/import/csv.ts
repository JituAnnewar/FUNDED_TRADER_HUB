/**
 * CSV trade import: column mapping presets and row normalisation. Pure (no I/O).
 */

export const TARGET_FIELDS = [
  { key: "external_ticket_id", label: "Ticket / position ID" },
  { key: "symbol", label: "Symbol", required: true },
  { key: "direction", label: "Direction (buy/sell)", required: true },
  { key: "opened_at", label: "Open time", required: true },
  { key: "closed_at", label: "Close time" },
  { key: "entry_price", label: "Entry price" },
  { key: "exit_price", label: "Exit price" },
  { key: "size", label: "Size / volume" },
  { key: "stop_loss", label: "Stop loss" },
  { key: "take_profit", label: "Take profit" },
  { key: "pnl", label: "Profit (gross)", required: true },
  { key: "commission", label: "Commission" },
  { key: "swap", label: "Swap" },
] as const;

export type TargetKey = (typeof TARGET_FIELDS)[number]["key"];
export type Mapping = Partial<Record<TargetKey, string>>;

export interface Preset {
  id: string;
  label: string;
  /** Candidate header names per field (case-insensitive). The first match in the file wins. */
  candidates: Partial<Record<TargetKey, string[]>>;
  /** Special handling. */
  mode?: "tradovate";
}

export const PRESETS: Preset[] = [
  {
    id: "mt",
    label: "MetaTrader 4 / 5 history",
    candidates: {
      external_ticket_id: ["Position", "Ticket", "Order", "Deal"],
      symbol: ["Symbol", "Item"],
      direction: ["Type", "Direction"],
      opened_at: ["Open Time", "Time", "Opening Time"],
      closed_at: ["Close Time", "Time_1", "Closing Time"],
      entry_price: ["Open Price", "Price"],
      exit_price: ["Close Price", "Price_1"],
      size: ["Volume", "Size", "Lots"],
      stop_loss: ["S / L", "S/L", "SL"],
      take_profit: ["T / P", "T/P", "TP"],
      pnl: ["Profit"],
      commission: ["Commission"],
      swap: ["Swap"],
    },
  },
  {
    id: "ctrader",
    label: "cTrader",
    candidates: {
      external_ticket_id: ["Position ID", "ID", "Order ID"],
      symbol: ["Symbol"],
      direction: ["Opening Direction", "Direction", "Side"],
      opened_at: ["Opening Time", "Open Time", "Opening time (UTC)"],
      closed_at: ["Closing Time", "Close Time", "Closing time (UTC)"],
      entry_price: ["Entry Price", "Opening Price"],
      exit_price: ["Closing Price", "Close Price"],
      size: ["Quantity", "Volume", "Closing Quantity"],
      pnl: ["Gross USD", "Gross $", "Gross Profit", "Net USD", "Net $"],
      commission: ["Commission", "Commissions"],
      swap: ["Swap"],
    },
  },
  {
    id: "tradovate",
    label: "Tradovate (Performance CSV)",
    mode: "tradovate",
    candidates: {
      external_ticket_id: ["buyFillId", "sellFillId"],
      symbol: ["symbol", "contract"],
      opened_at: ["boughtTimestamp"],
      closed_at: ["soldTimestamp"],
      entry_price: ["buyPrice"],
      exit_price: ["sellPrice"],
      size: ["qty"],
      pnl: ["pnl"],
    },
  },
  {
    id: "ninja",
    label: "NinjaTrader (Trades)",
    candidates: {
      external_ticket_id: ["Trade number", "Trade #"],
      symbol: ["Instrument"],
      direction: ["Market pos.", "Market Position"],
      opened_at: ["Entry time"],
      closed_at: ["Exit time"],
      entry_price: ["Entry price"],
      exit_price: ["Exit price"],
      size: ["Qty", "Quantity"],
      pnl: ["Profit"],
      commission: ["Commission"],
    },
  },
  {
    id: "tradingview",
    label: "TradingView (broker history)",
    candidates: {
      external_ticket_id: ["Order ID", "Position ID", "ID"],
      symbol: ["Symbol"],
      direction: ["Side", "Type"],
      opened_at: ["Open Time", "Placing Time", "Time"],
      closed_at: ["Closing Time", "Close Time"],
      entry_price: ["Avg Fill Price", "Fill Price", "Entry Price"],
      exit_price: ["Closing Price", "Exit Price"],
      size: ["Qty", "Quantity"],
      pnl: ["Profit", "Realized P&L", "P&L"],
      commission: ["Commission", "Fees"],
    },
  },
  {
    id: "generic",
    label: "Generic",
    candidates: {
      external_ticket_id: ["ticket", "id", "trade id", "position", "order"],
      symbol: ["symbol", "instrument", "pair", "market"],
      direction: ["direction", "side", "type", "action"],
      opened_at: ["open time", "opened at", "entry time", "open date", "date"],
      closed_at: ["close time", "closed at", "exit time", "close date"],
      entry_price: ["entry", "entry price", "open price"],
      exit_price: ["exit", "exit price", "close price"],
      size: ["size", "lots", "volume", "qty", "quantity", "contracts"],
      stop_loss: ["sl", "stop", "stop loss"],
      take_profit: ["tp", "target", "take profit"],
      pnl: ["pnl", "p&l", "profit", "net", "result"],
      commission: ["commission", "fees", "fee"],
      swap: ["swap", "rollover"],
    },
  },
];

/** Pick the first header that matches each field's candidates. */
export function autoMap(headers: string[], preset: Preset): Mapping {
  const lower = new Map(headers.map((h) => [h.trim().toLowerCase(), h]));
  const m: Mapping = {};
  for (const [field, cands] of Object.entries(preset.candidates) as [TargetKey, string[]][]) {
    for (const c of cands) {
      const hit = lower.get(c.toLowerCase());
      if (hit) {
        m[field] = hit;
        break;
      }
    }
  }
  return m;
}

export function parseNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  let s = String(v).trim();
  if (!s || s === "-") return null;
  const neg = /^\(.*\)$/.test(s) || /^-/.test(s) || /−/.test(s);
  s = s.replace(/[()\s$€£₹]|USD|EUR|GBP|INR/gi, "").replace(/−/g, "-");
  // "1.234,56" → European format
  if (/^-?\d{1,3}(\.\d{3})+,\d+$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = Number(s.replace(/^-/, ""));
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}

/**
 * Parse a date string written in a fixed UTC offset (minutes). Accepts ISO, "YYYY.MM.DD HH:MM[:SS]",
 * "YYYY-MM-DD HH:MM", "MM/DD/YYYY HH:MM[:SS] [AM|PM]". Strings with an explicit zone keep it.
 */
export function parseDate(v: unknown, offsetMinutes: number): Date | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s) && !Number.isNaN(Date.parse(s))) return new Date(s);
  let m = s.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  let y: number, mo: number, d: number, h: number, mi: number, se: number;
  if (m) {
    [y, mo, d, h, mi, se] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0)];
  } else {
    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
    if (!m) {
      const t = Date.parse(s);
      return Number.isNaN(t) ? null : new Date(t);
    }
    [mo, d, y, h, mi, se] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0)];
    const ap = m[7]?.toUpperCase();
    if (ap === "PM" && h < 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
  }
  const utc = Date.UTC(y, mo - 1, d, h, mi, se) - offsetMinutes * 60_000;
  return Number.isNaN(utc) ? null : new Date(utc);
}

export function parseDirection(v: unknown): "long" | "short" | null {
  const s = String(v ?? "").toLowerCase();
  if (/\b(buy|long|bought)\b/.test(s) || s === "b") return "long";
  if (/\b(sell|short|sold)\b/.test(s) || s === "s") return "short";
  return null;
}

export interface ImportRow {
  line: number;
  external_ticket_id: string;
  symbol: string;
  direction: "long" | "short";
  opened_at: string;
  closed_at: string | null;
  entry_price: number | null;
  exit_price: number | null;
  size: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  pnl: number;
  fees: number;
}

export interface RowResult {
  line: number;
  status: "ok" | "error" | "skipped";
  row?: ImportRow;
  errors: string[];
  raw: Record<string, string>;
}

function hashTicket(parts: string[]): string {
  let h = 2166136261;
  for (const ch of parts.join("|")) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return `auto-${(h >>> 0).toString(36)}`;
}

/** Normalise raw CSV rows into trade rows with per-row validation errors. */
export function normalizeRows(rows: Record<string, string>[], mapping: Mapping, opts: { offsetMinutes: number; mode?: Preset["mode"] }): RowResult[] {
  const get = (r: Record<string, string>, k: TargetKey) => (mapping[k] ? r[mapping[k]!] : undefined);
  return rows.map((raw, i) => {
    const line = i + 2; // header is line 1
    const errors: string[] = [];
    const typeRaw = String(get(raw, "direction") ?? "").toLowerCase();
    if (/balance|deposit|withdraw|credit/.test(typeRaw)) return { line, status: "skipped", errors: ["Not a trade (balance or deposit row)."], raw };

    const symbol = String(get(raw, "symbol") ?? "").trim().toUpperCase();
    let opened = parseDate(get(raw, "opened_at"), opts.offsetMinutes);
    let closed = parseDate(get(raw, "closed_at"), opts.offsetMinutes);
    let direction = parseDirection(get(raw, "direction"));
    let entry = parseNumber(get(raw, "entry_price"));
    let exit = parseNumber(get(raw, "exit_price"));

    if (opts.mode === "tradovate" && opened && closed) {
      // Tradovate rows have buy and sell legs; whichever happened first is the entry.
      direction = opened <= closed ? "long" : "short";
      if (direction === "short") {
        [opened, closed] = [closed, opened];
        [entry, exit] = [exit, entry];
      }
    }

    const pnl = parseNumber(get(raw, "pnl"));
    const commission = parseNumber(get(raw, "commission")) ?? 0;
    const swap = parseNumber(get(raw, "swap")) ?? 0;
    // Commission is always a cost (exports show it as negative or positive). Negative swap is a cost; positive swap is added to P&L.
    const fees = Math.round((Math.abs(commission) + Math.max(0, -swap)) * 100) / 100;

    if (!symbol) errors.push("Missing symbol.");
    if (!direction) errors.push("Direction must say buy/sell or long/short.");
    if (!opened) errors.push("Open time is missing or not a date.");
    if (pnl === null) errors.push("Profit is missing or not a number.");
    if (opened && closed && closed < opened) errors.push("Close time is before open time.");

    if (errors.length) return { line, status: "error", errors, raw };
    const ticket = String(get(raw, "external_ticket_id") ?? "").trim() || hashTicket([symbol, opened!.toISOString(), String(pnl)]);
    return {
      line,
      status: "ok",
      errors: [],
      raw,
      row: {
        line,
        external_ticket_id: ticket.slice(0, 100),
        symbol: symbol.slice(0, 20),
        direction: direction!,
        opened_at: opened!.toISOString(),
        closed_at: closed ? closed.toISOString() : null,
        entry_price: entry,
        exit_price: exit,
        size: parseNumber(get(raw, "size")),
        stop_loss: parseNumber(get(raw, "stop_loss")) || null,
        take_profit: parseNumber(get(raw, "take_profit")) || null,
        // Gross P&L = profit + swap when the platform reports swap separately (MT); commission becomes fees.
        pnl: Math.round((pnl! + (swap > 0 ? swap : 0)) * 100) / 100,
        fees,
      },
    };
  });
}

export const TIMEZONE_OPTIONS = [
  { value: 0, label: "UTC" },
  { value: 120, label: "UTC+2 (most MT servers, winter)" },
  { value: 180, label: "UTC+3 (most MT servers, summer)" },
  { value: 330, label: "IST (UTC+5:30)" },
  { value: -300, label: "New York (UTC−5)" },
  { value: -240, label: "New York (UTC−4, summer)" },
];
