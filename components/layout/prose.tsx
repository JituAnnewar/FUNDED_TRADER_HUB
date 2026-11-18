import { cn } from "@/lib/utils";

/** Long-form text styling for legal pages and markdown content. */
export function Prose({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "mx-auto max-w-3xl px-4 text-[15px] leading-7 text-muted sm:px-6",
        "[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-fg",
        "[&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_strong]:text-fg",
        "[&_a]:text-accent [&_a]:underline-offset-4 hover:[&_a]:underline",
        className,
      )}
    >
      {children}
    </div>
  );
}
