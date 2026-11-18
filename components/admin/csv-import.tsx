"use client";

import { FileUp, Loader2, Save, Upload } from "lucide-react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { inputCls, Toggle } from "@/components/admin/fields";
import type { RelationOption } from "@/components/admin/record-form";
import { Button } from "@/components/ui/button";
import { importTrades, saveImportPreset } from "@/lib/admin/import-actions";
import { autoMap, normalizeRows, PRESETS, TARGET_FIELDS, TIMEZONE_OPTIONS, type Mapping, type TargetKey } from "@/lib/import/csv";
import { formatPnl } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface SavedPreset {
  name: string;
  mapping: Record<string, string>;
  offsetMinutes: number;
}

export function CsvImport({ accounts, strategies, saved }: { accounts: RelationOption[]; strategies: RelationOption[]; saved: SavedPreset[] }) {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [raw, setRaw] = useState<Record<string, string>[]>([]);
  const [presetId, setPresetId] = useState("mt");
  const [mapping, setMapping] = useState<Mapping>({});
  const [offset, setOffset] = useState(120);
  const [account, setAccount] = useState(accounts[0]?.value ?? "");
  const [strategy, setStrategy] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [presetName, setPresetName] = useState("");
  const [pending, start] = useTransition();

  const preset = PRESETS.find((p) => p.id === presetId);
  const results = useMemo(() => (raw.length ? normalizeRows(raw, mapping, { offsetMinutes: offset, mode: preset?.mode }) : []), [raw, mapping, offset, preset]);
  const ok = results.filter((r) => r.status === "ok");
  const errors = results.filter((r) => r.status === "error");
  const skipped = results.filter((r) => r.status === "skipped");

  function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return void toast.error("That file is over 10 MB.");
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h, i) => h.trim() || `Column ${i + 1}`,
      complete: (res) => {
        const hs = res.meta.fields ?? [];
        setHeaders(hs);
        setRaw(res.data);
        setMapping(autoMap(hs, preset ?? PRESETS[0]!));
        if (!res.data.length) toast.error("No rows found in that file.");
      },
      error: (err) => toast.error(err.message),
    });
  }

  function choosePreset(id: string) {
    const savedP = saved.find((s) => `saved:${s.name}` === id);
    if (savedP) {
      setPresetId("generic");
      setMapping(savedP.mapping as Mapping);
      setOffset(savedP.offsetMinutes);
      return;
    }
    setPresetId(id);
    const p = PRESETS.find((x) => x.id === id);
    if (p && headers.length) setMapping(autoMap(headers, p));
    if (id === "mt") setOffset(120);
    else setOffset(0);
  }

  function runImport() {
    start(async () => {
      const res = await importTrades({ accountId: account, strategyId: strategy || null, isPublic, rows: ok.map((r) => r.row) });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Imported.");
      setRaw([]);
      setFileName(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5 pb-10">
      <section className="glass p-4 sm:p-6">
        <h2 className="mb-3 text-xs font-medium tracking-[0.16em] text-muted uppercase">1. File and format</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line bg-surface p-3 hover:border-accent sm:col-span-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFile(e.dataTransfer.files[0]);
            }}
          >
            <FileUp className="size-6 text-accent" aria-hidden="true" />
            <span className="text-sm">{fileName ?? "Choose or drop a CSV export from your platform"}</span>
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted">Platform preset</span>
            <select value={presetId} onChange={(e) => choosePreset(e.target.value)} className={inputCls}>
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
              {saved.map((s) => (
                <option key={s.name} value={`saved:${s.name}`}>
                  Saved: {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted">Times in the file are in</span>
            <select value={offset} onChange={(e) => setOffset(Number(e.target.value))} className={inputCls}>
              {TIMEZONE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted">Import into account</span>
            <select value={account} onChange={(e) => setAccount(e.target.value)} className={inputCls}>
              {accounts.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {headers.length > 0 && (
        <section className="glass p-4 sm:p-6">
          <h2 className="mb-3 text-xs font-medium tracking-[0.16em] text-muted uppercase">2. Match the columns</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TARGET_FIELDS.map((f) => (
              <label key={f.key} className="block text-sm">
                <span className="mb-1.5 block text-muted">
                  {f.label}
                  {"required" in f && f.required && <span className="text-loss"> *</span>}
                </span>
                <select value={mapping[f.key as TargetKey] ?? ""} onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value || undefined })} className={inputCls}>
                  <option value="">Not in file</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <label className="block text-sm">
              <span className="mb-1.5 block text-muted">Save this mapping as</span>
              <input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="e.g. My MT5 broker" className={`${inputCls} w-56`} />
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!presetName.trim()}
              onClick={() =>
                start(async () => {
                  const res = await saveImportPreset({ name: presetName, mapping: mapping as Record<string, string>, offsetMinutes: offset });
                  if (!res.ok) {
                    toast.error(res.error);
                    return;
                  }
                  toast.success(res.message ?? "Saved.");
                  router.refresh();
                })
              }
            >
              <Save aria-hidden="true" /> Save preset
            </Button>
          </div>
        </section>
      )}

      {results.length > 0 && (
        <section className="glass p-4 sm:p-6">
          <h2 className="mb-3 text-xs font-medium tracking-[0.16em] text-muted uppercase">3. Check and import</h2>
          <p className="mb-3 text-sm">
            <span className="text-profit">{ok.length} ready</span> · <span className={errors.length ? "text-loss" : "text-muted"}>{errors.length} with errors</span> · <span className="text-muted">{skipped.length} skipped</span>
            <span className="text-muted"> · duplicates already in this account are skipped automatically</span>
          </p>
          <div className="max-h-96 overflow-auto rounded-xl border border-line">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface text-left text-muted">
                <tr>
                  <th className="px-2 py-2">Line</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Symbol</th>
                  <th className="px-2 py-2">Side</th>
                  <th className="px-2 py-2">Opened (UTC)</th>
                  <th className="px-2 py-2 text-right">P&amp;L</th>
                  <th className="px-2 py-2">Problem</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 300).map((r) => (
                  <tr key={r.line} className={cn("border-t border-line", r.status === "error" && "bg-loss/5")}>
                    <td className="num px-2 py-1.5 text-muted">{r.line}</td>
                    <td className={cn("px-2 py-1.5", r.status === "ok" ? "text-profit" : r.status === "error" ? "text-loss" : "text-muted")}>{r.status}</td>
                    <td className="px-2 py-1.5">{r.row?.symbol ?? ""}</td>
                    <td className="px-2 py-1.5">{r.row?.direction ?? ""}</td>
                    <td className="num px-2 py-1.5">{r.row?.opened_at.slice(0, 16).replace("T", " ") ?? ""}</td>
                    <td className="num px-2 py-1.5 text-right">{r.row ? formatPnl(r.row.pnl - r.row.fees) : ""}</td>
                    <td className="px-2 py-1.5 text-loss">{r.errors.join(" ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <select value={strategy} onChange={(e) => setStrategy(e.target.value)} className={inputCls} aria-label="Strategy for imported trades">
              <option value="">No strategy</option>
              {strategies.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <Toggle id="imp-public" checked={isPublic} onChange={setIsPublic} label="Make imported trades public" />
          </div>
          <Button type="button" className="mt-4" size="lg" onClick={runImport} disabled={pending || !ok.length || !account}>
            {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Upload aria-hidden="true" />} Import {ok.length} trade{ok.length === 1 ? "" : "s"}
          </Button>
        </section>
      )}
    </div>
  );
}
