import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { sessionForTrade } from "@/lib/sessions";
import { marketForSymbol } from "@/lib/validation/trade";

/** Server-side validation for imported / ingested trades. */
export const incomingTradeSchema = z.object({
  external_ticket_id: z.string().trim().min(1).max(100),
  symbol: z.string().trim().min(1).max(20).transform((s) => s.toUpperCase()),
  direction: z.enum(["long", "short"]),
  opened_at: z.iso.datetime({ offset: true }),
  closed_at: z.iso.datetime({ offset: true }).nullable().optional(),
  entry_price: z.number().finite().nullable().optional(),
  exit_price: z.number().finite().nullable().optional(),
  size: z.number().finite().nullable().optional(),
  stop_loss: z.number().finite().nullable().optional(),
  take_profit: z.number().finite().nullable().optional(),
  pnl: z.number().finite(),
  fees: z.number().finite().min(0).default(0),
  risk_amount: z.number().finite().positive().nullable().optional(),
  strategy_id: z.uuid().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  is_public: z.boolean().optional(),
});

export type IncomingTrade = z.infer<typeof incomingTradeSchema>;

/** Insert trades for one account, skipping any whose ticket ID already exists. */
export async function insertTrades(sb: SupabaseClient, accountId: string, trades: IncomingTrade[], defaults: { is_public: boolean; strategy_id?: string | null }) {
  const tickets = trades.map((t) => t.external_ticket_id);
  const existing = new Set<string>();
  for (let i = 0; i < tickets.length; i += 300) {
    const { data, error } = await sb.from("trades").select("external_ticket_id").eq("account_id", accountId).in("external_ticket_id", tickets.slice(i, i + 300));
    if (error) throw new Error(error.message);
    for (const r of (data ?? []) as { external_ticket_id: string }[]) existing.add(r.external_ticket_id);
  }
  const seen = new Set<string>();
  const fresh = trades.filter((t) => {
    if (existing.has(t.external_ticket_id) || seen.has(t.external_ticket_id)) return false;
    seen.add(t.external_ticket_id);
    return true;
  });
  const rows = fresh.map((t) => ({
    account_id: accountId,
    strategy_id: t.strategy_id ?? defaults.strategy_id ?? null,
    symbol: t.symbol,
    market: marketForSymbol(t.symbol),
    direction: t.direction,
    opened_at: t.opened_at,
    closed_at: t.closed_at ?? null,
    entry_price: t.entry_price ?? null,
    exit_price: t.exit_price ?? null,
    size: t.size ?? null,
    stop_loss: t.stop_loss ?? null,
    take_profit: t.take_profit ?? null,
    pnl: t.pnl,
    fees: t.fees,
    risk_amount: t.risk_amount ?? null,
    notes: t.notes ?? null,
    external_ticket_id: t.external_ticket_id,
    session: sessionForTrade(new Date(t.opened_at)),
    is_public: t.is_public ?? defaults.is_public,
  }));
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await sb.from("trades").insert(rows.slice(i, i + 500));
    if (error) throw new Error(error.message);
  }
  return { inserted: rows.length, duplicates: trades.length - rows.length };
}
