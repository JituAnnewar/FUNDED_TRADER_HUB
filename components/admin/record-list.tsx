"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, Tag as TagIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/admin/confirm";
import { Button } from "@/components/ui/button";
import { bulkDelete, bulkUpdate, moveRecord, setVisibility } from "@/lib/admin/actions";
import { RESOURCES, type Column } from "@/lib/admin/resources";
import { formatMoney, formatPnl } from "@/lib/format";
import { formatDateIST, formatDateTimeIST } from "@/lib/time";
import { cn } from "@/lib/utils";

type Row = Record<string, unknown> & { id: string };

function cell(c: Column, row: Row, rel: Record<string, string>): React.ReactNode {
  const v = row[c.key];
  if (v === null || v === undefined || v === "") return <span className="text-muted/50">—</span>;
  switch (c.kind) {
    case "money":
      return <span className="num">{formatMoney(Number(v))}</span>;
    case "pnl": {
      const n = Number(v);
      return <span className={cn("num", n > 0 ? "text-profit" : n < 0 ? "text-loss" : "text-muted")}>{formatPnl(n)}</span>;
    }
    case "pct":
      return <span className="num">{String(v)}%</span>;
    case "date":
      return <span className="num">{formatDateIST(new Date(String(v)))}</span>;
    case "datetime":
      return <span className="num text-muted">{formatDateTimeIST(new Date(String(v)))}</span>;
    case "bool":
      return v ? <span className="text-profit">Yes</span> : <span className="text-muted">No</span>;
    case "badge":
      return <span className="rounded-md border border-line bg-white/[0.03] px-2 py-0.5 text-xs">{String(v).replaceAll("_", " ")}</span>;
    case "relation":
      return rel[String(v)] ?? <span className="text-muted">Unknown</span>;
    default: {
      const s = String(v);
      return s.length > 60 ? `${s.slice(0, 60)}…` : s;
    }
  }
}

export function RecordList({ resourceKey, rows, relationLabels }: { resourceKey: string; rows: Row[]; relationLabels: Record<string, string> }) {
  const r = RESOURCES[resourceKey]!;
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const [optimistic, applyOptimistic] = useOptimistic(rows, (state: Row[], patch: { ids: string[]; is_public: boolean }) =>
    state.map((x) => (patch.ids.includes(x.id) ? { ...x, is_public: patch.is_public } : x)),
  );
  const sortable = r.fields.some((f) => f.key === "sort_order");
  const allChecked = optimistic.length > 0 && optimistic.every((x) => selected.has(x.id));
  const ids = [...selected];

  const toggleVis = (row: Row) =>
    start(async () => {
      applyOptimistic({ ids: [row.id], is_public: !row.is_public });
      const res = await setVisibility(r.key, row.id, !row.is_public);
      if (!res.ok) toast.error(res.error);
      router.refresh();
    });

  const bulkVis = (isPublic: boolean) =>
    start(async () => {
      applyOptimistic({ ids, is_public: isPublic });
      const res = await bulkUpdate(r.key, ids, { is_public: isPublic });
      if (!res.ok) toast.error(res.error);
      else toast.success(res.message ?? "Updated.");
      setSelected(new Set());
      router.refresh();
    });

  const bulkTag = (kind: "setup" | "mistake") => {
    const tag = window.prompt(kind === "setup" ? "Setup tag to add to the selected trades" : "Mistake tag to add to the selected trades");
    if (!tag?.trim()) return;
    start(async () => {
      const res = await bulkUpdate(r.key, ids, kind === "setup" ? { addSetupTag: tag } : { addMistakeTag: tag });
      if (!res.ok) toast.error(res.error);
      else toast.success(res.message ?? "Updated.");
      setSelected(new Set());
      router.refresh();
    });
  };

  return (
    <div>
      {selected.size > 0 && (
        <div className="sticky top-14 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-accent/30 bg-elevated/95 p-2 backdrop-blur lg:top-2">
          <span className="px-2 text-sm">{selected.size} selected</span>
          {r.publishable && (
            <>
              <Button size="sm" variant="secondary" onClick={() => bulkVis(true)} disabled={pending}>
                <Eye aria-hidden="true" /> Make public
              </Button>
              <Button size="sm" variant="secondary" onClick={() => bulkVis(false)} disabled={pending}>
                <EyeOff aria-hidden="true" /> Make private
              </Button>
            </>
          )}
          {r.key === "trades" && (
            <>
              <Button size="sm" variant="secondary" onClick={() => bulkTag("setup")} disabled={pending}>
                <TagIcon aria-hidden="true" /> Add setup tag
              </Button>
              <Button size="sm" variant="secondary" onClick={() => bulkTag("mistake")} disabled={pending}>
                <TagIcon aria-hidden="true" /> Add mistake tag
              </Button>
            </>
          )}
          <ConfirmButton
            title={`Delete ${selected.size} ${r.label.toLowerCase()}?`}
            body="This cannot be undone."
            confirmLabel="Delete"
            onConfirm={async () => {
              const res = await bulkDelete(r.key, ids);
              if (!res.ok) toast.error(res.error);
              else toast.success(res.message ?? "Deleted.");
              setSelected(new Set());
              router.refresh();
            }}
          >
            <Trash2 aria-hidden="true" /> Delete
          </ConfirmButton>
          <button type="button" className="ml-auto px-2 text-sm text-muted hover:text-fg" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-line md:block">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] text-left text-[11px] tracking-[0.12em] text-muted uppercase">
            <tr>
              <th className="w-10 px-3 py-3">
                <input type="checkbox" checked={allChecked} onChange={(e) => setSelected(e.target.checked ? new Set(optimistic.map((x) => x.id)) : new Set())} aria-label="Select all on this page" className="accent-[var(--c-accent)]" />
              </th>
              {r.columns.map((c) => (
                <th key={c.key} className="px-3 py-3 font-medium">
                  {c.label}
                </th>
              ))}
              <th className="px-3 py-3" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {optimistic.map((row, i) => (
              <tr key={row.id} className={cn("border-t border-line hover:bg-white/[0.02]", selected.has(row.id) && "bg-accent/5")}>
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={(e) => {
                      const n = new Set(selected);
                      if (e.target.checked) n.add(row.id);
                      else n.delete(row.id);
                      setSelected(n);
                    }}
                    aria-label="Select row"
                    className="accent-[var(--c-accent)]"
                  />
                </td>
                {r.columns.map((c, ci) => (
                  <td key={c.key} className="px-3 py-2.5">
                    {ci === 0 ? (
                      <Link href={`/admin/r/${r.key}/${row.id}`} className="hover:text-accent">
                        {cell(c, row, relationLabels)}
                      </Link>
                    ) : c.key === "is_public" ? (
                      <button type="button" onClick={() => toggleVis(row)} className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 hover:bg-white/5" aria-label={row.is_public ? "Make private" : "Make public"}>
                        {row.is_public ? <Eye className="size-4 text-profit" aria-hidden="true" /> : <EyeOff className="size-4 text-muted" aria-hidden="true" />}
                        <span className="text-xs">{row.is_public ? "Public" : "Private"}</span>
                      </button>
                    ) : (
                      cell(c, row, relationLabels)
                    )}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  {sortable && (
                    <span className="mr-2 inline-flex gap-0.5">
                      <button type="button" disabled={i === 0 || pending} onClick={() => start(async () => { await moveRecord(r.key, row.id, "up"); router.refresh(); })} className="rounded p-1 text-muted hover:text-fg disabled:opacity-30" aria-label="Move up">
                        <ArrowUp className="size-3.5" aria-hidden="true" />
                      </button>
                      <button type="button" disabled={i === optimistic.length - 1 || pending} onClick={() => start(async () => { await moveRecord(r.key, row.id, "down"); router.refresh(); })} className="rounded p-1 text-muted hover:text-fg disabled:opacity-30" aria-label="Move down">
                        <ArrowDown className="size-3.5" aria-hidden="true" />
                      </button>
                    </span>
                  )}
                  <Link href={`/admin/r/${r.key}/${row.id}`} className="text-xs text-accent hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-2 md:hidden">
        {optimistic.map((row) => (
          <li key={row.id} className="glass flex items-center gap-3 p-3">
            <input
              type="checkbox"
              checked={selected.has(row.id)}
              onChange={(e) => {
                const n = new Set(selected);
                if (e.target.checked) n.add(row.id);
                else n.delete(row.id);
                setSelected(n);
              }}
              aria-label="Select"
              className="size-4 accent-[var(--c-accent)]"
            />
            <Link href={`/admin/r/${r.key}/${row.id}`} className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{cell(r.columns[0]!, row, relationLabels)}</p>
              <p className="truncate text-xs text-muted">
                {r.columns.slice(1, 4).map((c) => (
                  <span key={c.key} className="mr-2">
                    {cell(c, row, relationLabels)}
                  </span>
                ))}
              </p>
            </Link>
            {r.publishable && (
              <button type="button" onClick={() => toggleVis(row)} className="grid size-9 place-items-center rounded-lg border border-line" aria-label={row.is_public ? "Make private" : "Make public"}>
                {row.is_public ? <Eye className="size-4 text-profit" aria-hidden="true" /> : <EyeOff className="size-4 text-muted" aria-hidden="true" />}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
