import { Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/header";
import { RecordList } from "@/components/admin/record-list";
import { SearchBox } from "@/components/journal/search-box";
import { PerformanceFilters } from "@/components/performance/filters";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { param, type SearchParams } from "@/lib/analytics/filter";
import { requireAdmin } from "@/lib/admin/auth";
import { listRecords, loadRelations } from "@/lib/admin/data";
import { getResource } from "@/lib/admin/resources";

const PER_PAGE = 30;

export default async function ResourceListPage({ params, searchParams }: { params: Promise<{ resource: string }>; searchParams: Promise<SearchParams> }) {
  const [{ resource }, sp] = await Promise.all([params, searchParams]);
  const r = getResource(resource);
  if (!r) notFound();
  const { sb } = await requireAdmin();
  const page = Math.max(1, Number(param(sp, "page") ?? 1) || 1);
  const visibility = param(sp, "visibility") as "public" | "private" | undefined;
  const relCol = r.columns.find((c) => c.kind === "relation");
  const filterValue = relCol ? param(sp, relCol.key) : undefined;
  const [{ rows, count, error }, relations] = await Promise.all([
    listRecords(sb, r, { q: param(sp, "q"), page, perPage: PER_PAGE, visibility, filterKey: relCol?.key, filterValue }),
    loadRelations(sb),
  ]);
  const relationLabels: Record<string, string> = Object.fromEntries([...relations.firms, ...relations.accounts, ...relations.strategies].map((o) => [o.value, o.label]));
  const flat = Object.fromEntries(Object.keys(sp).map((k) => [k, param(sp, k)]));

  return (
    <>
      <AdminHeader
        title={r.label}
        description={`${count} total`}
        action={
          <div className="flex gap-2">
            {r.key === "trades" && (
              <Button asChild variant="secondary" size="sm">
                <Link href="/admin/trades/quick">Quick add</Link>
              </Button>
            )}
            <Button asChild size="sm">
              <Link href={`/admin/r/${r.key}/new`}>
                <Plus aria-hidden="true" /> New {r.singular}
              </Link>
            </Button>
          </div>
        }
      />
      <div className="mb-4 flex flex-col gap-3">
        <SearchBox placeholder={`Search ${r.label.toLowerCase()}`} />
        <PerformanceFilters
          showRange={false}
          filters={[
            ...(r.publishable ? [{ key: "visibility", label: "Visibility", options: [{ value: "public", label: "Public" }, { value: "private", label: "Private" }] }] : []),
            ...(relCol?.relation ? [{ key: relCol.key, label: relCol.label === "Firm" ? "Firms" : "Accounts", options: relations[relCol.relation] }] : []),
          ]}
        />
      </div>
      {error && <p className="mb-3 rounded-lg border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">{error}</p>}
      {rows.length ? (
        <RecordList resourceKey={r.key} rows={rows as (Record<string, unknown> & { id: string })[]} relationLabels={relationLabels} />
      ) : (
        <EmptyState title={`No ${r.label.toLowerCase()} yet`} body={param(sp, "q") ? "Nothing matches that search." : `Add your first ${r.singular} to get started.`} action={{ href: `/admin/r/${r.key}/new`, label: `New ${r.singular}` }} />
      )}
      <Pagination page={page} pages={Math.max(1, Math.ceil(count / PER_PAGE))} basePath={`/admin/r/${r.key}`} params={flat} />
    </>
  );
}
