import Papa from "papaparse";
import { NextResponse, type NextRequest } from "next/server";
import { sessionClient } from "@/lib/supabase/clients";

const EXPORT_TABLES = [
  "firms",
  "accounts",
  "account_phase_history",
  "account_snapshots",
  "open_positions",
  "strategies",
  "trades",
  "trade_images",
  "payouts",
  "journal_entries",
  "toolkit_items",
  "goals",
  "posts",
  "milestones",
  "contact_messages",
  "site_settings",
  "activity_log",
] as const;

/** Admin-only export. ?format=json (all tables) or ?format=csv&table=<name>. */
export async function GET(request: NextRequest) {
  const sb = await sessionClient();
  if (!sb) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const { data: isAdmin } = await sb.rpc("is_admin");
  if (isAdmin !== true) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const format = request.nextUrl.searchParams.get("format") ?? "json";
  const stamp = new Date().toISOString().slice(0, 10);

  async function all(table: string) {
    const rows: Record<string, unknown>[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await sb!.from(table).select("*").range(from, from + 999);
      if (error) throw new Error(`${table}: ${error.message}`);
      rows.push(...((data ?? []) as Record<string, unknown>[]));
      if ((data ?? []).length < 1000) break;
    }
    return rows;
  }

  try {
    if (format === "csv") {
      const table = request.nextUrl.searchParams.get("table") ?? "";
      if (!(EXPORT_TABLES as readonly string[]).includes(table)) return NextResponse.json({ error: "Unknown table" }, { status: 400 });
      const rows = await all(table);
      const csv = Papa.unparse(rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v !== null && typeof v === "object" ? JSON.stringify(v) : v]))));
      return new NextResponse(csv, {
        headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${table}-${stamp}.csv"`, "cache-control": "no-store" },
      });
    }
    const out: Record<string, unknown> = { exported_at: new Date().toISOString() };
    for (const t of EXPORT_TABLES) out[t] = await all(t);
    return new NextResponse(JSON.stringify(out, null, 2), {
      headers: { "content-type": "application/json", "content-disposition": `attachment; filename="backup-${stamp}.json"`, "cache-control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Export failed" }, { status: 500 });
  }
}
