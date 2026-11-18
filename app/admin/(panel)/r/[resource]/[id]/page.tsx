import Link from "next/link";
import { notFound } from "next/navigation";
import { ClosePosition, PhaseMover, TradeImages } from "@/components/admin/extras";
import { AdminHeader } from "@/components/admin/header";
import { RecordForm } from "@/components/admin/record-form";
import { requireAdmin } from "@/lib/admin/auth";
import { loadRelations } from "@/lib/admin/data";
import { getResource } from "@/lib/admin/resources";
import type { AccountPhase, PhaseHistory, TradeImage } from "@/lib/types";

export default async function ResourceEditPage({ params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await params;
  const r = getResource(resource);
  if (!r) notFound();
  const { sb } = await requireAdmin();
  const isNew = id === "new";
  if (!isNew && !/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [rowRes, relations] = await Promise.all([isNew ? Promise.resolve({ data: null }) : sb.from(r.table).select("*").eq("id", id).maybeSingle(), loadRelations(sb)]);
  const row = (rowRes.data ?? null) as Record<string, unknown> | null;
  if (!isNew && !row) notFound();

  let history: PhaseHistory[] = [];
  let images: TradeImage[] = [];
  if (row && r.key === "accounts") {
    const { data } = await sb.from("account_phase_history").select("*").eq("account_id", id).order("changed_at");
    history = (data ?? []) as PhaseHistory[];
  }
  if (row && r.key === "trades") {
    const { data } = await sb.from("trade_images").select("*").eq("trade_id", id).order("sort_order");
    images = (data ?? []) as TradeImage[];
  }

  const title = isNew ? `New ${r.singular}` : `Edit ${r.singular}: ${String(row?.[r.titleKey] ?? "")}`;
  const publicHref = row && r.key === "trades" ? `/journal/${id}` : row && r.key === "accounts" ? `/accounts/${id}` : row && r.key === "strategies" ? `/strategies/${String(row.slug)}` : row && r.key === "posts" ? `/insights/${String(row.slug)}` : null;

  return (
    <div className="mx-auto max-w-4xl">
      <AdminHeader
        title={title}
        back={{ href: `/admin/r/${r.key}`, label: r.label }}
        action={
          publicHref ? (
            <Link href={publicHref} target="_blank" className="text-sm text-accent hover:underline">
              View public page ↗
            </Link>
          ) : undefined
        }
      />
      {r.key === "accounts" && isNew && <p className="mb-4 text-sm text-muted">Choose the firm first: its rules show as hints in the override fields. Balances default to the account size.</p>}
      <RecordForm key={id} resourceKey={r.key} row={row} relations={relations}>
        {row && r.key === "accounts" && <PhaseMover accountId={id} phase={row.phase as AccountPhase} history={history} />}
        {row && r.key === "trades" && <TradeImages tradeId={id} images={images} />}
        {row && r.key === "positions" && <ClosePosition positionId={id} />}
      </RecordForm>
    </div>
  );
}
