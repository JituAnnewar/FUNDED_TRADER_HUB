/**
 * Deterministic demo data. Every row has is_demo = true.
 * Used by `npm run seed` and the admin "Load demo data" button.
 * Relative imports only, so the seed script can run under plain Node.
 */
import { dayKey } from "../analytics/dates";
import { sessionForTrade } from "../sessions";
import type { AccountPhase, Direction, DrawdownType, Platform, ToolkitCategory } from "../types";

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function uuid(r: () => number): string {
  const hex = Array.from({ length: 32 }, () => Math.floor(r() * 16).toString(16));
  hex[12] = "4";
  hex[16] = ((parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16);
  const h = hex.join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface DemoData {
  firms: Record<string, unknown>[];
  strategies: Record<string, unknown>[];
  accounts: Record<string, unknown>[];
  phaseHistory: Record<string, unknown>[];
  snapshots: Record<string, unknown>[];
  trades: Record<string, unknown>[];
  payouts: Record<string, unknown>[];
  journal: Record<string, unknown>[];
  toolkit: Record<string, unknown>[];
  goals: Record<string, unknown>[];
  posts: Record<string, unknown>[];
  milestones: Record<string, unknown>[];
}

interface FirmSeed {
  key: string;
  name: string;
  slug: string;
  website: string;
  split: number;
  dd: DrawdownType;
  daily: number;
  max: number;
  t1: number;
  t2: number;
  days: number;
  consistency: number | null;
  freq: string;
  review: string;
}

const FIRMS: FirmSeed[] = [
  {
    key: "fp",
    name: "FundingPips",
    slug: "fundingpips",
    website: "https://fundingpips.com",
    split: 80,
    dd: "static",
    daily: 5,
    max: 10,
    t1: 8,
    t2: 5,
    days: 3,
    consistency: null,
    freq: "Weekly on request",
    review:
      "Sample review (demo data). Clear rules and fast payouts in my experience. The static drawdown suits a swing approach on gold.",
  },
  {
    key: "ftmo",
    name: "FTMO",
    slug: "ftmo",
    website: "https://ftmo.com",
    split: 80,
    dd: "static",
    daily: 5,
    max: 10,
    t1: 10,
    t2: 5,
    days: 4,
    consistency: null,
    freq: "Every 14 days",
    review:
      "Sample review (demo data). The most established firm I use. Strict but predictable. The 10% phase 1 target needs patience.",
  },
  {
    key: "5ers",
    name: "The5ers",
    slug: "the5ers",
    website: "https://the5ers.com",
    split: 80,
    dd: "static",
    daily: 5,
    max: 10,
    t1: 8,
    t2: 5,
    days: 3,
    consistency: null,
    freq: "Every 14 days",
    review: "Sample review (demo data). Good scaling plan. Support answers within a day.",
  },
];

interface AccountSeed {
  firm: string;
  label: string;
  size: number;
  phase: AccountPhase;
  platform: Platform;
  startDaysAgo: number;
  endDaysAgo: number;
  edge: number;
  phases: { phase: AccountPhase; daysAgo: number }[];
}

const ACCOUNTS: AccountSeed[] = [
  { firm: "ftmo", label: "100K #1", size: 100_000, phase: "funded", platform: "MT5", startDaysAgo: 92, endDaysAgo: 0, edge: 0.5, phases: [{ phase: "challenge_phase_1", daysAgo: 150 }, { phase: "challenge_phase_2", daysAgo: 125 }, { phase: "funded", daysAgo: 100 }] },
  { firm: "fp", label: "100K #2", size: 100_000, phase: "funded", platform: "MT5", startDaysAgo: 80, endDaysAgo: 0, edge: 0.48, phases: [{ phase: "challenge_phase_1", daysAgo: 130 }, { phase: "challenge_phase_2", daysAgo: 110 }, { phase: "funded", daysAgo: 85 }] },
  { firm: "fp", label: "50K #3", size: 50_000, phase: "challenge_phase_2", platform: "MT5", startDaysAgo: 30, endDaysAgo: 0, edge: 0.52, phases: [{ phase: "challenge_phase_1", daysAgo: 30 }, { phase: "challenge_phase_2", daysAgo: 12 }] },
  { firm: "5ers", label: "25K #1", size: 25_000, phase: "challenge_phase_1", platform: "MT5", startDaysAgo: 14, endDaysAgo: 0, edge: 0.47, phases: [{ phase: "challenge_phase_1", daysAgo: 14 }] },
  { firm: "5ers", label: "50K #2", size: 50_000, phase: "payout_pending", platform: "MT5", startDaysAgo: 70, endDaysAgo: 2, edge: 0.5, phases: [{ phase: "challenge_phase_1", daysAgo: 120 }, { phase: "challenge_phase_2", daysAgo: 95 }, { phase: "funded", daysAgo: 75 }, { phase: "payout_pending", daysAgo: 2 }] },
  { firm: "ftmo", label: "10K #2", size: 10_000, phase: "breached", platform: "MT4", startDaysAgo: 60, endDaysAgo: 40, edge: 0.3, phases: [{ phase: "challenge_phase_1", daysAgo: 60 }, { phase: "breached", daysAgo: 40 }] },
];

const STRATEGIES = [
  {
    key: "lb",
    name: "London Breakout",
    slug: "london-breakout",
    summary: "Trade the break of the Asian range in the first two hours of London.",
    timeframes: ["M15", "H1"],
    markets: ["XAUUSD", "GBPUSD", "EURUSD"],
    entry_rules: "- Mark the Asian session high and low.\n- Wait for a 15-minute close outside the range after 08:00 London.\n- Enter on the first pullback to the broken level.",
    exit_rules: "- Stop below the opposite side of the retest candle.\n- Take half at 1.5R, trail the rest behind 15-minute swings.\n- Close everything by 12:00 London.",
    risk_rules: "- Risk 0.5% per trade.\n- Maximum two attempts per day.\n- No trades within 30 minutes of red-folder news.",
    checklist: [{ text: "Asian range under 0.6% of price" }, { text: "Clean close outside the range" }, { text: "Retest holds" }, { text: "No high-impact news in the next 30 minutes" }],
  },
  {
    key: "ny",
    name: "New York Liquidity Sweep",
    slug: "new-york-liquidity-sweep",
    summary: "Fade a sweep of the London high or low at the New York open.",
    timeframes: ["M5", "M15"],
    markets: ["XAUUSD", "EURUSD"],
    entry_rules: "- Price takes out the London session high or low after 13:30 IST + 5h (New York open).\n- 5-minute candle closes back inside.\n- Enter on the close with a stop beyond the sweep.",
    exit_rules: "- First target: London midpoint.\n- Final target: opposite London extreme.",
    risk_rules: "- Risk 0.5–1% depending on setup grade.\n- Stop trading after two losses in a day.",
    checklist: [{ text: "Clear sweep of London high/low" }, { text: "Close back inside" }, { text: "At least 2R to London midpoint" }],
  },
  {
    key: "gp",
    name: "Gold Trend Pullback",
    slug: "gold-trend-pullback",
    summary: "Join the H4 trend on gold after a pullback into value.",
    timeframes: ["H1", "H4"],
    markets: ["XAUUSD"],
    entry_rules: "- H4 making higher highs and higher lows (or the reverse).\n- Pullback into the 50% zone of the last impulse.\n- H1 shows a rejection candle.",
    exit_rules: "- Stop beyond the pullback low/high.\n- Target the previous swing; move stop to break-even at 1R.",
    risk_rules: "- Risk 1% maximum.\n- One position at a time on gold.",
    checklist: [{ text: "H4 trend clear" }, { text: "Pullback into 50% zone" }, { text: "H1 rejection candle" }, { text: "Stop placed beyond structure" }],
  },
];

const SYMBOLS: { s: string; w: number; market: "forex" | "commodity"; px: number; pip: number }[] = [
  { s: "XAUUSD", w: 0.55, market: "commodity", px: 2650, pip: 0.1 },
  { s: "EURUSD", w: 0.18, market: "forex", px: 1.085, pip: 0.0001 },
  { s: "GBPUSD", w: 0.15, market: "forex", px: 1.27, pip: 0.0001 },
  { s: "USDJPY", w: 0.12, market: "forex", px: 151.2, pip: 0.01 },
];

const SETUP_TAGS = ["A+ setup", "trend", "range break", "liquidity sweep", "news avoided", "retest"];
const MISTAKES = ["fomo", "moved stop", "early exit", "oversized", "revenge trade", "ignored checklist"];
const EMOTIONS = ["calm", "confident", "anxious", "impatient", "focused", "tired"];

export function generateDemoData(now = new Date(), seed = 42): DemoData {
  const r = rng(seed);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(r() * arr.length)]!;
  const today = new Date(`${dayKey(now)}T00:00:00Z`);
  const daysAgo = (n: number) => new Date(today.getTime() - n * 86_400_000);
  const isWeekday = (d: Date) => d.getUTCDay() !== 0 && d.getUTCDay() !== 6;
  const iso = (d: Date) => d.toISOString();
  const dateOnly = (d: Date) => d.toISOString().slice(0, 10);

  const firmIds: Record<string, string> = {};
  const firms = FIRMS.map((f, i) => {
    const id = uuid(r);
    firmIds[f.key] = id;
    return {
      id,
      is_demo: true,
      name: f.name,
      slug: f.slug,
      website: f.website,
      description: `${f.name} two-step evaluation. Sample rules for demo purposes. Check the firm's website for current terms.`,
      profit_split_pct: f.split,
      drawdown_type: f.dd,
      max_daily_loss_pct: f.daily,
      max_total_loss_pct: f.max,
      profit_target_phase1_pct: f.t1,
      profit_target_phase2_pct: f.t2,
      min_trading_days: f.days,
      consistency_rule_pct: f.consistency,
      payout_frequency: f.freq,
      personal_review: f.review,
      sort_order: i,
    };
  });

  const stratIds: Record<string, string> = {};
  const strategies = STRATEGIES.map(({ key, ...s }, i) => {
    const id = uuid(r);
    stratIds[key] = id;
    return { id, is_demo: true, ...s, is_active: true, sort_order: i };
  });

  const accounts: Record<string, unknown>[] = [];
  const phaseHistory: Record<string, unknown>[] = [];
  const snapshots: Record<string, unknown>[] = [];
  const trades: Record<string, unknown>[] = [];
  const payouts: Record<string, unknown>[] = [];
  const journalDays = new Map<string, { pnl: number; count: number }>();
  let ticket = 900_000;

  ACCOUNTS.forEach((a, ai) => {
    const id = uuid(r);
    const firm = FIRMS.find((f) => f.key === a.firm)!;
    let balance = a.size;
    let hwm = a.size;
    const accountTrades: Record<string, unknown>[] = [];

    for (let d = a.startDaysAgo; d >= a.endDaysAgo; d--) {
      const day = daysAgo(d);
      if (!isWeekday(day)) continue;
      // ~55% of weekdays have trades; 1–2 trades on those days.
      const n = r() < 0.45 ? 0 : r() < 0.75 ? 1 : 2;
      let dayPnl = 0;
      for (let k = 0; k < n; k++) {
        const roll = r();
        let acc = 0;
        const sym = SYMBOLS.find((x) => (acc += x.w) >= roll) ?? SYMBOLS[0]!;
        const strategyKey = sym.s === "XAUUSD" && r() < 0.5 ? "gp" : r() < 0.5 ? "lb" : "ny";
        // London open ≈ 07:00–09:00 UTC, NY ≈ 13:00–15:00 UTC
        const hourUtc = strategyKey === "lb" ? 7 + r() * 2 : strategyKey === "ny" ? 13 + r() * 2 : 6 + r() * 9;
        const opened = new Date(day.getTime() + hourUtc * 3_600_000 + k * 5_400_000);
        const holdMin = 15 + Math.floor(r() * 300);
        const closed = new Date(opened.getTime() + holdMin * 60_000);
        const riskPct = a.size >= 100_000 ? 0.5 : 0.75;
        const risk = round2((a.size * riskPct) / 100);
        const win = r() < a.edge;
        const be = !win && r() < 0.08;
        const mistakes: string[] = !win && r() < 0.35 ? [pick(MISTAKES)] : win && r() < 0.06 ? ["early exit"] : [];
        const rMult = be ? 0 : win ? 0.9 + r() * 1.5 : -(0.75 + r() * 0.3);
        const gross = round2(risk * rMult);
        const fees = sym.market === "forex" ? round2(3 + r() * 4) : round2(1 + r() * 3);
        const pnl = be ? fees : gross; // break-even trades net to zero after fees
        const direction: Direction = r() < 0.5 ? "long" : "short";
        const stopPips = sym.s === "XAUUSD" ? 40 + r() * 80 : 8 + r() * 15;
        const px = sym.px * (1 + (r() - 0.5) * 0.04);
        const stopDist = stopPips * sym.pip;
        const sign = direction === "long" ? 1 : -1;
        const exit = px + sign * stopDist * rMult;
        const net = round2(pnl - fees);
        dayPnl += net;
        balance = round2(balance + net);
        hwm = Math.max(hwm, balance);
        const digits = sym.pip < 0.001 ? 5 : sym.pip < 0.05 ? 3 : 2;
        const t = {
          id: uuid(r),
          is_demo: true,
          is_public: true,
          account_id: id,
          strategy_id: stratIds[strategyKey],
          symbol: sym.s,
          market: sym.market,
          direction,
          opened_at: iso(opened),
          closed_at: iso(closed),
          entry_price: Number(px.toFixed(digits)),
          exit_price: Number(exit.toFixed(digits)),
          stop_loss: Number((px - sign * stopDist).toFixed(digits)),
          take_profit: Number((px + sign * stopDist * 2).toFixed(digits)),
          size: Math.max(0.01, round2(risk / (stopPips * 10))),
          risk_amount: risk,
          pnl,
          fees,
          session: sessionForTrade(opened),
          timeframe: pick(strategyKey === "gp" ? ["H1", "H4"] : ["M5", "M15"]),
          setup_tags: [pick(SETUP_TAGS), ...(r() < 0.3 ? [pick(SETUP_TAGS)] : [])].filter((v, i, arr) => arr.indexOf(v) === i),
          mistake_tags: mistakes,
          emotion_before: pick(EMOTIONS),
          emotion_after: win ? pick(["calm", "confident", "focused"]) : pick(["calm", "frustrated", "tired"]),
          rating: win ? 3 + Math.floor(r() * 3) : 1 + Math.floor(r() * 3),
          followed_plan: mistakes.length === 0,
          notes: win
            ? "Sample note (demo data). Setup met every checklist item. Managed the trade as planned."
            : mistakes.length
              ? `Sample note (demo data). Loss made worse by: ${mistakes.join(", ")}. Review the checklist before entry.`
              : "Sample note (demo data). Valid setup, stop was hit. Part of the plan.",
          external_ticket_id: String(ticket++),
        };
        accountTrades.push(t);
        const jk = dayKey(closed);
        const j = journalDays.get(jk) ?? { pnl: 0, count: 0 };
        journalDays.set(jk, { pnl: j.pnl + net, count: j.count + 1 });
      }
      snapshots.push({
        id: uuid(r),
        is_demo: true,
        account_id: id,
        date: dateOnly(day),
        balance,
        equity: balance,
        day_pnl: round2(dayPnl),
        note: null,
      });
    }

    // The breached account ends below its floor.
    if (a.phase === "breached") {
      const floor = a.size * (1 - firm.max / 100);
      if (balance > floor) {
        const loss = round2(-(balance - floor + 25));
        const lastDay = daysAgo(a.endDaysAgo);
        const opened = new Date(lastDay.getTime() + 14 * 3_600_000);
        accountTrades.push({
          id: uuid(r),
          is_demo: true,
          is_public: true,
          account_id: id,
          strategy_id: stratIds.ny,
          symbol: "XAUUSD",
          market: "commodity",
          direction: "long",
          opened_at: iso(opened),
          closed_at: iso(new Date(opened.getTime() + 40 * 60_000)),
          entry_price: 2610.5,
          exit_price: 2596.2,
          stop_loss: 2600,
          take_profit: 2640,
          size: 0.6,
          risk_amount: round2(a.size * 0.0075),
          pnl: loss,
          fees: 0,
          session: sessionForTrade(opened),
          timeframe: "M5",
          setup_tags: ["liquidity sweep"],
          mistake_tags: ["moved stop", "revenge trade"],
          emotion_before: "impatient",
          emotion_after: "frustrated",
          rating: 1,
          followed_plan: false,
          notes: "Sample note (demo data). Moved the stop after two losses and breached the account. The reason the two-loss rule exists.",
          external_ticket_id: String(ticket++),
        });
        balance = round2(balance + loss);
        const last = snapshots[snapshots.length - 1]!;
        last.balance = balance;
        last.equity = balance;
        last.day_pnl = round2(Number(last.day_pnl) + loss);
      }
    }

    trades.push(...accountTrades);
    const equity = a.phase === "breached" || a.phase === "payout_pending" ? balance : round2(balance + (r() - 0.4) * a.size * 0.004);
    accounts.push({
      id,
      is_demo: true,
      is_public: true,
      firm_id: firmIds[a.firm],
      label: a.label,
      account_size: a.size,
      currency: "USD",
      phase: a.phase,
      platform: a.platform,
      masked_account_id: String(1000 + Math.floor(r() * 8999)),
      starting_balance: a.size,
      current_balance: balance,
      current_equity: equity,
      high_water_mark: Math.max(hwm, equity),
      start_date: dateOnly(daysAgo(a.startDaysAgo)),
      status_note: a.phase === "breached" ? "Breached on max loss. Lessons logged in the journal." : null,
      sort_order: ai,
    });
    a.phases.forEach((p, pi) => {
      phaseHistory.push({
        id: uuid(r),
        is_demo: true,
        account_id: id,
        from_phase: pi === 0 ? null : a.phases[pi - 1]!.phase,
        to_phase: p.phase,
        changed_at: iso(daysAgo(p.daysAgo)),
        note: pi === 0 ? "Challenge purchased" : null,
      });
    });

    // Payouts for funded and payout-pending accounts.
    if (a.phase === "funded" || a.phase === "payout_pending") {
      const count = a.phase === "funded" ? 2 : 2;
      for (let p = 0; p < count; p++) {
        const amount = round2(a.size * (0.012 + r() * 0.025) * (firm.split / 100));
        payouts.push({
          id: uuid(r),
          is_demo: true,
          is_public: true,
          account_id: id,
          firm_id: firmIds[a.firm],
          amount,
          currency: "USD",
          paid_on: dateOnly(daysAgo(Math.max(3, a.startDaysAgo - 20 - p * 28))),
          method: p % 2 ? "crypto" : "rise",
          certificate_url: "/demo/certificate.svg",
          certificate_thumb_url: "/demo/certificate.svg",
          verification_url: p === 0 ? firm.website : null,
          note: "Sample payout (demo data).",
          is_featured: p === 0,
        });
      }
    }
  });

  const journal = [...journalDays.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 40)
    .map(([date, d]) => ({
      id: uuid(r),
      is_demo: true,
      is_public: true,
      date,
      pre_market_plan:
        "Sample plan (demo data).\n- Gold: watching the Asian range for a London break.\n- EURUSD: no trade unless New York sweeps the London low.\n- Max two trades. Risk 0.5%.",
      post_market_review:
        d.pnl >= 0
          ? `Sample review (demo data). ${d.count} trade(s). Followed the plan. Waited for confirmation instead of chasing.`
          : `Sample review (demo data). ${d.count} trade(s). Red day. Entries were valid but I took one trade outside the checklist.`,
      mood: d.pnl >= 0 ? 4 : 3,
      focus: 3 + Math.floor(r() * 3),
      lessons: d.pnl >= 0 ? "Patience pays. Less is more." : "Stop after two losses. No exceptions.",
      tags: d.pnl >= 0 ? ["green day"] : ["red day"],
    }));

  const toolkitSeeds: { category: ToolkitCategory; name: string; description: string; url: string; is_affiliate: boolean }[] = [
    { category: "platform", name: "MetaTrader 5", description: "Execution platform for all prop accounts.", url: "https://www.metatrader5.com", is_affiliate: false },
    { category: "charting", name: "TradingView", description: "All analysis and journaling screenshots.", url: "https://www.tradingview.com", is_affiliate: false },
    { category: "indicator", name: "Session ranges", description: "Marks the Asian, London and New York ranges automatically.", url: "https://www.tradingview.com/scripts/", is_affiliate: false },
    { category: "hardware", name: "Two 27\" monitors", description: "One for charts, one for the platform and journal.", url: "", is_affiliate: false },
    { category: "education", name: "Trading in the Zone", description: "Mark Douglas. The book on consistency and process.", url: "", is_affiliate: false },
  ];
  const toolkit = toolkitSeeds.map((t, i) => ({ id: uuid(r), is_demo: true, ...t, url: t.url || null, sort_order: i }));

  const goals = [
    { id: uuid(r), is_demo: true, title: "Reach $50,000 in total payouts", metric: "total_payouts", target_amount: 50_000, deadline: `${today.getUTCFullYear() + 1}-12-31`, sort_order: 0 },
    { id: uuid(r), is_demo: true, title: "Manage $500,000 in funded capital", metric: "funded_capital", target_amount: 500_000, deadline: `${today.getUTCFullYear() + 1}-06-30`, sort_order: 1 },
  ];

  const posts = [
    {
      id: uuid(r),
      is_demo: true,
      title: "Why I stop after two losses",
      slug: "why-i-stop-after-two-losses",
      excerpt: "Sample post (demo data). The simplest rule that saved my funded accounts.",
      body: "Sample post (demo data).\n\nMost of my breached accounts had the same pattern: two losses, then a third trade taken to \"win it back\".\n\n## The rule\n\nAfter two losing trades in a day, I close the platform. No exceptions.\n\n## What changed\n\n- Fewer red days below −1%\n- No more daily-loss breaches\n- Better sleep\n\nLess is more.",
      published_at: iso(daysAgo(20)),
    },
    {
      id: uuid(r),
      is_demo: true,
      title: "Trading gold around the London open",
      slug: "trading-gold-around-the-london-open",
      excerpt: "Sample post (demo data). How I use the Asian range on XAUUSD.",
      body: "Sample post (demo data).\n\nGold often builds a tight range during Asia and expands in London.\n\n1. Mark the Asian high and low.\n2. Wait for a 15-minute close outside.\n3. Enter on the retest, stop on the other side.\n\nThe edge is small. Risk management does the rest.",
      published_at: iso(daysAgo(45)),
    },
  ];

  const milestones = [
    { id: uuid(r), is_demo: true, date: dateOnly(daysAgo(400)), title: "Started trading", description: "Sample milestone (demo data). First live demo account." },
    { id: uuid(r), is_demo: true, date: dateOnly(daysAgo(150)), title: "First challenge passed", description: "Sample milestone (demo data)." },
    { id: uuid(r), is_demo: true, date: dateOnly(daysAgo(100)), title: "First funded account", description: "Sample milestone (demo data)." },
    { id: uuid(r), is_demo: true, date: dateOnly(daysAgo(70)), title: "First payout", description: "Sample milestone (demo data)." },
  ];

  return { firms, strategies, accounts, phaseHistory, snapshots, trades, payouts, journal, toolkit, goals, posts, milestones };
}

/** Insert order respecting foreign keys. */
export const DEMO_TABLES: { key: keyof DemoData; table: string }[] = [
  { key: "firms", table: "firms" },
  { key: "strategies", table: "strategies" },
  { key: "accounts", table: "accounts" },
  { key: "phaseHistory", table: "account_phase_history" },
  { key: "snapshots", table: "account_snapshots" },
  { key: "trades", table: "trades" },
  { key: "payouts", table: "payouts" },
  { key: "journal", table: "journal_entries" },
  { key: "toolkit", table: "toolkit_items" },
  { key: "goals", table: "goals" },
  { key: "posts", table: "posts" },
  { key: "milestones", table: "milestones" },
];
