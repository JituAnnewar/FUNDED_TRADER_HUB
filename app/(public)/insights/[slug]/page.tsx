import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Markdown, readingTime } from "@/components/ui/markdown";
import { ShareButton } from "@/components/ui/share-button";
import { getPosts } from "@/lib/data/public";
import { formatDateIST } from "@/lib/time";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = (await getPosts()).find((x) => x.slug === slug);
  return p ? { title: p.title, description: p.excerpt ?? undefined, openGraph: { type: "article", publishedTime: p.published_at ?? undefined } } : { title: "Post" };
}

export default function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl space-y-4 px-4 pt-20 sm:px-6"><div className="skeleton h-12" /><div className="skeleton h-96" /></div>}>
      <PostContent params={params} />
    </Suspense>
  );
}

async function PostContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = (await getPosts()).find((x) => x.slug === slug && x.published_at);
  if (!p) notFound();
  return (
    <article className="mx-auto max-w-3xl px-4 pt-14 sm:px-6 sm:pt-20">
      <Link href="/insights" className="text-sm text-muted hover:text-fg">
        ← Insights
      </Link>
      <p className="num mt-6 text-sm text-muted">
        {formatDateIST(new Date(p.published_at!))} · {readingTime(p.body)} min read
      </p>
      <h1 className="mt-2 text-4xl font-semibold text-balance sm:text-5xl">{p.title}</h1>
      {p.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element -- storage image
        <img src={p.cover_url} alt="" className="mt-8 w-full rounded-2xl border border-line" />
      )}
      <Markdown className="mt-8 text-base">{p.body}</Markdown>
      <div className="mt-10 border-t border-line pt-6">
        <ShareButton title={p.title} path={`/insights/${p.slug}`} />
      </div>
    </article>
  );
}
