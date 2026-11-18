import { BadgeCheck } from "lucide-react";
import { TiltCard } from "@/components/motion/tilt-card";
import { GlassPanel } from "@/components/ui/glass-panel";
import { formatMoney } from "@/lib/format";
import { formatDateIST } from "@/lib/time";
import type { Payout } from "@/lib/types";

export function PayoutCard({ payout, firmName }: { payout: Payout; firmName: string }) {
  const thumb = payout.certificate_thumb_url ?? payout.certificate_url;
  return (
    <TiltCard max={6}>
      <GlassPanel className="h-full overflow-hidden">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element -- certificate images from storage
          <img src={thumb} alt={`Payout certificate from ${firmName}`} className="aspect-[10/7] w-full object-cover" loading="lazy" />
        ) : (
          <div className="grid aspect-[10/7] place-items-center bg-gradient-to-br from-gold/15 to-transparent">
            <span className="num text-3xl font-semibold text-gold glow-gold">{formatMoney(payout.amount, { compact: true })}</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="num text-lg font-semibold text-gold">{formatMoney(payout.amount)}</p>
            <p className="text-xs text-muted">
              {firmName} · {formatDateIST(new Date(payout.paid_on))}
            </p>
          </div>
          {payout.verification_url && (
            <a
              href={payout.verification_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-profit/30 bg-profit/10 px-2 py-0.5 text-[11px] text-profit"
            >
              <BadgeCheck className="size-3.5" aria-hidden="true" /> Verified
            </a>
          )}
        </div>
      </GlassPanel>
    </TiltCard>
  );
}
