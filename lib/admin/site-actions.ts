"use server";

import { updateTag } from "next/cache";
import { adminAction, fail, type ActionResult } from "@/lib/admin/auth";
import { loadDemoData } from "@/lib/demo/load";
import { TAGS } from "@/lib/data/tags";
import type { MessageStatus } from "@/lib/types";
import { settingsSchema, type SettingsInput } from "@/lib/validation/settings";

export async function saveSettings(input: SettingsInput): Promise<ActionResult> {
  try {
    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const i of parsed.error.issues) fe[i.path.join(".")] ??= i.message;
      return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fe };
    }
    const { sb } = await adminAction();
    const socials = Object.fromEntries(Object.entries(parsed.data.socials).filter(([, v]) => v));
    const { error } = await sb.from("site_settings").update({ ...parsed.data, socials }).eq("singleton", true);
    if (error) return { ok: false, error: error.message };
    updateTag(TAGS.settings);
    return { ok: true, message: "Settings saved." };
  } catch (e) {
    return fail(e);
  }
}

export async function setMessageStatus(id: string, status: MessageStatus): Promise<ActionResult> {
  try {
    if (!["new", "read", "replied", "archived"].includes(status)) return { ok: false, error: "Unknown status." };
    const { sb } = await adminAction();
    const { error } = await sb.from("contact_messages").update({ status }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  try {
    const { sb } = await adminAction();
    const { error } = await sb.from("contact_messages").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: "Message deleted." };
  } catch (e) {
    return fail(e);
  }
}

function refreshAll() {
  for (const t of Object.values(TAGS)) updateTag(t);
}

export async function removeDemoData(): Promise<ActionResult> {
  try {
    const { sb } = await adminAction();
    const { error } = await sb.rpc("remove_demo_data");
    if (error) return { ok: false, error: error.message };
    refreshAll();
    return { ok: true, message: "All demo data removed. The demo banner is gone." };
  } catch (e) {
    return fail(e);
  }
}

export async function loadDemo(): Promise<ActionResult> {
  try {
    const { sb } = await adminAction();
    const { count } = await sb.from("firms").select("id", { count: "exact", head: true }).eq("is_demo", true);
    if ((count ?? 0) > 0) return { ok: false, error: "Demo data is already loaded. Remove it first to reload." };
    const { inserted } = await loadDemoData(sb);
    refreshAll();
    return { ok: true, message: `Loaded ${inserted} demo rows.` };
  } catch (e) {
    return fail(e);
  }
}
