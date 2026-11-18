import { FlaskConical } from "lucide-react";
import { Suspense } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar, NavbarFallback } from "@/components/layout/navbar";
import { Experience } from "@/components/motion/experience";
import { getSettings, hasDemoData } from "@/lib/data/public";
import { SITE, socialLinks } from "@/lib/site";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, demo] = await Promise.all([getSettings(), hasDemoData()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: settings.brand_name,
        url: SITE.url,
        description: settings.seo_description ?? SITE.description,
      },
      {
        "@type": "Person",
        name: settings.trader_name,
        url: SITE.url,
        jobTitle: "Prop firm trader",
        sameAs: socialLinks(settings.socials).map((x) => x.url),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Experience />
      {demo && (
        <div className="border-amber/20 bg-amber/10 text-amber relative z-[51] flex items-center justify-center gap-2 border-b px-4 py-1.5 text-center text-[11px]">
          <FlaskConical className="size-3.5 shrink-0" aria-hidden="true" />
          <span>Demo data: sample numbers for preview only. These are not real trading results.</span>
        </div>
      )}
      <Suspense fallback={<NavbarFallback brand={settings.brand_name} />}>
        <Navbar brand={settings.brand_name} />
      </Suspense>
      <main id="main" className="min-h-[calc(100dvh-var(--nav-h))]">
        {children}
      </main>
      <Footer brand={settings.brand_name} tagline={settings.tagline} socials={settings.socials} />
    </>
  );
}
