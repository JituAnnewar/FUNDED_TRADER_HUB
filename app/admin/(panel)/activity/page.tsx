import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/header";
import { EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { param, type SearchParams } from "@/lib/analytics/filter";
import { requireAdmin } from "@/lib/admin/auth";
import { formatDateTimeIST } from "@/lib/time";
import type { ActivityEntry } from "@/lib/types";

export const metadata: Metadata = { title: "Activity log" };
const PER = 50;

function summary(a: ActivityEntry): string {
  if (!a.diff) return "";
  if (a.action === "update") return Object.keys(a.diff).slice(0, 6).join(", ");
  const row = (a.diff.new ?? a.diff.old) as Record<string, unknown> | undefined;
  const name = row?.name ?? row?.label ?? row?.title ?? row?.symbol ?? row?.subject ?? row?.date;
  return name ? String(name) : "";
}

export default async function ActivityPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const { sb } = await requireAdmin();
  const page = Math.max(1, Number(param(sp, "page") ?? 1) || 1);
  const { data, count } = await sb
    .from("activity_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PER, page * PER - 1);
  const rows = (data ?? []) as ActivityEntry[];

  return (
    <>
      <AdminHeader title="Activity log" description="Every change made in the admin panel, newest first." />
      {rows.length ? (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] text-left text-[11px] tracking-[0.12em] text-muted uppercase">
              <tr>
                <th className="px-3 py-3 font-medium">When (IST)</th>
                <th className="px-3 py-3 font-medium">Action</th>
                <th className="px-3 py-3 font-medium">What</th>
                <th className="px-3 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-t border-line">
                  <td className="num px-3 py-2 whitespace-nowrap text-muted">{formatDateTimeIST(new Date(a.created_at))}</td>
                  <td className="px-3 py-2 capitalize">{a.action}</td>
                  <td className="px-3 py-2">{a.entity.replaceAll("_", " ")}</td>
                  <td className="max-w-md truncate px-3 py-2 text-muted">{summary(a)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No activity yet" body="Changes you make in the admin panel will be listed here." />
      )}
      <Pagination page={page} pages={Math.max(1, Math.ceil((count ?? 0) / PER))} basePath="/admin/activity" params={{}} />
    </>
  );
}
