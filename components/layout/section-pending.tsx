import { Clock } from "lucide-react";
import Link from "next/link";
import { GlassPanel } from "@/components/ui/glass-panel";

/**
 * Temporary state for public sections whose data layer is not wired yet.
 * Tracked in PROGRESS.md: every usage is removed by the end of Phase 6.
 */
export function SectionPending({ what }: { what: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <GlassPanel className="flex flex-col items-start gap-4 p-8 sm:p-10">
        <span className="grid size-11 place-items-center rounded-xl border border-line bg-white/[0.03] text-accent">
          <Clock className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-semibold">Nothing to show yet</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            {what} will appear here once the first records are published.
          </p>
        </div>
        <Link href="/" className="text-sm text-accent underline-offset-4 hover:underline">
          Back to home
        </Link>
      </GlassPanel>
    </div>
  );
}
