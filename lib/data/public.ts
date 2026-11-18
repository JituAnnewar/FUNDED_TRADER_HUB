/**
 * Cached public reads. Each function returns empty data when Supabase is not configured,
 * so every page renders a designed empty state instead of failing.
 */
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { publicClient } from "@/lib/supabase/clients";
import { SITE, SOCIALS } from "@/lib/site";
import type {
  Account,
  Firm,
  Goal,
  JournalEntry,
  Milestone,
  OpenPosition,
  Payout,
  PhaseHistory,
  Post,
  SiteSettings,
  Snapshot,
  Strategy,
  ToolkitItem,
  Trade,
  TradeImage,
} from "@/lib/types";
import { TAGS } from "./tags";

const ACCOUNT_COLS =
  "id,created_at,updated_at,is_demo,is_public,firm_id,label,account_size,currency,phase,platform,masked_account_id,starting_balance,current_balance,current_equity,high_water_mark,start_date,status_note,drawdown_type,max_daily_loss_pct,max_total_loss_pct,profit_target_phase1_pct,profit_target_phase2_pct,min_trading_days,consistency_rule_pct,sort_order";
const TRADE_COLS =
  "id,created_at,updated_at,is_demo,is_public,account_id,strategy_id,symbol,market,direction,opened_at,closed_at,entry_price,exit_price,stop_loss,take_profit,size,risk_amount,pnl,fees,net_pnl,r_multiple,session,timeframe,setup_tags,mistake_tags,emotion_before,emotion_after,rating,followed_plan,notes,external_ticket_id";

const PAGE = 1000;

function log(where: string, error: { message: string } | null) {
  if (error) console.error(`[data] ${where}: ${error.message}`);
}

/** Fetch every row of a query in pages (PostgREST caps responses at 1000 rows). */
async function all<T>(
  where: string,
  build: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    log(where, error);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (error || rows.length < PAGE) break;
  }
  return out;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  id: "default",
  updated_at: new Date(0).toISOString(),
  brand_name: SITE.brand,
  trader_name: SITE.trader,
  tagline: SITE.tagline,
  hero_copy: null,
  about_text: null,
  avatar_url: null,
  socials: Object.fromEntries(SOCIALS.filter((s) => s.url).map((s) => [s.id, s.url])),
  sections: {},
  show_open_positions_publicly: false,
  usd_to_inr_rate: 84,
  disclaimer_text: null,
  seo_title: null,
  seo_description: null,
  show_tradingview_widgets: false,
};

export async function getSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.settings);
  const sb = publicClient();
  if (!sb) return DEFAULT_SETTINGS;
  const { data, error } = await sb.from("site_settings").select("*").limit(1).maybeSingle();
  log("settings", error);
  if (!data) return DEFAULT_SETTINGS;
  const row = data as SiteSettings;
  return {
    ...DEFAULT_SETTINGS,
    ...row,
    socials: { ...DEFAULT_SETTINGS.socials, ...(row.socials ?? {}) },
    sections: row.sections ?? {},
  };
}

export async function hasDemoData(): Promise<boolean> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.demo);
  const sb = publicClient();
  if (!sb) return false;
  const { data, error } = await sb.rpc("site_has_demo_data");
  log("demo", error);
  return data === true;
}

export async function getFirms(): Promise<Firm[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.firms);
  const sb = publicClient();
  if (!sb) return [];
  const { data, error } = await sb.from("firms").select("*").order("sort_order").order("name");
  log("firms", error);
  return (data ?? []) as Firm[];
}

export async function getAccounts(): Promise<Account[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.accounts);
  const sb = publicClient();
  if (!sb) return [];
  const { data, error } = await sb.from("accounts").select(ACCOUNT_COLS).order("sort_order").order("start_date", { ascending: false });
  log("accounts", error);
  return (data ?? []) as unknown as Account[];
}

export async function getSnapshots(): Promise<Snapshot[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.snapshots);
  const sb = publicClient();
  if (!sb) return [];
  return all<Snapshot>("snapshots", (f, t) => sb.from("account_snapshots").select("*").order("date").range(f, t));
}

export async function getPhaseHistory(): Promise<PhaseHistory[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.accounts);
  const sb = publicClient();
  if (!sb) return [];
  const { data, error } = await sb.from("account_phase_history").select("*").order("changed_at");
  log("phase history", error);
  return (data ?? []) as PhaseHistory[];
}

export async function getOpenPositions(): Promise<OpenPosition[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.positions);
  const sb = publicClient();
  if (!sb) return [];
  const { data, error } = await sb.from("open_positions").select("*").order("opened_at", { ascending: false });
  log("positions", error);
  return (data ?? []) as OpenPosition[];
}

export async function getTrades(): Promise<Trade[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.trades);
  const sb = publicClient();
  if (!sb) return [];
  return all<Trade>("trades", (f, t) =>
    sb.from("trades").select(TRADE_COLS).order("opened_at", { ascending: false }).range(f, t),
  );
}

export async function getTrade(id: string): Promise<{ trade: Trade; images: TradeImage[] } | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.trades, `trade:${id}`);
  const sb = publicClient();
  if (!sb || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [{ data, error }, imgs] = await Promise.all([
    sb.from("trades").select(TRADE_COLS).eq("id", id).maybeSingle(),
    sb.from("trade_images").select("*").eq("trade_id", id).order("sort_order"),
  ]);
  log("trade", error);
  log("trade images", imgs.error);
  if (!data) return null;
  return { trade: data as unknown as Trade, images: (imgs.data ?? []) as TradeImage[] };
}

export async function getPayouts(): Promise<Payout[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.payouts);
  const sb = publicClient();
  if (!sb) return [];
  const { data, error } = await sb.from("payouts").select("*").order("paid_on", { ascending: false });
  log("payouts", error);
  return (data ?? []) as Payout[];
}

export async function getStrategies(): Promise<Strategy[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.strategies);
  const sb = publicClient();
  if (!sb) return [];
  const { data, error } = await sb.from("strategies").select("*").order("sort_order").order("name");
  log("strategies", error);
  return (data ?? []) as Strategy[];
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.journal);
  const sb = publicClient();
  if (!sb) return [];
  return all<JournalEntry>("journal", (f, t) =>
    sb.from("journal_entries").select("*").order("date", { ascending: false }).range(f, t),
  );
}

export async function getToolkit(): Promise<ToolkitItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.toolkit);
  const sb = publicClient();
  if (!sb) return [];
  const { data, error } = await sb.from("toolkit_items").select("*").order("sort_order").order("name");
  log("toolkit", error);
  return (data ?? []) as ToolkitItem[];
}

export async function getGoals(): Promise<Goal[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.goals);
  const sb = publicClient();
  if (!sb) return [];
  const { data, error } = await sb.from("goals").select("*").order("sort_order").order("deadline");
  log("goals", error);
  return (data ?? []) as Goal[];
}

export async function getPosts(): Promise<Post[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.posts);
  const sb = publicClient();
  if (!sb) return [];
  const { data, error } = await sb.from("posts").select("*").order("published_at", { ascending: false });
  log("posts", error);
  return (data ?? []) as Post[];
}

export async function getMilestones(): Promise<Milestone[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.milestones);
  const sb = publicClient();
  if (!sb) return [];
  const { data, error } = await sb.from("milestones").select("*").order("date");
  log("milestones", error);
  return (data ?? []) as Milestone[];
}
