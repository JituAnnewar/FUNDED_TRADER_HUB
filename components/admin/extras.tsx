"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { inputCls } from "@/components/admin/fields";
import { Button } from "@/components/ui/button";
import { PhaseBadge } from "@/components/ui/misc";
import { addTradeImages, closePosition, deleteTradeImage, movePhase, updateTradeImage } from "@/lib/admin/extra-actions";
import { uploadFile } from "@/lib/admin/upload";
import { isoToIstLocal, istLocalToIso } from "@/lib/time-input";
import { PHASE_LABELS, type AccountPhase, type ImageKind, type PhaseHistory, type TradeImage } from "@/lib/types";
import { cn } from "@/lib/utils";

const NEXT: Partial<Record<AccountPhase, AccountPhase[]>> = {
  challenge_phase_1: ["challenge_phase_2", "funded", "breached", "closed"],
  challenge_phase_2: ["funded", "passed", "breached", "closed"],
  funded: ["payout_pending", "breached", "closed"],
  payout_pending: ["funded", "closed", "breached"],
  passed: ["funded", "closed"],
  breached: ["closed"],
  closed: [],
};

export function PhaseMover({ accountId, phase, history }: { accountId: string; phase: AccountPhase; history: PhaseHistory[] }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const options = NEXT[phase] ?? [];
  return (
    <section className="glass p-4 sm:p-6">
      <h2 className="mb-1 text-xs font-medium tracking-[0.16em] text-muted uppercase">Phase</h2>
      <p className="mb-4 flex items-center gap-2 text-sm">
        Current: <PhaseBadge phase={phase} />
      </p>
      {options.length > 0 && (
        <>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note (e.g. Passed with 8.4%)" className={`${inputCls} mb-3`} aria-label="Phase change note" />
          <div className="flex flex-wrap gap-2">
            {options.map((p) => (
              <Button
                key={p}
                type="button"
                size="sm"
                variant={p === "breached" ? "ghost" : "secondary"}
                className={p === "breached" ? "text-loss" : undefined}
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const res = await movePhase(accountId, p, note);
                    if (!res.ok) {
                      toast.error(res.error);
                      return;
                    }
                    toast.success(`Moved to ${PHASE_LABELS[p]}.`);
                    setNote("");
                    router.refresh();
                  })
                }
              >
                Move to {PHASE_LABELS[p]}
              </Button>
            ))}
          </div>
        </>
      )}
      {history.length > 0 && (
        <ol className="mt-5 space-y-1.5 border-t border-line pt-4 text-sm">
          {history.map((h) => (
            <li key={h.id} className="flex flex-wrap gap-x-2 text-muted">
              <span className="num">{new Date(h.changed_at).toISOString().slice(0, 10)}</span>
              <span className="text-fg">
                {h.from_phase ? `${PHASE_LABELS[h.from_phase]} → ` : ""}
                {PHASE_LABELS[h.to_phase]}
              </span>
              {h.note && <span>· {h.note}</span>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function TradeImages({ tradeId, images }: { tradeId: string; images: TradeImage[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function upload(files: File[]) {
    const list = files.filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setBusy(true);
    try {
      const uploaded = [];
      for (const [i, f] of list.entries()) {
        const { url } = await uploadFile("trade-screenshots", f);
        const kind: ImageKind = images.length + i === 0 ? "before" : images.length + i === 1 ? "after" : "other";
        uploaded.push({ url, kind, caption: null });
      }
      const res = await addTradeImages(tradeId, uploaded);
      if (!res.ok) throw new Error(res.error);
      toast.success(`${uploaded.length} screenshot${uploaded.length > 1 ? "s" : ""} added.`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className={cn("glass p-4 sm:p-6", drag && "ring-2 ring-accent")}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        void upload([...e.dataTransfer.files]);
      }}
      onPaste={(e) => void upload([...e.clipboardData.files])}
      tabIndex={-1}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-medium tracking-[0.16em] text-muted uppercase">Screenshots</h2>
        <Button type="button" size="sm" variant="secondary" onClick={() => ref.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ImagePlus aria-hidden="true" />} Add screenshots
        </Button>
        <input ref={ref} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => void upload([...(e.target.files ?? [])])} />
      </div>
      <p className="mb-4 text-xs text-muted">Drop images here, paste from the clipboard (Ctrl/Cmd+V while this box is focused), or use the button. Mark one &ldquo;before&rdquo; and one &ldquo;after&rdquo; for the comparison slider.</p>
      {images.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((im) => (
            <li key={im.id} className="overflow-hidden rounded-xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element -- storage image */}
              <img src={im.url} alt={im.caption ?? "Trade screenshot"} className="aspect-video w-full object-cover" />
              <div className="space-y-2 p-2">
                <div className="flex gap-2">
                  <select
                    defaultValue={im.kind}
                    onChange={async (e) => {
                      const res = await updateTradeImage(im.id, tradeId, { kind: e.target.value as ImageKind });
                      if (!res.ok) toast.error(res.error);
                    }}
                    className={`${inputCls} h-9`}
                    aria-label="Screenshot type"
                  >
                    <option value="before">Before</option>
                    <option value="after">After</option>
                    <option value="other">Other</option>
                  </select>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await deleteTradeImage(im.id, tradeId);
                      if (!res.ok) {
                      toast.error(res.error);
                      return;
                    }
                      router.refresh();
                    }}
                    className="grid size-9 shrink-0 place-items-center rounded-lg border border-line text-muted hover:text-loss"
                    aria-label="Delete screenshot"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
                <input
                  defaultValue={im.caption ?? ""}
                  placeholder="Caption"
                  onBlur={async (e) => {
                    if ((im.caption ?? "") === e.target.value) return;
                    const res = await updateTradeImage(im.id, tradeId, { caption: e.target.value || null });
                    if (!res.ok) toast.error(res.error);
                  }}
                  className={`${inputCls} h-9`}
                  aria-label="Caption"
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-line py-8 text-center text-sm text-muted">No screenshots yet.</p>
      )}
    </section>
  );
}

export function ClosePosition({ positionId }: { positionId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [v, setV] = useState({ exit_price: "", pnl: "", fees: "0", closed_at: isoToIstLocal(new Date().toISOString()) });
  return (
    <section className="glass p-4 sm:p-6">
      <h2 className="mb-1 text-xs font-medium tracking-[0.16em] text-muted uppercase">Close position</h2>
      <p className="mb-4 text-sm text-muted">Records it as a trade and removes it from open positions.</p>
      <div className="grid gap-3 sm:grid-cols-4">
        <input value={v.exit_price} onChange={(e) => setV({ ...v, exit_price: e.target.value })} placeholder="Exit price" inputMode="decimal" className={`${inputCls} num`} aria-label="Exit price" />
        <input value={v.pnl} onChange={(e) => setV({ ...v, pnl: e.target.value })} placeholder="Gross P&L ($)" inputMode="decimal" className={`${inputCls} num`} aria-label="Gross P&L" />
        <input value={v.fees} onChange={(e) => setV({ ...v, fees: e.target.value })} placeholder="Fees ($)" inputMode="decimal" className={`${inputCls} num`} aria-label="Fees" />
        <input type="datetime-local" value={v.closed_at} onChange={(e) => setV({ ...v, closed_at: e.target.value })} className={inputCls} aria-label="Closed at (IST)" />
      </div>
      <Button
        type="button"
        className="mt-3"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await closePosition(positionId, { exit_price: v.exit_price, pnl: v.pnl, fees: v.fees, closed_at: istLocalToIso(v.closed_at) ?? "" });
            if (!res.ok || !res.data) {
              toast.error(res.ok ? "Could not close." : res.error);
              return;
            }
            toast.success(res.message ?? "Closed.");
            router.replace(`/admin/r/trades/${res.data.tradeId}`);
          })
        }
      >
        {pending && <Loader2 className="animate-spin" aria-hidden="true" />} Close and save as trade
      </Button>
    </section>
  );
}
