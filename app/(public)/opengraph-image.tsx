import { ImageResponse } from "next/og";
import { getPortfolio } from "@/lib/data/portfolio";
import { getSettings, hasDemoData } from "@/lib/data/public";
import { formatMoney } from "@/lib/format";
import { Card } from "@/lib/og/card";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Funded prop firm trader: total payouts and track record";

export default async function Image() {
  const [settings, p, demo] = await Promise.all([getSettings(), getPortfolio(), hasDemoData()]);
  return new ImageResponse(
    <Card
      {...size}
      brand={settings.brand_name}
      eyebrow="Total payouts"
      value={formatMoney(p.totals.totalPayouts, { decimals: 0 })}
      tone="gold"
      lines={[`${settings.tagline} · ${p.totals.fundedAccounts} funded accounts · ${formatMoney(p.totals.fundedCapital, { compact: true })} funded capital`]}
      demo={demo}
    />,
    size,
  );
}
