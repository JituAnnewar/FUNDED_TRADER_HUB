"use client";

import type { IChartApi, UTCTimestamp } from "lightweight-charts";
import { useEffect, useRef } from "react";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ChartSeries {
  name: string;
  color: string;
  points: { time: string; value: number }[];
}

function toData(points: ChartSeries["points"]) {
  const out: { time: UTCTimestamp; value: number }[] = [];
  let last = -Infinity;
  for (const p of [...points].sort((a, b) => a.time.localeCompare(b.time))) {
    let t = Math.floor(new Date(p.time).getTime() / 1000);
    if (t <= last) t = last + 1; // lightweight-charts needs strictly ascending times
    last = t;
    out.push({ time: t as UTCTimestamp, value: p.value });
  }
  return out;
}

/** Equity / balance curve on TradingView lightweight-charts. First series is an area, others are lines. */
export function EquityChart({
  series,
  height = 300,
  label,
  className,
  valuePrefix = "",
}: {
  series: ChartSeries[];
  height?: number;
  label: string;
  className?: string;
  valuePrefix?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let chart: IChartApi | null = null;
    let cancelled = false;
    // The chart library is loaded only when the chart is near the viewport.
    const io = new IntersectionObserver(
      async ([entry]) => {
        if (!entry?.isIntersecting || chart || cancelled) return;
        io.disconnect();
        const lc = await import("lightweight-charts");
        if (cancelled) return;
        chart = build(lc, el);
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    function build(lc: typeof import("lightweight-charts"), el: HTMLDivElement): IChartApi {
      const chart: IChartApi = lc.createChart(el, {
        height,
        autoSize: true,
        layout: {
          background: { type: lc.ColorType.Solid, color: "transparent" },
          textColor: "#8A96A8",
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 11,
          attributionLogo: false,
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.04)" },
          horzLines: { color: "rgba(255,255,255,0.04)" },
        },
        rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
        timeScale: { borderColor: "rgba(255,255,255,0.08)", timeVisible: false },
        crosshair: {
          vertLine: { color: "rgba(41,212,255,0.4)", labelBackgroundColor: "#111823" },
          horzLine: { color: "rgba(41,212,255,0.4)", labelBackgroundColor: "#111823" },
        },
        localization: { priceFormatter: (v: number) => `${valuePrefix}${formatMoney(v, { decimals: 0 })}` },
        handleScroll: { vertTouchDrag: false },
      });
      series.forEach((s, i) => {
        const data = toData(s.points);
        if (i === 0) {
          const area = chart.addSeries(lc.AreaSeries, {
            lineColor: s.color,
            topColor: `${s.color}55`,
            bottomColor: `${s.color}00`,
            lineWidth: 2,
            priceLineVisible: false,
          });
          area.setData(data);
        } else {
          const line = chart.addSeries(lc.LineSeries, { color: s.color, lineWidth: 2, priceLineVisible: false });
          line.setData(data);
        }
      });
      chart.timeScale().fitContent();
      return chart;
    }
    return () => {
      cancelled = true;
      io.disconnect();
      chart?.remove();
    };
  }, [series, height, valuePrefix]);

  const first = series[0]?.points ?? [];
  const last = first[first.length - 1];
  return (
    <figure className={cn("w-full", className)}>
      <div ref={ref} style={{ height }} role="img" aria-label={`${label}. ${last ? `Latest value ${formatMoney(last.value)}.` : "No data."}`} />
      <details className="mt-2 text-xs text-muted">
        <summary className="cursor-pointer select-none hover:text-fg">Show data as a table</summary>
        <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-line">
          <table className="w-full text-left">
            <caption className="sr-only">{label}</caption>
            <thead className="sticky top-0 bg-surface">
              <tr>
                <th className="px-3 py-1.5 font-medium">Series</th>
                <th className="px-3 py-1.5 font-medium">Date</th>
                <th className="px-3 py-1.5 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {series.flatMap((s) =>
                s.points.slice(-60).map((p, i) => (
                  <tr key={`${s.name}-${i}`} className="border-t border-line">
                    <td className="px-3 py-1">{s.name}</td>
                    <td className="num px-3 py-1">{p.time.slice(0, 10)}</td>
                    <td className="num px-3 py-1 text-right">{formatMoney(p.value)}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
