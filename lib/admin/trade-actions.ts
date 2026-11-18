"use server";

import { updateTag } from "next/cache";
import { adminAction, fail, type ActionResult } from "@/lib/admin/auth";
import { TAGS } from "@/lib/data/tags";
import { sessionForTrade } from "@/lib/sessions";
import { marketForSymbol, quickTradeSchema, type QuickTradeInput } from "@/lib/validation/trade";

export async function quickAddTrade(input: QuickTradeInput): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = quickTradeSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
    const { sb } = await adminAction();
    const d = parsed.data;
    const now = new Date();
    const { data, error } = await sb
      .from("trades")
      .insert({
        account_id: d.account_id,
        strategy_id: d.strategy_id || null,
        symbol: d.symbol,
        market: marketForSymbol(d.symbol),
        direction: d.direction,
        opened_at: now.toISOString(),
        closed_at: now.toISOString(),
        pnl: d.net_pnl,
        fees: 0,
        risk_amount: d.risk_amount ?? null,
        session: sessionForTrade(now),
        is_public: d.is_public,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    updateTag(TAGS.trades);
    updateTag(TAGS.accounts);
    return { ok: true, data: { id: (data as { id: string }).id }, message: "Trade saved." };
  } catch (e) {
    return fail(e);
  }
}
