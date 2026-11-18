import { ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { AccountCard } from "@/components/cards/account-card";
import { GoalList } from "@/components/cards/goal-list";
import { PayoutCard } from "@/components/cards/payout-card";
import { EquityChart } from "@/components/charts/equity-chart";
import { RiskNote } from "@/components/layout/risk-note";
import { TradingViewWidget } from "@/components/layout/tradingview-widget";
import { CountUp, Reveal } from "@/components/motion/reveal";
import { HeroPoster } from "@/components/three/hero-poster";
import { HeroCanvas } from "@/components/three/lazy-canvas";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { EmptyState, Section, StatTile } from "@/components/ui/misc";
import { equityCurve, summarize, tradingDays } from "@/lib/analytics/trades";
import { getGoalProgress, getPortfolio } from "@/lib/data/portfolio";
import { getSettings, getStrategies, getToolkit } from "@/lib/data/public";

export default async function HomePage() {
  const [settings, portfolio, strategies, toolkit, goals] = await Promise.all([
    getSettings(),
    getPortfolio(),
    getStrategies(),
    getToolkit(),
    getGoalProgress(),
  ]);
  const { totals, views, trades, payouts, firms } = portfolio;
  const s = summarize(trades);
  const days = tradingDays(trades);
  const firmName = new Map(firms.map((f) => [f.id, f.name]));
  const active = views.filter((v) => v.isActive).slice(0, 3);
  const curve = equityCurve(trades);
  const show = (k: keyof typeof settings.sections) => settings.sections[k] !== false;
  const hasData = trades.length > 0 || payouts.length > 0 || views.length > 0;

  return (
    <>
      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <HeroPoster className="absolute inset-x-0 bottom-0 h-[70%] w-full opacity-80" />
          <HeroCanvas className="absolute inset-0" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_30%_40%,rgb(5_7_10/0.75),transparent_70%)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg to-transparent" />
        </div>

        <div className="mx-auto flex min-h-[calc(100svh-var(--nav-h)-2.25rem)] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6">
          <p className="mb-6 flex items-center gap-2 text-xs font-medium tracking-[0.3em] text-accent uppercase">
            <span className="size-1.5 rounded-full bg-profit shadow-[0_0_10px_var(--c-profit)]" aria-hidden="true" />
            Funded trader · Forex &amp; Gold
          </p>
          <h1 className="font-display text-[clamp(3.5rem,14vw,10rem)] leading-[0.9] font-semibold tracking-[-0.04em]">
            <span className="text-gradient">{settings.trader_name}</span>
          </h1>
          <p className="mt-5 font-display text-lg tracking-[0.45em] text-muted sm:text-xl">{settings.tagline}</p>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {settings.hero_copy ??
              "A public, live record of my prop firm accounts, trades and payouts. Every number on this site comes from the journal I keep each trading day."}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" data-magnetic>
              <Link href="/performance">
                See performance <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" data-magnetic>
              <Link href="/payouts">View payouts</Link>
            </Button>
          </div>

          <div className="mt-14">
            <p className="text-[11px] tracking-[0.25em] text-muted uppercase">Total payouts</p>
            <p className="mt-1 text-5xl font-semibold text-gold glow-gold sm:text-6xl">
              <CountUp value={totals.totalPayouts} format="money" />
            </p>
          </div>
        </div>
      </section>

      {/* ── Headline stats ─────────────────────────────── */}
      <Section id="stats" eyebrow="At a glance" title="The numbers">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <StatTile label="Total payouts">
            <CountUp value={totals.totalPayouts} format="moneyCompact" className="text-gold" />
          </StatTile>
          <StatTile label="Funded capital">
            <CountUp value={totals.fundedCapital} format="moneyCompact" />
          </StatTile>
          <StatTile label="Funded accounts">
            <CountUp value={totals.fundedAccounts} />
          </StatTile>
          <StatTile label="Win rate" sub={s.breakeven ? `${s.breakeven} break-even` : undefined}>
            {s.winRate === null ? <span className="text-muted">—</span> : <CountUp value={s.winRate * 100} format="pct" />}
          </StatTile>
          <StatTile label="Profit factor">
            {s.profitFactor === null ? (
              <span className="text-muted">—</span>
            ) : s.profitFactor === Infinity ? (
              <span className="num">∞</span>
            ) : (
              <CountUp value={s.profitFactor} format="decimal" />
            )}
          </StatTile>
          <StatTile label="Trading days">
            <CountUp value={days} />
          </StatTile>
        </div>
        <RiskNote className="mt-4" />
        {!hasData && (
          <div className="mt-6">
            <EmptyState title="The record starts soon" body="Accounts, trades and payouts will show here as soon as they are published." />
          </div>
        )}
      </Section>

      {settings.show_tradingview_widgets && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <TradingViewWidget />
        </div>
      )}

      {/* ── Latest payouts ─────────────────────────────── */}
      {show("payouts") && payouts.length > 0 && (
        <Section
          id="latest-payouts"
          eyebrow="Paid out"
          title="Latest payouts"
          action={
            <Link href="/payouts" className="text-sm text-accent hover:underline">
              All payouts →
            </Link>
          }
        >
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {payouts.slice(0, 4).map((p, i) => (
              <Reveal as="li" key={p.id} delay={i * 0.06}>
                <PayoutCard payout={p} firmName={firmName.get(p.firm_id) ?? ""} />
              </Reveal>
            ))}
          </ul>
          <RiskNote className="mt-4" />
        </Section>
      )}

      {/* ── Active accounts ────────────────────────────── */}
      {show("accounts") && active.length > 0 && (
        <Section
          id="active-accounts"
          eyebrow="Live"
          title="Active accounts"
          action={
            <Link href="/accounts" className="text-sm text-accent hover:underline">
              All accounts →
            </Link>
          }
        >
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {active.map((v, i) => (
              <Reveal as="li" key={v.account.id} delay={i * 0.06}>
                <AccountCard view={v} />
              </Reveal>
            ))}
          </ul>
          <RiskNote className="mt-4" />
        </Section>
      )}

      {/* ── Equity teaser ──────────────────────────────── */}
      {curve.length > 1 && (
        <Section
          id="equity"
          eyebrow="Track record"
          title="Cumulative P&L, all accounts"
          action={
            <Link href="/performance" className="text-sm text-accent hover:underline">
              Full performance →
            </Link>
          }
        >
          <GlassPanel className="p-4 sm:p-6">
            <EquityChart label="Cumulative net P&L across all accounts" series={[{ name: "Net P&L", color: "#16F2A0", points: curve }]} height={280} />
          </GlassPanel>
          <RiskNote className="mt-4" />
        </Section>
      )}

      {/* ── Strategies teaser ──────────────────────────── */}
      {show("strategies") && strategies.length > 0 && (
        <Section
          id="strategies"
          eyebrow="Playbook"
          title="How I trade"
          action={
            <Link href="/strategies" className="text-sm text-accent hover:underline">
              All strategies →
            </Link>
          }
        >
          <ul className="grid gap-4 md:grid-cols-3">
            {strategies.slice(0, 3).map((st, i) => (
              <Reveal as="li" key={st.id} delay={i * 0.06}>
                <Link href={`/strategies/${st.slug}`} className="block h-full rounded-2xl">
                  <GlassPanel className="h-full p-5 transition-colors hover:bg-white/[0.02]">
                    <p className="text-[11px] tracking-[0.2em] text-accent uppercase">{st.timeframes.join(" · ")}</p>
                    <h3 className="mt-2 text-lg font-semibold">{st.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{st.summary}</p>
                  </GlassPanel>
                </Link>
              </Reveal>
            ))}
          </ul>
        </Section>
      )}

      {/* ── Goals ──────────────────────────────────────── */}
      {show("goals") && goals.length > 0 && (
        <Section id="goals" eyebrow="Working towards" title="Goals">
          <GoalList goals={goals} />
        </Section>
      )}

      {/* ── Toolkit teaser ─────────────────────────────── */}
      {show("toolkit") && toolkit.length > 0 && (
        <Section
          id="toolkit"
          eyebrow="Setup"
          title="What I use"
          action={
            <Link href="/toolkit" className="text-sm text-accent hover:underline">
              Full toolkit →
            </Link>
          }
        >
          <ul className="flex flex-wrap gap-2">
            {toolkit.slice(0, 8).map((t) => (
              <li key={t.id} className="rounded-full border border-line bg-white/[0.02] px-4 py-2 text-sm">
                {t.name}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ── Contact CTA ────────────────────────────────── */}
      <Section id="contact-cta" title="Mentorship, collaboration or a question?" className="pb-4">
        <GlassPanel className="flex flex-col items-start justify-between gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
          <p className="max-w-xl text-muted">Send a message. I read every one and reply to the ones I can help with.</p>
          <Button asChild size="lg" data-magnetic>
            <Link href="/contact">
              <Mail aria-hidden="true" /> Get in touch
            </Link>
          </Button>
        </GlassPanel>
      </Section>
    </>
  );
}
