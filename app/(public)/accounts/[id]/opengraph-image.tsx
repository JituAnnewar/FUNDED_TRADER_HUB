import { ImageResponse } from "next/og";
import { getPortfolio } from "@/lib/data/portfolio";
import { getSettings, hasDemoData } from "@/lib/data/public";
import { formatMoney, formatPct } from "@/lib/format";
import { Card } from "@/lib/og/card";
import { PHASE_LABELS } from "@/lib/types";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Prop firm account";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [settings, p, demo] = await Promise.all([getSettings(), getPortfolio(), hasDemoData()]);
  const v = p.views.find((x) => x.account.id === id);
  if (!v) return new ImageResponse(<Card {...size} brand={settings.brand_name} eyebrow="Account" value="—" tone="accent" />, size);
  return new ImageResponse(
    <Card
      {...size}
      brand={settings.brand_name}
      eyebrow={`${v.firm?.name ?? ""} ${formatMoney(v.account.account_size, { compact: true })} · ${PHASE_LABELS[v.account.phase]}`}
      value={formatPct(v.returnPct, 2)}
      tone={v.returnPct >= 0 ? "profit" : "loss"}
      lines={[`Balance ${formatMoney(v.account.current_balance)}`]}
      demo={demo}
    />,
    size,
  );
}
