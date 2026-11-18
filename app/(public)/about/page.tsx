import type { Metadata } from "next";
import { GoalList } from "@/components/cards/goal-list";
import { PageHeader } from "@/components/layout/page-header";
import { Reveal } from "@/components/motion/reveal";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Markdown } from "@/components/ui/markdown";
import { Section } from "@/components/ui/misc";
import { getGoalProgress } from "@/lib/data/portfolio";
import { getMilestones, getSettings } from "@/lib/data/public";
import { formatDateIST } from "@/lib/time";

export const metadata: Metadata = {
  title: "About",
  description: "How I got here, the milestones so far and what I am working towards.",
};

const DEFAULT_ABOUT = `I trade forex and gold with prop firm capital. My approach is simple: a small number of setups, strict risk, and a journal entry for every trading day.

**Less is more.** Fewer trades, fewer indicators, fewer excuses.

This site is my public record. Every account, trade and payout is logged here, the good days and the bad ones.`;

export default async function AboutPage() {
  const [settings, milestones, goals] = await Promise.all([getSettings(), getMilestones(), getGoalProgress()]);
  return (
    <>
      <PageHeader eyebrow="About me" title={settings.trader_name} description={settings.tagline} />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[280px_1fr]">
        <div>
          {settings.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- storage image
            <img src={settings.avatar_url} alt={`Photo of ${settings.trader_name}`} className="aspect-square w-full rounded-2xl border border-line object-cover" />
          ) : (
            <div className="grid aspect-square w-full place-items-center rounded-2xl border border-line bg-gradient-to-br from-elevated to-surface" aria-hidden="true">
              <span className="font-display text-6xl font-semibold text-gradient">{settings.trader_name.slice(0, 1)}</span>
            </div>
          )}
        </div>
        <GlassPanel className="p-6 sm:p-8">
          <Markdown>{settings.about_text ?? DEFAULT_ABOUT}</Markdown>
        </GlassPanel>
      </div>

      {milestones.length > 0 && (
        <Section id="milestones" title="Milestones">
          <ol className="relative space-y-6 border-l border-line pl-8">
            {milestones.map((m, i) => (
              <Reveal as="li" key={m.id} delay={i * 0.05} className="relative">
                <span className="absolute top-1.5 -left-[38px] grid size-4 place-items-center rounded-full border border-accent bg-bg" aria-hidden="true">
                  <span className="size-1.5 rounded-full bg-accent" />
                </span>
                <p className="num text-xs text-accent">{formatDateIST(new Date(m.date))}</p>
                <h3 className="mt-0.5 text-lg font-semibold">{m.title}</h3>
                {m.description && <p className="text-sm text-muted">{m.description}</p>}
              </Reveal>
            ))}
          </ol>
        </Section>
      )}

      {goals.length > 0 && (
        <Section id="goals" title="Goals">
          <GoalList goals={goals} />
        </Section>
      )}
    </>
  );
}
