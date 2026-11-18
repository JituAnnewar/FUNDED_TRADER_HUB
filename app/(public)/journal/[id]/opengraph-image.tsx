import { ImageResponse } from "next/og";
import { getSettings, getTrade, hasDemoData } from "@/lib/data/public";
import { formatPnl, formatR } from "@/lib/format";
import { Card } from "@/lib/og/card";
import { formatDateIST } from "@/lib/time";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Trade result";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [settings, data, demo] = await Promise.all([getSettings(), getTrade(id), hasDemoData()]);
  if (!data) return new ImageResponse(<Card {...size} brand={settings.brand_name} eyebrow="Trade" value="—" tone="accent" />, size);
  const t = data.trade;
  return new ImageResponse(
    <Card
      {...size}
      brand={settings.brand_name}
      eyebrow={`${t.symbol} · ${t.direction === "long" ? "Long" : "Short"}`}
      value={formatPnl(t.net_pnl, { decimals: 0 })}
      tone={t.net_pnl >= 0 ? "profit" : "loss"}
      lines={[`${t.r_multiple !== null ? `${formatR(t.r_multiple)} · ` : ""}${formatDateIST(new Date(t.opened_at))}`]}
      demo={demo}
    />,
    size,
  );
}
