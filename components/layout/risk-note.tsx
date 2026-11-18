import { Info } from "lucide-react";
import { RISK_NOTE } from "@/lib/site";
import { cn } from "@/lib/utils";

/** One-line risk disclaimer shown under every P&L section. */
export function RiskNote({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-start gap-2 text-xs leading-relaxed text-muted", className)}>
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>{RISK_NOTE}</span>
    </p>
  );
}
