import { FlaskConical } from "lucide-react";
import { Suspense } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar, NavbarFallback } from "@/components/layout/navbar";
import { TickerTape } from "@/components/layout/ticker-tape";
import { Experience } from "@/components/motion/experience";
import { Loader } from "@/components/motion/loader";
import { getFirms, getPayouts, getSettings, getTrades, hasDemoData } from "@/lib/data/public";
import { SITE, socialLinks } from "@/lib/site";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, demo, trades, payouts, firms] = await Promise.all([getSettings(), hasDemoData(), getTrades(), getPayouts(), getFirms()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", name: settings.brand_name, url: SITE.url, description: settings.seo_description ?? SITE.description },
      { "@type": "Person", name: settings.trader_name, url: SITE.url, jobTitle: "Prop firm trader", sameAs: socialLinks(settings.socials).map((x) => x.url) },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Loader brand={settings.brand_name} />
      <Experience />
      {demo && (
        <div className="relative z-[51] flex items-center justify-center gap-2 bg-amber/15 px-4 py-1.5 text-center text-xs text-amber">
          <FlaskConical className="size-3.5 shrink-0" aria-hidden="true" />
          <span>Demo data: sample numbers for preview only. These are not real trading results.</span>
        </div>
      )}
      <Suspense fallback={<NavbarFallback brand={settings.brand_name} />}>
        <Navbar brand={settings.brand_name} />
      </Suspense>
      <TickerTape trades={trades} payouts={payouts} firms={firms} />
      <main id="main" className="min-h-[calc(100dvh-var(--nav-h))]">
        {children}
      </main>
      <Footer brand={settings.brand_name} tagline={settings.tagline} socials={settings.socials} />
    </>
  );
}
