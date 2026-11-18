import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { isMonthKey, monthLabel, monthRecap } from "@/lib/analytics/recap";
import { getPayouts, getSettings, getTrades, hasDemoData } from "@/lib/data/public";
import { formatMoney, formatPct, formatPnl } from "@/lib/format";
import { Card } from "@/lib/og/card";

/** Square 1080×1080 monthly recap card for Instagram / X. */
export async function GET(_req: Request, { params }: { params: Promise<{ month: string }> }) {
  const { month } = await params;
  if (!isMonthKey(month)) return NextResponse.json({ error: "Use YYYY-MM" }, { status: 400 });
  const [settings, trades, payouts, demo] = await Promise.all([getSettings(), getTrades(), getPayouts(), hasDemoData()]);
  const r = monthRecap(month, trades, payouts);
  const s = r.summary;
  const pf = s.profitFactor === null ? "—" : s.profitFactor === Infinity ? "∞" : s.profitFactor.toFixed(2);
  return new ImageResponse(
    (
      <Card
        width={1080}
        height={1080}
        brand={settings.brand_name}
        eyebrow={`${monthLabel(month)} recap`}
        value={formatPnl(s.net, { decimals: 0 })}
        tone={s.net >= 0 ? "profit" : "loss"}
        lines={[
          `${s.count} trades · ${s.winRate === null ? "—" : formatPct(s.winRate * 100, 0, false)} win rate`,
          `Profit factor ${pf}`,
          ...(r.payoutTotal ? [`Payouts ${formatMoney(r.payoutTotal)}`] : []),
        ]}
        footer={settings.tagline}
        demo={demo}
      />
    ),
    { width: 1080, height: 1080 },
  );
}
