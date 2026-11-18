"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminAction, fail, type ActionResult } from "@/lib/admin/auth";
import { TAGS } from "@/lib/data/tags";
import { incomingTradeSchema, insertTrades } from "@/lib/import/server";

export async function importTrades(input: {
  accountId: string;
  strategyId: string | null;
  isPublic: boolean;
  rows: unknown[];
}): Promise<ActionResult<{ inserted: number; duplicates: number; invalid: number }>> {
  try {
    if (!z.uuid().safeParse(input.accountId).success) return { ok: false, error: "Choose an account." };
    if (!Array.isArray(input.rows) || input.rows.length === 0) return { ok: false, error: "No rows to import." };
    if (input.rows.length > 5000) return { ok: false, error: "Import at most 5,000 rows at a time." };
    const valid = [];
    let invalid = 0;
    for (const r of input.rows) {
      const p = incomingTradeSchema.safeParse(r);
      if (p.success) valid.push(p.data);
      else invalid++;
    }
    const { sb } = await adminAction();
    const res = await insertTrades(sb, input.accountId, valid, { is_public: input.isPublic, strategy_id: input.strategyId });
    updateTag(TAGS.trades);
    updateTag(TAGS.accounts);
    return {
      ok: true,
      data: { ...res, invalid },
      message: `Imported ${res.inserted} trade${res.inserted === 1 ? "" : "s"}. ${res.duplicates} duplicate${res.duplicates === 1 ? "" : "s"} skipped.`,
    };
  } catch (e) {
    return fail(e);
  }
}

const presetSchema = z.object({ name: z.string().trim().min(1).max(40), mapping: z.record(z.string(), z.string()), offsetMinutes: z.number().int().min(-720).max(840) });

export async function saveImportPreset(input: z.input<typeof presetSchema>): Promise<ActionResult> {
  try {
    const p = presetSchema.safeParse(input);
    if (!p.success) return { ok: false, error: "Give the preset a name." };
    const { sb } = await adminAction();
    const { data } = await sb.from("site_settings").select("import_presets").eq("singleton", true).single();
    const list = ((data as { import_presets: z.infer<typeof presetSchema>[] } | null)?.import_presets ?? []).filter((x) => x.name !== p.data.name);
    const { error } = await sb.from("site_settings").update({ import_presets: [...list, p.data].slice(-20) }).eq("singleton", true);
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: "Preset saved." };
  } catch (e) {
    return fail(e);
  }
}
