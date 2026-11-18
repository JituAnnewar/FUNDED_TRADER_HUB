import { cacheLife } from "next/cache";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { SocialIcon } from "@/components/layout/social-icon";
import { LEGAL_NAV, PRIMARY_NAV, SECONDARY_NAV, SITE, SOCIALS } from "@/lib/site";

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export function Footer({ brand, tagline }: { brand: string; tagline: string }) {
  const socials = SOCIALS.filter((s) => s.url);

  return (
    <footer className="relative mt-24 border-t border-line">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo brand={brand} />
          <p className="font-display text-sm tracking-[0.3em] text-muted">{tagline}</p>
          <p className="max-w-sm text-sm leading-relaxed text-muted">{SITE.description}</p>
          {socials.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Social links">
              {socials.map((s) => (
                <li key={s.id}>
                  <a
                    href={s.url ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="grid size-10 place-items-center rounded-xl border border-line bg-white/[0.02] text-muted transition-colors hover:border-line-strong hover:text-fg"
                  >
                    <SocialIcon id={s.id} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Footer: track record">
          <h2 className="mb-3 text-xs font-medium tracking-[0.2em] text-muted/70 uppercase">Track record</h2>
          <ul className="space-y-2 text-sm">
            {PRIMARY_NAV.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="text-muted transition-colors hover:text-fg">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Footer: more">
          <h2 className="mb-3 text-xs font-medium tracking-[0.2em] text-muted/70 uppercase">More</h2>
          <ul className="space-y-2 text-sm">
            {[...SECONDARY_NAV, ...LEGAL_NAV].map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="text-muted transition-colors hover:text-fg">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs leading-relaxed text-muted sm:px-6 md:flex-row md:items-start md:justify-between">
          <p className="max-w-3xl">
            For education and journaling only. Nothing here is financial advice or a solicitation to trade. Most
            prop firm accounts trade simulated capital, and payouts are paid by the firm. Trading carries a
            substantial risk of loss.{" "}
            <Link href="/disclaimer" className="underline underline-offset-2 hover:text-fg">
              Read the full disclaimer
            </Link>
            .
          </p>
          <p className="num shrink-0">
            © <CopyrightYear /> {brand}
          </p>
        </div>
      </div>
    </footer>
  );
}
