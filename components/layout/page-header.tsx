import { cn } from "@/lib/utils";

/**
 * Header for every inner page. A short "opening shot": the title sharpens out of a blur,
 * the copy rises in, and orbit rings turn slowly behind it (CSS only, nothing to download).
 */
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
    <header
      className={cn(
        "relative isolate mx-auto max-w-6xl overflow-hidden px-4 pt-14 pb-10 sm:px-6 sm:pt-20 sm:pb-14",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-[-8rem] -z-10 hidden size-[30rem] -translate-y-1/2 sm:block lg:right-[-4rem]"
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgb(124_92_255/0.22),transparent_62%)]" />
        <div className="orbit inset-[12%]" />
        <div className="orbit inset-[26%] [animation-direction:reverse] [animation-duration:40s]" />
        <div className="orbit inset-[40%] [animation-duration:24s]" />
        <div className="absolute inset-[46%] rounded-full bg-[image:var(--grad-brand)] opacity-80 shadow-[0_0_60px_10px_rgb(124_92_255/0.45)] blur-[2px]" />
      </div>

      {eyebrow && (
        <p
          className="intro-rise border-line-strong text-violet-soft mb-5 inline-flex items-center gap-2 rounded-full border bg-white/[0.03] px-3 py-1 text-[11px] font-medium tracking-[0.25em] uppercase backdrop-blur-md"
          style={{ ["--d" as string]: "0s" }}
        >
          <span className="bg-accent size-1.5 rounded-full shadow-[0_0_8px_var(--c-accent)]" aria-hidden="true" />
          {eyebrow}
        </p>
      )}
      <h1 className="page-title max-w-3xl text-4xl font-semibold text-balance sm:text-6xl">
        <span className="text-gradient">{title}</span>
      </h1>
      <div className="title-line mt-6" aria-hidden="true" />
      {description && (
        <p
          className="intro-rise text-muted mt-6 max-w-2xl text-base leading-relaxed sm:text-lg"
          style={{ ["--d" as string]: "0.15s" }}
        >
          {description}
        </p>
      )}
      {children}
    </header>
  );
}
