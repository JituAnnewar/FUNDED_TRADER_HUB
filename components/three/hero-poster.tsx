/**
 * Static SVG poster for the home hero. Shown on first paint, under reduced
 * motion, and while the 3D scene loads (Phase 4). Deterministic, so it
 * renders identically on server and client.
 */

interface Candle {
  x: number;
  open: number;
  close: number;
  high: number;
  low: number;
}

function buildCandles(count: number): Candle[] {
  const out: Candle[] = [];
  let price = 70;
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < count; i++) {
    const drift = -1.15; // upward trend (SVG y grows downward)
    const move = drift + (rand() - 0.45) * 6;
    const open = price;
    const close = price + move;
    const high = Math.min(open, close) - rand() * 3 - 0.5;
    const low = Math.max(open, close) + rand() * 3 + 0.5;
    out.push({ x: i, open, close, high, low });
    price = close;
  }
  return out;
}

const CANDLES = buildCandles(42);

export function HeroPoster({ className }: { className?: string }) {
  const w = 12;
  return (
    <svg
      viewBox="0 0 520 110"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="hp-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#05070A" stopOpacity="1" />
          <stop offset="0.25" stopColor="#05070A" stopOpacity="0" />
          <stop offset="0.75" stopColor="#05070A" stopOpacity="0" />
          <stop offset="1" stopColor="#05070A" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="hp-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#29D4FF" stopOpacity="0.25" />
          <stop offset="1" stopColor="#29D4FF" stopOpacity="0" />
        </linearGradient>
        <filter id="hp-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x="0" y="96" width="520" height="14" fill="url(#hp-floor)" />
      <g filter="url(#hp-glow)">
        {CANDLES.map((c) => {
          const up = c.close < c.open;
          const color = up ? "#16F2A0" : "#FF3D6E";
          const cx = 8 + c.x * w + w / 2;
          const top = Math.min(c.open, c.close);
          const h = Math.max(1, Math.abs(c.close - c.open));
          return (
            <g key={c.x} opacity={0.35 + (c.x / CANDLES.length) * 0.65}>
              <line x1={cx} x2={cx} y1={c.high} y2={c.low} stroke={color} strokeWidth="0.8" />
              <rect x={cx - 3.2} y={top} width="6.4" height={h} rx="0.8" fill={color} />
            </g>
          );
        })}
      </g>
      <rect width="520" height="110" fill="url(#hp-fade)" />
    </svg>
  );
}
