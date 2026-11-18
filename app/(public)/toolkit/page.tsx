import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Reveal } from "@/components/motion/reveal";
import { GlassPanel } from "@/components/ui/glass-panel";
import { EmptyState, Section, Tag } from "@/components/ui/misc";
import { getToolkit } from "@/lib/data/public";
import type { ToolkitCategory } from "@/lib/types";

export const metadata: Metadata = {
  title: "Toolkit",
  description: "The platforms, charting tools, indicators, hardware and education I use.",
};

const GROUPS: { key: ToolkitCategory; title: string }[] = [
  { key: "platform", title: "Platforms" },
  { key: "charting", title: "Charting" },
  { key: "indicator", title: "Indicators" },
  { key: "hardware", title: "Hardware & desk setup" },
  { key: "broker", title: "Brokers" },
  { key: "education", title: "Education" },
  { key: "other", title: "Other" },
];

export default async function ToolkitPage() {
  const items = await getToolkit();
  return (
    <>
      <PageHeader
        eyebrow="What I use"
        title="Toolkit"
        description="Affiliate links are labelled. I only list tools I actually use."
      />
      {items.length === 0 && (
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <EmptyState title="Toolkit coming soon" body="Platforms, indicators and setup details will be listed here." />
        </div>
      )}
      {GROUPS.map((g) => {
        const list = items.filter((i) => i.category === g.key);
        if (!list.length) return null;
        return (
          <Section key={g.key} id={g.key} title={g.title} className="py-8">
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((item, i) => (
                <Reveal as="li" key={item.id} delay={i * 0.04}>
                  <GlassPanel className="flex h-full gap-4 p-5">
                    {item.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element -- storage images
                      <img
                        src={item.image_url}
                        alt=""
                        className="border-line size-14 shrink-0 rounded-xl border object-cover"
                        loading="lazy"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{item.name}</h3>
                        {item.is_affiliate && <Tag tone="gold">Affiliate link</Tag>}
                      </div>
                      {item.description && (
                        <p className="text-muted mt-1 text-sm leading-relaxed">{item.description}</p>
                      )}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel={item.is_affiliate ? "sponsored noopener noreferrer" : "noopener noreferrer"}
                          className="text-accent mt-2 inline-flex items-center gap-1 text-sm hover:underline"
                        >
                          Visit <ExternalLink className="size-3.5" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </GlassPanel>
                </Reveal>
              ))}
            </ul>
          </Section>
        );
      })}
    </>
  );
}
