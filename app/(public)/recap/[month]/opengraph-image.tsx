import { ImageResponse } from "next/og";
import { isMonthKey, monthLabel, monthRecap } from "@/lib/analytics/recap";
import { getPayouts, getSettings, getTrades, hasDemoData } from "@/lib/data/public";
import { formatPct, formatPnl } from "@/lib/format";
import { Card } from "@/lib/og/card";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Monthly trading recap";

export default async function Image({ params }: { params: Promise<{ month: string }> }) {
  const { month } = await params;
  const [settings, trades, payouts, demo] = await Promise.all([getSettings(), getTrades(), getPayouts(), hasDemoData()]);
  if (!isMonthKey(month)) return new ImageResponse(<Card {...size} brand={settings.brand_name} eyebrow="Recap" value="—" tone="accent" />, size);
  const s = monthRecap(month, trades, payouts).summary;
  return new ImageResponse(
    (
      <Card
        {...size}
        brand={settings.brand_name}
        eyebrow={`${monthLabel(month)} recap`}
        value={formatPnl(s.net, { decimals: 0 })}
        tone={s.net >= 0 ? "profit" : "loss"}
        lines={[`${s.count} trades · ${s.winRate === null ? "—" : formatPct(s.winRate * 100, 0, false)} win rate`]}
        demo={demo}
      />
    ),
    size,
  );
}
