"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminAction, fail, type ActionResult } from "@/lib/admin/auth";
import { TAGS } from "@/lib/data/tags";

const eodRowSchema = z.object({
  account_id: z.uuid(),
  balance: z.coerce.number({ error: "Balance must be a number." }).min(0),
  equity: z.coerce.number({ error: "Equity must be a number." }).min(0),
  day_pnl: z.coerce.number({ error: "Day P&L must be a number." }),
  note: z.string().max(500).nullable().optional(),
});

const eodSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rows: z.array(eodRowSchema).min(1).max(100),
});

export async function saveEod(input: z.input<typeof eodSchema>): Promise<ActionResult<{ count: number }>> {
  try {
    const parsed = eodSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the values." };
    const { sb } = await adminAction();
    const { date, rows } = parsed.data;
    const snaps = rows.map((r) => ({ account_id: r.account_id, date, balance: r.balance, equity: r.equity, day_pnl: r.day_pnl, note: r.note || null }));
    const up = await sb.from("account_snapshots").upsert(snaps, { onConflict: "account_id,date" });
    if (up.error) return { ok: false, error: up.error.message };

    const { data: accs, error } = await sb.from("accounts").select("id,high_water_mark").in("id", rows.map((r) => r.account_id));
    if (error) return { ok: false, error: error.message };
    const hwm = new Map(((accs ?? []) as { id: string; high_water_mark: number }[]).map((a) => [a.id, a.high_water_mark]));
    for (const r of rows) {
      const res = await sb
        .from("accounts")
        .update({ current_balance: r.balance, current_equity: r.equity, high_water_mark: Math.max(hwm.get(r.account_id) ?? 0, r.balance, r.equity) })
        .eq("id", r.account_id);
      if (res.error) return { ok: false, error: res.error.message };
    }
    updateTag(TAGS.snapshots);
    updateTag(TAGS.accounts);
    return { ok: true, data: { count: rows.length }, message: `Saved ${rows.length} account${rows.length === 1 ? "" : "s"}.` };
  } catch (e) {
    return fail(e);
  }
}
