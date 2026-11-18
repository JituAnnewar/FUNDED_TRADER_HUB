import { cn } from "@/lib/utils";

/** Logo mark: a rising candle inside an orbit ring, violet → cyan. Pure SVG so it renders on the server. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <defs>
        <linearGradient id="lm-g" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#7C5CFF" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="#0B0E22" stroke="url(#lm-g)" strokeOpacity="0.55" />
      <ellipse
        cx="16"
        cy="16"
        rx="11"
        ry="4.6"
        fill="none"
        stroke="url(#lm-g)"
        strokeWidth="1.2"
        strokeOpacity="0.7"
        transform="rotate(-24 16 16)"
      />
      <path d="M16 6.5v19" stroke="url(#lm-g)" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="13" y="10" width="6" height="11" rx="1.6" fill="url(#lm-g)" />
      <circle cx="25.5" cy="11.6" r="1.6" fill="#22D3EE" />
    </svg>
  );
}

export function Logo({ brand, className }: { brand: string; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-fg text-[15px] font-semibold tracking-[0.2em]">{brand}</span>
    </span>
  );
}
