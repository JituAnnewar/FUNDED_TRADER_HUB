/** Branded dark/neon card for OG images and share cards (ImageResponse JSX: flexbox only). */
import { MarkImage } from "./mark";

export interface CardProps {
  brand: string;
  eyebrow: string;
  value: string;
  tone: "profit" | "loss" | "gold" | "accent";
  lines?: string[];
  footer?: string;
  width: number;
  height: number;
  demo?: boolean;
}

const TONE = { profit: "#34D399", loss: "#F87171", gold: "#FBBF24", accent: "#22D3EE" };

export function Card({ brand, eyebrow, value, tone, lines = [], footer, width, height, demo }: CardProps) {
  const square = Math.abs(width - height) < 50;
  const color = TONE[tone];
  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: square ? 80 : 72,
        background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${color}22, transparent 70%), linear-gradient(180deg, #0B0E22, #05060F)`,
        color: "#EEF0FF",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <MarkImage size={56} />
          <span style={{ fontSize: 30, letterSpacing: 8, fontWeight: 700 }}>{brand}</span>
        </div>
        {demo && (
          <span
            style={{
              fontSize: 22,
              color: "#FFB547",
              border: "2px solid #FFB547",
              borderRadius: 12,
              padding: "6px 14px",
            }}
          >
            DEMO DATA
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontSize: square ? 34 : 30, letterSpacing: 6, color: "#8F94BD", textTransform: "uppercase" }}>
          {eyebrow}
        </span>
        <span
          style={{
            fontSize: square ? 150 : 132,
            fontWeight: 800,
            color,
            textShadow: `0 0 40px ${color}88`,
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        {lines.map((l) => (
          <span key={l} style={{ fontSize: square ? 34 : 30, color: "#C9D2DE" }}>
            {l}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#8F94BD" }}>
        <span>{footer ?? "Funded prop firm trader · Forex & Gold"}</span>
        <span>For education only. Not financial advice.</span>
      </div>
    </div>
  );
}
