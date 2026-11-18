"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { BadgeCheck, FileText, X, ZoomIn, ZoomOut } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { TiltCard } from "@/components/motion/tilt-card";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface CertificateItem {
  id: string;
  amount: number;
  paidOn: string;
  firm: string;
  image: string | null;
  file: string | null;
  verificationUrl: string | null;
}

/** Masonry gallery. Cards flip on hover/focus to show details; click opens a zoomable lightbox. */
export function CertificateGallery({ items }: { items: CertificateItem[] }) {
  const [open, setOpen] = useState<CertificateItem | null>(null);
  const [zoom, setZoom] = useState(1);
  const reduce = useReducedMotion();

  return (
    <>
      <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>li]:mb-4 [&>li]:break-inside-avoid">
        {items.map((c) => (
          <li key={c.id}>
            <TiltCard max={6}>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setOpen(c);
                }}
                className="group block w-full rounded-2xl text-left [perspective:1200px]"
                aria-label={`Open certificate: ${formatMoney(c.amount)} from ${c.firm}`}
              >
                <div
                  className={cn(
                    "relative transition-transform duration-700 [transform-style:preserve-3d]",
                    !reduce && "group-hover:[transform:rotateY(180deg)] group-focus-visible:[transform:rotateY(180deg)]",
                  )}
                >
                  <div className="glass overflow-hidden [backface-visibility:hidden]">
                    {c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- storage images
                      <img src={c.image} alt="" className="w-full" loading="lazy" />
                    ) : (
                      <div className="grid aspect-[10/7] place-items-center bg-gradient-to-br from-gold/15 to-transparent">
                        <FileText className="size-10 text-gold" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="glass absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <p className="num text-3xl font-semibold text-gold glow-gold">{formatMoney(c.amount)}</p>
                    <p className="text-sm text-muted">{c.firm}</p>
                    <p className="num text-xs text-muted">{c.paidOn}</p>
                    {c.verificationUrl && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-profit/30 bg-profit/10 px-2 py-0.5 text-[11px] text-profit">
                        <BadgeCheck className="size-3.5" aria-hidden="true" /> Verified
                      </span>
                    )}
                    <span className="mt-2 text-xs text-accent">Click to enlarge</span>
                  </div>
                </div>
              </button>
            </TiltCard>
          </li>
        ))}
      </ul>

      <Dialog.Root open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-bg/90 backdrop-blur-md" />
          <Dialog.Content className="fixed inset-0 z-[81] flex flex-col p-4 outline-none" aria-describedby={undefined}>
            {open && (
              <>
                <div className="flex items-center justify-between gap-3 pb-3">
                  <Dialog.Title className="text-sm">
                    <span className="num text-gold">{formatMoney(open.amount)}</span> <span className="text-muted">· {open.firm} · {open.paidOn}</span>
                  </Dialog.Title>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setZoom((z) => Math.max(1, z - 0.5))} className="grid size-10 place-items-center rounded-xl border border-line" aria-label="Zoom out">
                      <ZoomOut className="size-4" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => setZoom((z) => Math.min(4, z + 0.5))} className="grid size-10 place-items-center rounded-xl border border-line" aria-label="Zoom in">
                      <ZoomIn className="size-4" aria-hidden="true" />
                    </button>
                    {open.file && (
                      <a href={open.file} target="_blank" rel="noopener noreferrer" className="grid h-10 place-items-center rounded-xl border border-line px-3 text-sm">
                        Open file
                      </a>
                    )}
                    <Dialog.Close className="grid size-10 place-items-center rounded-xl border border-line" aria-label="Close">
                      <X className="size-4" aria-hidden="true" />
                    </Dialog.Close>
                  </div>
                </div>
                <div className="relative flex-1 overflow-auto rounded-2xl border border-line bg-surface">
                  {open.image ? (
                    <motion.img
                      src={open.image}
                      alt={`Payout certificate: ${formatMoney(open.amount)} from ${open.firm}`}
                      className="mx-auto max-h-full origin-top-left object-contain"
                      style={{ width: `${zoom * 100}%`, maxWidth: "none" }}
                      initial={reduce ? false : { opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                    />
                  ) : (
                    <p className="p-8 text-center text-muted">No image for this certificate.</p>
                  )}
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
