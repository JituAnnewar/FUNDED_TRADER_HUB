import { cn } from "@/lib/utils";

/** Candlestick logo mark. Pure SVG so it renders on the server. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-7", className)}>
      <defs>
        <linearGradient id="lm-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#29D4FF" />
          <stop offset="1" stopColor="#16F2A0" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="#0B1016" stroke="rgba(255,255,255,0.12)" />
      <path d="M10 7v18" stroke="#FF3D6E" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="7.5" y="12" width="5" height="8" rx="1" fill="#FF3D6E" />
      <path d="M22 5v20" stroke="url(#lm-g)" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="19.5" y="8" width="5" height="13" rx="1" fill="url(#lm-g)" />
    </svg>
  );
}

export function Logo({ brand, className }: { brand: string; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-[15px] font-semibold tracking-[0.18em] text-fg">{brand}</span>
    </span>
  );
}
