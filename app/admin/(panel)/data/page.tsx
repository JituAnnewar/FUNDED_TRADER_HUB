import { Download } from "lucide-react";
import type { Metadata } from "next";
import { DemoDataControls } from "@/components/admin/data-actions";
import { AdminHeader } from "@/components/admin/header";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Data & backups" };

const CSV_TABLES = ["trades", "accounts", "account_snapshots", "payouts", "journal_entries", "firms", "strategies", "contact_messages"];

export default async function DataPage() {
  const { sb } = await requireAdmin();
  const { data: hasDemo } = await sb.rpc("site_has_demo_data");

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <AdminHeader title="Data & backups" />
      <GlassPanel className="p-5 sm:p-6">
        <h2 className="mb-1 font-semibold">Full backup</h2>
        <p className="mb-4 text-sm text-muted">Downloads every table as one JSON file. Keep a copy somewhere safe once a month.</p>
        <Button asChild>
          <a href="/api/admin/export?format=json" download>
            <Download aria-hidden="true" /> Download backup (JSON)
          </a>
        </Button>
      </GlassPanel>
      <GlassPanel className="p-5 sm:p-6">
        <h2 className="mb-1 font-semibold">Spreadsheets</h2>
        <p className="mb-4 text-sm text-muted">One CSV file per table, ready for Excel or Google Sheets.</p>
        <div className="flex flex-wrap gap-2">
          {CSV_TABLES.map((t) => (
            <Button key={t} asChild variant="secondary" size="sm">
              <a href={`/api/admin/export?format=csv&table=${t}`} download>
                {t.replaceAll("_", " ")}.csv
              </a>
            </Button>
          ))}
        </div>
      </GlassPanel>
      <GlassPanel className="p-5 sm:p-6">
        <h2 className="mb-1 font-semibold">Demo data</h2>
        <p className="mb-4 text-sm text-muted">{hasDemo ? "Demo rows are loaded and a Demo banner is showing on the public site." : "No demo data is loaded."}</p>
        <DemoDataControls hasDemo={hasDemo === true} />
      </GlassPanel>
    </div>
  );
}
