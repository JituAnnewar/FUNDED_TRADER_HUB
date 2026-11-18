import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildPortfolio } from "@/lib/analytics/portfolio";
import type { Account, Firm, Payout, Snapshot, Trade } from "@/lib/types";

/** Portfolio as the admin sees it (private rows included). Trades limited to the last 120 days. */
export async function adminPortfolio(sb: SupabaseClient, now: Date) {
  const since = new Date(now.getTime() - 120 * 86_400_000).toISOString();
  const [f, a, s, t, p] = await Promise.all([
    sb.from("firms").select("*"),
    sb.from("accounts").select("*").order("sort_order"),
    sb.from("account_snapshots").select("*").order("date"),
    sb.from("trades").select("*").gte("opened_at", since).order("opened_at", { ascending: false }).limit(5000),
    sb.from("payouts").select("*"),
  ]);
  const input = {
    firms: (f.data ?? []) as Firm[],
    accounts: (a.data ?? []) as Account[],
    snapshots: (s.data ?? []) as Snapshot[],
    trades: (t.data ?? []) as Trade[],
    payouts: (p.data ?? []) as Payout[],
  };
  return { ...buildPortfolio(input, now), ...input };
}
