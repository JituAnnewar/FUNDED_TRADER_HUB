"use server";

import { updateTag } from "next/cache";
import { adminAction, fail, type ActionResult } from "@/lib/admin/auth";
import { getResource, resourceSchema, type Resource } from "@/lib/admin/resources";
import { TAGS, type Tag } from "@/lib/data/tags";
import { sessionForTrade } from "@/lib/sessions";

function refresh(tags: readonly Tag[]) {
  for (const t of new Set<Tag>([...tags, TAGS.demo])) updateTag(t);
}

function normalize(r: Resource, v: Record<string, unknown>, isNew: boolean): Record<string, unknown> {
  const out = { ...v };
  if (r.key === "accounts") {
    if (typeof out.masked_account_id === "string") out.masked_account_id = out.masked_account_id.slice(-4) || null;
    const size = Number(out.account_size);
    if (isNew || out.starting_balance === null) out.starting_balance ??= size;
    out.current_balance ??= out.starting_balance;
    out.current_equity ??= out.current_balance;
    out.high_water_mark ??= Math.max(Number(out.current_balance), Number(out.current_equity), Number(out.starting_balance));
  }
  if (r.key === "trades" && typeof out.opened_at === "string") {
    out.session = sessionForTrade(new Date(out.opened_at));
    out.symbol = String(out.symbol).toUpperCase();
  }
  if (r.key === "positions" && typeof out.symbol === "string") out.symbol = out.symbol.toUpperCase();
  return out;
}

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const fe: Record<string, string> = {};
  for (const i of issues) {
    const k = String(i.path[0] ?? "");
    fe[k] ??= i.message;
  }
  return fe;
}

export async function saveRecord(resourceKey: string, id: string | null, values: Record<string, unknown>): Promise<ActionResult<{ id: string }>> {
  try {
    const r = getResource(resourceKey);
    if (!r) return { ok: false, error: "Unknown section." };
    const parsed = resourceSchema(r).safeParse(values);
    if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error.issues) };
    const { sb } = await adminAction();
    const row = normalize(r, parsed.data as Record<string, unknown>, id === null);
    const q = id ? sb.from(r.table).update(row).eq("id", id).select("id").single() : sb.from(r.table).insert(row).select("id").single();
    const { data, error } = await q;
    if (error) {
      if (error.code === "23505") return { ok: false, error: "That already exists (a unique field is taken, such as the slug, date or ticket ID)." };
      return { ok: false, error: error.message };
    }
    refresh(r.tags);
    return { ok: true, data: { id: (data as { id: string }).id }, message: `${r.singular[0]!.toUpperCase()}${r.singular.slice(1)} saved.` };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteRecord(resourceKey: string, id: string): Promise<ActionResult> {
  try {
    const r = getResource(resourceKey);
    if (!r) return { ok: false, error: "Unknown section." };
    const { sb } = await adminAction();
    const { error } = await sb.from(r.table).delete().eq("id", id);
    if (error) {
      if (error.code === "23503") return { ok: false, error: "This is still used elsewhere (for example a firm with accounts). Remove those first." };
      return { ok: false, error: error.message };
    }
    refresh(r.tags);
    return { ok: true, message: "Deleted." };
  } catch (e) {
    return fail(e);
  }
}

export async function bulkUpdate(
  resourceKey: string,
  ids: string[],
  patch: { is_public?: boolean; addSetupTag?: string; addMistakeTag?: string },
): Promise<ActionResult<{ count: number }>> {
  try {
    const r = getResource(resourceKey);
    if (!r || !ids.length || ids.length > 500) return { ok: false, error: "Nothing to update." };
    const { sb } = await adminAction();
    if (patch.is_public !== undefined && r.publishable) {
      const { error } = await sb.from(r.table).update({ is_public: patch.is_public }).in("id", ids);
      if (error) return { ok: false, error: error.message };
    }
    if (r.key === "trades" && (patch.addSetupTag || patch.addMistakeTag)) {
      const { data, error } = await sb.from("trades").select("id,setup_tags,mistake_tags").in("id", ids);
      if (error) return { ok: false, error: error.message };
      for (const t of (data ?? []) as { id: string; setup_tags: string[]; mistake_tags: string[] }[]) {
        const upd: Record<string, string[]> = {};
        if (patch.addSetupTag) upd.setup_tags = [...new Set([...t.setup_tags, patch.addSetupTag.trim()])];
        if (patch.addMistakeTag) upd.mistake_tags = [...new Set([...t.mistake_tags, patch.addMistakeTag.trim()])];
        const res = await sb.from("trades").update(upd).eq("id", t.id);
        if (res.error) return { ok: false, error: res.error.message };
      }
    }
    refresh(r.tags);
    return { ok: true, data: { count: ids.length }, message: `Updated ${ids.length}.` };
  } catch (e) {
    return fail(e);
  }
}

export async function bulkDelete(resourceKey: string, ids: string[]): Promise<ActionResult> {
  try {
    const r = getResource(resourceKey);
    if (!r || !ids.length || ids.length > 500) return { ok: false, error: "Nothing to delete." };
    const { sb } = await adminAction();
    const { error } = await sb.from(r.table).delete().in("id", ids);
    if (error) return { ok: false, error: error.code === "23503" ? "Some items are still used elsewhere." : error.message };
    refresh(r.tags);
    return { ok: true, message: `Deleted ${ids.length}.` };
  } catch (e) {
    return fail(e);
  }
}

export async function setVisibility(resourceKey: string, id: string, isPublic: boolean): Promise<ActionResult<{ count: number }>> {
  return bulkUpdate(resourceKey, [id], { is_public: isPublic });
}

export async function duplicateRecord(resourceKey: string, id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const r = getResource(resourceKey);
    if (!r) return { ok: false, error: "Unknown section." };
    const { sb } = await adminAction();
    const { data, error } = await sb.from(r.table).select("*").eq("id", id).single();
    if (error || !data) return { ok: false, error: error?.message ?? "Not found." };
    const row = { ...(data as Record<string, unknown>) };
    for (const k of ["id", "created_at", "updated_at", "net_pnl", "r_multiple"]) delete row[k];
    if ("external_ticket_id" in row) row.external_ticket_id = null;
    if ("slug" in row) row.slug = `${String(row.slug)}-copy-${Date.now().toString(36)}`;
    if ("date" in row && r.key === "journal") return { ok: false, error: "Journal entries are one per day and cannot be duplicated." };
    row.is_demo = false;
    const ins = await sb.from(r.table).insert(row).select("id").single();
    if (ins.error) return { ok: false, error: ins.error.message };
    refresh(r.tags);
    return { ok: true, data: { id: (ins.data as { id: string }).id }, message: "Duplicated." };
  } catch (e) {
    return fail(e);
  }
}

export async function moveRecord(resourceKey: string, id: string, dir: "up" | "down"): Promise<ActionResult> {
  try {
    const r = getResource(resourceKey);
    if (!r || !r.fields.some((f) => f.key === "sort_order")) return { ok: false, error: "This list cannot be reordered." };
    const { sb } = await adminAction();
    const { data, error } = await sb.from(r.table).select("id,sort_order").order("sort_order").order("created_at");
    if (error) return { ok: false, error: error.message };
    const list = (data ?? []) as { id: string; sort_order: number }[];
    const i = list.findIndex((x) => x.id === id);
    const j = dir === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= list.length) return { ok: true };
    [list[i], list[j]] = [list[j]!, list[i]!];
    for (let k = 0; k < list.length; k++) {
      if (list[k]!.sort_order !== k) {
        const u = await sb.from(r.table).update({ sort_order: k }).eq("id", list[k]!.id);
        if (u.error) return { ok: false, error: u.error.message };
      }
    }
    refresh(r.tags);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
