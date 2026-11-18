import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";
import { PageHeader } from "@/components/layout/page-header";
import { SocialIcon } from "@/components/layout/social-icon";
import { GlassPanel } from "@/components/ui/glass-panel";
import { getSettings } from "@/lib/data/public";
import { socialLinks } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Mentorship, collaboration or business enquiries.",
};

export default async function ContactPage() {
  const settings = await getSettings();
  const socials = socialLinks(settings.socials);
  return (
    <>
      <PageHeader
        eyebrow="Get in touch"
        title="Contact"
        description="Mentorship, collaboration or business. Messages go straight to my inbox."
      />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_320px]">
        <GlassPanel className="p-5 sm:p-8">
          <ContactForm turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined} />
        </GlassPanel>
        <div className="space-y-4">
          {socials.length > 0 && (
            <GlassPanel className="p-5">
              <h2 className="text-muted mb-3 text-sm font-medium tracking-wide uppercase">Or message me on</h2>
              <ul className="space-y-2">
                {socials.map((s) => (
                  <li key={s.id}>
                    <a
                      href={s.url ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border-line hover:border-line-strong flex items-center gap-3 rounded-xl border bg-white/[0.02] px-4 py-3 text-sm transition-colors hover:bg-white/[0.05]"
                    >
                      <SocialIcon id={s.id} className="text-accent size-5" />
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          )}
          <GlassPanel className="text-muted p-5 text-sm leading-relaxed">
            I do not manage money, sell signals or give personal financial advice. For anything else, I usually reply
            within a few days.
          </GlassPanel>
        </div>
      </div>
    </>
  );
}
