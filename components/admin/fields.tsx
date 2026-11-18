"use client";

import { FileText, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Markdown } from "@/components/ui/markdown";
import { uploadFile, type Bucket } from "@/lib/admin/upload";
import { cn } from "@/lib/utils";

export const inputCls =
  "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-fg outline-none transition-colors placeholder:text-muted/50 focus-visible:border-accent aria-[invalid=true]:border-loss [&>option]:bg-surface";

export function FieldShell({ id, label, help, error, children, className }: { id: string; label: string; help?: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm">
        {label}
      </label>
      {children}
      {help && !error && <p className="mt-1 text-xs text-muted">{help}</p>}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-xs text-loss" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Toggle({ id, checked, onChange, label }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2.5">
      <span className="text-sm">{label}</span>
      <span className="relative">
        <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="block h-6 w-11 rounded-full bg-white/10 transition-colors peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-accent" />
        <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function TagsInput({ id, value, onChange, placeholder }: { id: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) onChange([...new Set([...value, ...parts])]);
    setDraft("");
  };
  return (
    <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-line bg-surface px-2 py-1.5 focus-within:border-accent">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-xs text-accent">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
            <X className="size-3" aria-hidden="true" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => draft && add(draft)}
        placeholder={value.length ? "" : (placeholder ?? "Type and press Enter")}
        className="min-w-24 flex-1 bg-transparent px-1 text-sm outline-none"
      />
    </div>
  );
}

export function MarkdownInput({ id, value, onChange, invalid }: { id: string; value: string; onChange: (v: string) => void; invalid?: boolean }) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface focus-within:border-accent">
      <div className="flex gap-1 border-b border-line p-1 text-xs">
        {(["write", "preview"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} aria-pressed={tab === t} className={cn("rounded-md px-2.5 py-1", tab === t ? "bg-white/10 text-fg" : "text-muted")}>
            {t === "write" ? "Write" : "Preview"}
          </button>
        ))}
        <span className="ml-auto self-center pr-2 text-muted/70">Markdown</span>
      </div>
      {tab === "write" ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={8} aria-invalid={invalid} className="block w-full resize-y bg-transparent p-3 font-mono text-[13px] leading-6 outline-none" />
      ) : (
        <div className="min-h-40 p-4">{value.trim() ? <Markdown className="text-sm">{value}</Markdown> : <p className="text-sm text-muted">Nothing to preview.</p>}</div>
      )}
    </div>
  );
}

export function ChecklistInput({ value, onChange }: { value: { text: string }[]; onChange: (v: { text: string }[]) => void }) {
  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={item.text}
            onChange={(e) => onChange(value.map((x, j) => (j === i ? { text: e.target.value } : x)))}
            className={inputCls}
            aria-label={`Checklist item ${i + 1}`}
          />
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="grid size-11 shrink-0 place-items-center rounded-xl border border-line text-muted hover:text-loss" aria-label={`Remove item ${i + 1}`}>
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { text: "" }])} className="inline-flex items-center gap-1.5 text-sm text-accent">
        <Plus className="size-4" aria-hidden="true" /> Add item
      </button>
    </div>
  );
}

/** Image or file uploader with drag-drop and paste. */
export function UploadInput({
  id,
  bucket,
  value,
  onChange,
  accept = "image/*",
  onThumb,
}: {
  id: string;
  bucket: Bucket;
  value: string | null;
  onChange: (url: string | null) => void;
  accept?: string;
  onThumb?: (url: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function handle(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const { url, thumbUrl } = await uploadFile(bucket, file);
      onChange(url);
      onThumb?.(thumbUrl);
      toast.success("Uploaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  const isPdf = value?.toLowerCase().endsWith(".pdf");
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        void handle(e.dataTransfer.files[0]);
      }}
      onPaste={(e) => void handle(e.clipboardData.files[0])}
      className={cn("flex items-center gap-3 rounded-xl border border-dashed bg-surface p-3", drag ? "border-accent bg-accent/5" : "border-line")}
    >
      <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-white/[0.03]">
        {value && !isPdf ? (
          // eslint-disable-next-line @next/next/no-img-element -- uploaded preview
          <img src={value} alt="" className="size-full object-cover" />
        ) : value ? (
          <FileText className="size-6 text-gold" aria-hidden="true" />
        ) : (
          <ImagePlus className="size-6 text-muted" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 hover:bg-white/5">
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {value ? "Replace" : "Upload"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                onThumb?.(null);
              }}
              className="rounded-lg px-3 py-1.5 text-muted hover:text-loss"
            >
              Remove
            </button>
          )}
        </div>
        <p className="mt-1 truncate text-xs text-muted">{value ? value.split("/").pop() : "Drop a file, paste from clipboard, or click Upload."}</p>
      </div>
      <input id={id} ref={ref} type="file" accept={accept} className="sr-only" onChange={(e) => void handle(e.target.files?.[0])} />
    </div>
  );
}
