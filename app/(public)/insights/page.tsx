import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Reveal } from "@/components/motion/reveal";
import { GlassPanel } from "@/components/ui/glass-panel";
import { readingTime } from "@/components/ui/markdown";
import { EmptyState } from "@/components/ui/misc";
import { getPosts } from "@/lib/data/public";
import { formatDateIST } from "@/lib/time";

export const metadata: Metadata = {
  title: "Insights",
  description: "Lessons from the journal and notes on the markets I trade.",
};

export default async function InsightsPage() {
  const posts = (await getPosts()).filter((p) => p.published_at);
  return (
    <>
      <PageHeader eyebrow="Notes" title="Insights" description="Lessons from the journal and notes on the markets I trade." />
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {posts.length === 0 ? (
          <EmptyState title="No posts yet" body="Lessons and market notes will be published here." />
        ) : (
          <ul className="space-y-4">
            {posts.map((p, i) => (
              <Reveal as="li" key={p.id} delay={i * 0.05}>
                <Link href={`/insights/${p.slug}`} className="block rounded-2xl">
                  <GlassPanel className="flex flex-col gap-4 overflow-hidden transition-colors hover:bg-white/[0.02] sm:flex-row">
                    {p.cover_url && (
                      // eslint-disable-next-line @next/next/no-img-element -- storage image
                      <img src={p.cover_url} alt="" className="aspect-video w-full object-cover sm:w-56" loading="lazy" />
                    )}
                    <div className="p-5">
                      <p className="num text-xs text-muted">
                        {formatDateIST(new Date(p.published_at!))} · {readingTime(p.body)} min read
                      </p>
                      <h2 className="mt-1 text-xl font-semibold">{p.title}</h2>
                      {p.excerpt && <p className="mt-2 text-sm leading-relaxed text-muted">{p.excerpt}</p>}
                    </div>
                  </GlassPanel>
                </Link>
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
