import { ImageResponse } from "next/og";
import { getPayouts, getSettings, hasDemoData } from "@/lib/data/public";
import { formatMoney } from "@/lib/format";
import { Card } from "@/lib/og/card";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Prop firm payouts received";

export default async function Image() {
  const [settings, payouts, demo] = await Promise.all([getSettings(), getPayouts(), hasDemoData()]);
  const total = payouts.reduce((s, p) => s + p.amount, 0);
  return new ImageResponse(
    <Card {...size} brand={settings.brand_name} eyebrow="Paid out by prop firms" value={formatMoney(total, { decimals: 0 })} tone="gold" lines={[`${payouts.length} payouts`]} demo={demo} />,
    size,
  );
}
