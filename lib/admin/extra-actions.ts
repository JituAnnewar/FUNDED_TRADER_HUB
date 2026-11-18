"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminAction, fail, type ActionResult } from "@/lib/admin/auth";
import { TAGS } from "@/lib/data/tags";
import { sessionForTrade } from "@/lib/sessions";
import type { AccountPhase, ImageKind } from "@/lib/types";

const PHASES: AccountPhase[] = ["challenge_phase_1", "challenge_phase_2", "funded", "passed", "payout_pending", "breached", "closed"];

export async function movePhase(accountId: string, toPhase: AccountPhase, note: string): Promise<ActionResult> {
  try {
    if (!PHASES.includes(toPhase)) return { ok: false, error: "Unknown phase." };
    const { sb } = await adminAction();
    const { error } = await sb.from("accounts").update({ phase: toPhase }).eq("id", accountId);
    if (error) return { ok: false, error: error.message };
    if (note.trim()) {
      // The trigger wrote the history row; attach the note to the latest one.
      const { data } = await sb.from("account_phase_history").select("id").eq("account_id", accountId).order("changed_at", { ascending: false }).limit(1).single();
      if (data) await sb.from("account_phase_history").update({ note: note.trim().slice(0, 500) }).eq("id", (data as { id: string }).id);
    }
    updateTag(TAGS.accounts);
    return { ok: true, message: "Phase updated." };
  } catch (e) {
    return fail(e);
  }
}

export async function addTradeImages(tradeId: string, images: { url: string; kind: ImageKind; caption: string | null }[]): Promise<ActionResult> {
  try {
    const { sb } = await adminAction();
    const { count } = await sb.from("trade_images").select("id", { count: "exact", head: true }).eq("trade_id", tradeId);
    const rows = images.map((im, i) => ({ trade_id: tradeId, url: im.url, kind: im.kind, caption: im.caption, sort_order: (count ?? 0) + i }));
    const { error } = await sb.from("trade_images").insert(rows);
    if (error) return { ok: false, error: error.message };
    updateTag(TAGS.trades);
    updateTag(`trade:${tradeId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateTradeImage(id: string, tradeId: string, patch: { kind?: ImageKind; caption?: string | null }): Promise<ActionResult> {
  try {
    const { sb } = await adminAction();
    const { error } = await sb.from("trade_images").update(patch).eq("id", id);
    if (error) return { ok: false, error: error.message };
    updateTag(`trade:${tradeId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteTradeImage(id: string, tradeId: string): Promise<ActionResult> {
  try {
    const { sb } = await adminAction();
    const { error } = await sb.from("trade_images").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    updateTag(TAGS.trades);
    updateTag(`trade:${tradeId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

const closeSchema = z.object({
  exit_price: z.coerce.number().positive("Exit price must be above 0."),
  pnl: z.coerce.number({ error: "P&L must be a number." }),
  fees: z.coerce.number().min(0).default(0),
  closed_at: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Enter when it closed."),
});

/** Close an open position and record it as a trade. */
export async function closePosition(positionId: string, input: z.input<typeof closeSchema>): Promise<ActionResult<{ tradeId: string }>> {
  try {
    const parsed = closeSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
    const { sb } = await adminAction();
    const { data: pos, error } = await sb.from("open_positions").select("*").eq("id", positionId).single();
    if (error || !pos) return { ok: false, error: error?.message ?? "Position not found." };
    const p = pos as { account_id: string; symbol: string; direction: "long" | "short"; size: number; entry_price: number; stop_loss: number | null; take_profit: number | null; opened_at: string };
    const ins = await sb
      .from("trades")
      .insert({
        account_id: p.account_id,
        symbol: p.symbol,
        market: p.symbol.startsWith("XAU") || p.symbol.startsWith("XAG") ? "commodity" : "forex",
        direction: p.direction,
        size: p.size,
        entry_price: p.entry_price,
        stop_loss: p.stop_loss,
        take_profit: p.take_profit,
        opened_at: p.opened_at,
        closed_at: new Date(parsed.data.closed_at).toISOString(),
        exit_price: parsed.data.exit_price,
        pnl: parsed.data.pnl,
        fees: parsed.data.fees,
        session: sessionForTrade(new Date(p.opened_at)),
        is_public: true,
      })
      .select("id")
      .single();
    if (ins.error) return { ok: false, error: ins.error.message };
    await sb.from("open_positions").delete().eq("id", positionId);
    updateTag(TAGS.trades);
    updateTag(TAGS.positions);
    return { ok: true, data: { tradeId: (ins.data as { id: string }).id }, message: "Position closed and saved as a trade." };
  } catch (e) {
    return fail(e);
  }
}
