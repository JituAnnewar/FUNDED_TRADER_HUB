import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Loader } from "@/components/motion/loader";
import { SITE } from "@/lib/site";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Loader brand={SITE.brand} />
      <Navbar brand={SITE.brand} />
      <main id="main" className="min-h-[calc(100dvh-var(--nav-h))]">
        {children}
      </main>
      <Footer brand={SITE.brand} tagline={SITE.tagline} />
    </>
  );
}
