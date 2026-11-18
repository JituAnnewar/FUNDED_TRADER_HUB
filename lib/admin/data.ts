import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RelationOption } from "@/components/admin/record-form";
import type { Resource } from "@/lib/admin/resources";
import { formatMoney } from "@/lib/format";
import type { Account, Firm, Strategy } from "@/lib/types";

export async function loadRelations(sb: SupabaseClient) {
  const [f, a, s] = await Promise.all([
    sb.from("firms").select("*").order("sort_order").order("name"),
    sb.from("accounts").select("id,label,firm_id,account_size,phase,sort_order").order("sort_order"),
    sb.from("strategies").select("id,name").order("sort_order"),
  ]);
  const firms = (f.data ?? []) as Firm[];
  const accounts = (a.data ?? []) as Pick<Account, "id" | "label" | "firm_id" | "account_size" | "phase">[];
  const strategies = (s.data ?? []) as Pick<Strategy, "id" | "name">[];
  const firmName = new Map(firms.map((x) => [x.id, x.name]));
  const options: Record<"firms" | "accounts" | "strategies", RelationOption[]> = {
    firms: firms.map((x) => ({ value: x.id, label: x.name, extra: { ...x } })),
    accounts: accounts.map((x) => ({
      value: x.id,
      label: `${firmName.get(x.firm_id) ?? ""} ${formatMoney(x.account_size, { compact: true })} ${x.label}`.trim(),
      extra: { phase: x.phase },
    })),
    strategies: strategies.map((x) => ({ value: x.id, label: x.name })),
  };
  return options;
}

export interface ListQuery {
  q?: string;
  page: number;
  perPage: number;
  visibility?: "public" | "private";
  filterKey?: string;
  filterValue?: string;
}

export async function listRecords(sb: SupabaseClient, r: Resource, query: ListQuery) {
  let q = sb.from(r.table).select("*", { count: "exact" });
  if (query.q && r.search.length) {
    const term = query.q.replace(/[%,()]/g, " ").trim();
    if (term) q = q.or(r.search.map((k) => `${k}.ilike.%${term}%`).join(","));
  }
  if (query.visibility && r.publishable) q = q.eq("is_public", query.visibility === "public");
  if (query.filterKey && query.filterValue) q = q.eq(query.filterKey, query.filterValue);
  q = q.order(r.sort.key, { ascending: r.sort.ascending, nullsFirst: false }).order("created_at", { ascending: false });
  const from = (query.page - 1) * query.perPage;
  const { data, count, error } = await q.range(from, from + query.perPage - 1);
  return { rows: (data ?? []) as Record<string, unknown>[], count: count ?? 0, error: error?.message ?? null };
}
