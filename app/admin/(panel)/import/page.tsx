import type { Metadata } from "next";
import { CsvImport, type SavedPreset } from "@/components/admin/csv-import";
import { AdminHeader } from "@/components/admin/header";
import { EmptyState } from "@/components/ui/misc";
import { requireAdmin } from "@/lib/admin/auth";
import { loadRelations } from "@/lib/admin/data";

export const metadata: Metadata = { title: "CSV import" };

export default async function ImportPage() {
  const { sb } = await requireAdmin();
  const [relations, settings] = await Promise.all([loadRelations(sb), sb.from("site_settings").select("import_presets").eq("singleton", true).maybeSingle()]);
  const saved = ((settings.data as { import_presets?: SavedPreset[] } | null)?.import_presets ?? []) as SavedPreset[];
  return (
    <div className="mx-auto max-w-5xl">
      <AdminHeader title="CSV import" description="Export your trade history from MT4/MT5, cTrader, Tradovate, NinjaTrader or TradingView, then upload it here. Nothing is saved until you press Import." />
      {relations.accounts.length ? (
        <CsvImport accounts={relations.accounts} strategies={relations.strategies} saved={saved} />
      ) : (
        <EmptyState title="Add an account first" body="Trades are imported into one account at a time." action={{ href: "/admin/r/accounts/new", label: "New account" }} />
      )}
    </div>
  );
}
