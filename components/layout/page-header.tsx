import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  className,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={cn("mx-auto max-w-7xl px-4 pt-14 pb-10 sm:px-6 sm:pt-20", className)}>
      {eyebrow && (
        <p className="mb-3 flex items-center gap-2 text-xs font-medium tracking-[0.25em] text-accent uppercase">
          <span className="h-px w-6 bg-accent/60" aria-hidden="true" />
          {eyebrow}
        </p>
      )}
      <h1 className="max-w-3xl text-4xl font-semibold text-balance sm:text-5xl">{title}</h1>
      {description && <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">{description}</p>}
      {children}
    </header>
  );
}
