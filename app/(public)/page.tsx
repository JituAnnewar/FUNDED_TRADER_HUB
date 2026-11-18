import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { HeroPoster } from "@/components/three/hero-poster";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";

export default function HomePage() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <HeroPoster className="absolute inset-x-0 bottom-0 h-[70%] w-full opacity-80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_30%,rgb(41_212_255/0.12),transparent_70%)]" />
      </div>

      <div className="mx-auto flex min-h-[calc(100svh-var(--nav-h))] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6">
        <p className="mb-6 flex items-center gap-2 text-xs font-medium tracking-[0.3em] text-accent uppercase">
          <span className="size-1.5 rounded-full bg-profit shadow-[0_0_10px_var(--c-profit)]" aria-hidden="true" />
          Funded trader · {SITE.markets.join(" & ")}
        </p>
        <h1 className="font-display text-[clamp(3.5rem,14vw,10rem)] leading-[0.9] font-semibold tracking-[-0.04em]">
          <span className="text-gradient">{SITE.trader}</span>
        </h1>
        <p className="mt-5 font-display text-lg tracking-[0.45em] text-muted sm:text-xl">{SITE.tagline}</p>
        <p className="mt-8 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          A public, live record of my prop firm accounts, trades and payouts. Every number on this site comes from
          the journal I keep each trading day.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/performance">
              See performance <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/payouts">View payouts</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
