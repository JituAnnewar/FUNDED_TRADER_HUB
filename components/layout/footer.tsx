import { cacheLife } from "next/cache";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { SocialIcon } from "@/components/layout/social-icon";
import { CONTACT_NAV, LEGAL_NAV, PRIMARY_NAV, SECONDARY_NAV, SITE, socialLinks } from "@/lib/site";
import type { Socials } from "@/lib/types";

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export function Footer({ brand, tagline, socials: socialMap }: { brand: string; tagline: string; socials: Socials }) {
  const socials = socialLinks(socialMap);

  return (
    <footer className="border-line relative mt-28 border-t bg-[radial-gradient(60%_80%_at_50%_0%,rgb(124_92_255/0.1),transparent_70%)]">
      <div className="via-violet/60 pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent to-transparent" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo brand={brand} />
          <p className="font-display text-muted text-sm tracking-[0.3em]">{tagline}</p>
          <p className="text-muted max-w-sm text-sm leading-relaxed">{SITE.description}</p>
          {socials.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Social links">
              {socials.map((s) => (
                <li key={s.id}>
                  <a
                    href={s.url ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="border-line text-muted hover:border-line-strong hover:text-fg grid size-10 place-items-center rounded-xl border bg-white/[0.02] transition-colors"
                  >
                    <SocialIcon id={s.id} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Footer: track record">
          <h2 className="text-muted/70 mb-3 text-xs font-medium tracking-[0.2em] uppercase">Track record</h2>
          <ul className="space-y-2 text-sm">
            {PRIMARY_NAV.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="text-muted hover:text-fg transition-colors">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Footer: more">
          <h2 className="text-muted/70 mb-3 text-xs font-medium tracking-[0.2em] uppercase">More</h2>
          <ul className="space-y-2 text-sm">
            {[...SECONDARY_NAV, CONTACT_NAV, ...LEGAL_NAV].map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="text-muted hover:text-fg transition-colors">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-line border-t">
        <div className="text-muted mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs leading-relaxed sm:px-6 md:flex-row md:items-start md:justify-between">
          <p className="max-w-3xl">
            For education and journaling only. Nothing here is financial advice or a solicitation to trade. Most prop
            firm accounts trade simulated capital, and payouts are paid by the firm. Trading carries a substantial risk
            of loss.{" "}
            <Link href="/disclaimer" className="hover:text-fg underline underline-offset-2">
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
