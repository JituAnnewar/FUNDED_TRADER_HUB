import { ImageResponse } from "next/og";
import { getPayouts, getSettings, hasDemoData } from "@/lib/data/public";
import { formatMoney } from "@/lib/format";
import { Card } from "@/lib/og/card";
import { formatDateIST } from "@/lib/time";

/** Square 1080×1080 share card for Instagram / X. */
export async function GET() {
  const [settings, payouts, demo] = await Promise.all([getSettings(), getPayouts(), hasDemoData()]);
  const total = payouts.reduce((s, p) => s + p.amount, 0);
  const latest = payouts[0];
  return new ImageResponse(
    <Card
      width={1080}
      height={1080}
      brand={settings.brand_name}
      eyebrow="Total payouts"
      value={formatMoney(total, { decimals: 0 })}
      tone="gold"
      lines={[`${payouts.length} payouts`, ...(latest ? [`Latest: ${formatMoney(latest.amount)} on ${formatDateIST(new Date(latest.paid_on))}`] : [])]}
      footer={settings.tagline}
      demo={demo}
    />,
    { width: 1080, height: 1080, headers: { "content-disposition": 'inline; filename="payouts.png"' } },
  );
}
