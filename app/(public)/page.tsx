import { ArrowDown, ArrowRight, ArrowUpRight, Mail } from "lucide-react";
import Link from "next/link";
import { AccountCard } from "@/components/cards/account-card";
import { GoalList } from "@/components/cards/goal-list";
import { PayoutCard } from "@/components/cards/payout-card";
import { EquityChart } from "@/components/charts/equity-chart";
import { HeroGlobe, ReplayIntroButton } from "@/components/home/hero-globe";
import { SessionBoard } from "@/components/home/session-board";
import { RiskNote } from "@/components/layout/risk-note";
import { TradingViewWidget } from "@/components/layout/tradingview-widget";
import { CountUp, Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { EmptyState, Section } from "@/components/ui/misc";
import { equityCurve, summarize, tradingDays } from "@/lib/analytics/trades";
import { getGoalProgress, getPortfolio } from "@/lib/data/portfolio";
import { getSettings, getStrategies, getToolkit } from "@/lib/data/public";

/** Star streaks for the warp-speed opening (deterministic, so server and client match). */
const WARP = Array.from({ length: 64 }, (_, i) => ({
  a: `${((i * 137.508) % 360).toFixed(1)}deg`,
  d: `${((i * 0.0371) % 0.9).toFixed(2)}s`,
}));

function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group text-accent inline-flex items-center gap-1 text-sm">
      {children}
      <ArrowUpRight
        className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}

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

  const stats: { label: string; node: React.ReactNode; tone?: string }[] = [
    {
      label: "Total payouts",
      node: <CountUp value={totals.totalPayouts} format="moneyCompact" />,
      tone: "text-gold glow-gold",
    },
    { label: "Funded capital", node: <CountUp value={totals.fundedCapital} format="moneyCompact" /> },
    {
      label: "Win rate",
      node:
        s.winRate === null ? <span className="text-muted">—</span> : <CountUp value={s.winRate * 100} format="pct" />,
    },
    {
      label: "Profit factor",
      node:
        s.profitFactor === null ? (
          <span className="text-muted">—</span>
        ) : s.profitFactor === Infinity ? (
          <span className="num">∞</span>
        ) : (
          <CountUp value={s.profitFactor} format="decimal" />
        ),
    },
  ];

  return (
    <>
      {/* ── Hero: cinematic intro (stars warp → globe flies in → headline settles) ── */}
      <section aria-labelledby="hero-title" className="relative isolate -mt-[var(--nav-h)] overflow-hidden">
        <div className="intro-warp" aria-hidden="true">
          {WARP.map((w, i) => (
            <i key={i} style={{ ["--a" as string]: w.a, ["--d" as string]: w.d }} />
          ))}
        </div>

        <HeroGlobe className="absolute inset-x-[-30%] top-[-4%] -z-10 h-[52%] opacity-70 sm:inset-x-[-12%] sm:top-[2%] sm:h-[58%] sm:opacity-100 lg:inset-x-auto lg:top-[3%] lg:right-[-6%] lg:h-[94%] lg:w-[60%]" />
        {/* Legibility: fade the globe behind the text */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_top,var(--c-bg)_45%,rgb(5_6_15/0.55)_62%,transparent_82%)] sm:bg-[linear-gradient(to_top,var(--c-bg)_25%,transparent_65%)] lg:bg-[linear-gradient(90deg,var(--c-bg)_18%,rgb(5_6_15/0.6)_42%,transparent_62%)]" />
        <div className="from-bg pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t to-transparent" />

        <div className="mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pt-[calc(var(--nav-h)+2rem)] pb-8 sm:px-6 lg:justify-center lg:pb-12">
          <div className="max-w-xl">
            <p
              className="intro-rise border-line-strong text-violet-soft mb-5 inline-flex items-center gap-2 rounded-full border bg-white/[0.03] px-3 py-1 text-[11px] font-medium tracking-[0.25em] uppercase backdrop-blur-md"
              style={{ ["--d" as string]: "1.2s" }}
            >
              <span className="animate-pulse-dot bg-profit text-profit size-1.5 rounded-full" aria-hidden="true" />
              Funded trader · Forex &amp; Gold
            </p>
            <h1
              id="hero-title"
              className="intro-title font-display text-[clamp(4.25rem,17vw,9.5rem)] leading-[0.86] font-semibold tracking-[-0.045em]"
            >
              <span className="text-gradient">{settings.trader_name}</span>
            </h1>
            <p
              className="intro-rise font-display text-fg/80 mt-5 text-base tracking-[0.55em] sm:text-lg"
              style={{ ["--d" as string]: "2s" }}
            >
              {settings.tagline}
            </p>
            <p
              className="intro-rise text-muted mt-6 max-w-md text-base leading-relaxed sm:text-lg"
              style={{ ["--d" as string]: "2.2s" }}
            >
              {settings.hero_copy ??
                "A live, public record of my prop firm accounts, trades and payouts. Updated every trading day."}
            </p>
            <div className="intro-rise mt-8 flex flex-wrap gap-3" style={{ ["--d" as string]: "2.4s" }}>
              <Button asChild size="lg" data-magnetic>
                <Link href="/performance">
                  Track record <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" data-magnetic>
                <Link href="/payouts">Payouts</Link>
              </Button>
            </div>
          </div>

          <SessionBoard className="intro-rise mt-12 lg:mt-16 lg:max-w-2xl" />
          <div className="intro-rise mt-5 flex items-center justify-between" style={{ ["--d" as string]: "2.8s" }}>
            <a
              href="#numbers"
              className="text-muted hover:text-fg inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase"
            >
              <ArrowDown className="size-3.5 animate-bounce" aria-hidden="true" /> Scroll
            </a>
            <ReplayIntroButton />
          </div>
        </div>
      </section>

      {/* ── The numbers: four only ─────────────────────── */}
      <section
        id="numbers"
        aria-labelledby="numbers-title"
        className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24"
      >
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-violet-soft mb-3 text-[11px] font-medium tracking-[0.3em] uppercase">At a glance</p>
              <h2 id="numbers-title" className="max-w-xl text-3xl font-semibold text-balance sm:text-5xl">
                Real accounts. <span className="text-brand">Real payouts.</span>
              </h2>
            </div>
            <MoreLink href="/performance">All {days} trading days</MoreLink>
          </div>
        </Reveal>
        <ul className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((st, i) => (
            <Reveal as="li" key={st.label} delay={i * 0.08}>
              <GlassPanel className="spotlight h-full p-5 sm:p-7" data-spotlight>
                <p className="text-muted text-[11px] font-medium tracking-[0.2em] uppercase">{st.label}</p>
                <p className={`mt-3 text-3xl font-semibold sm:text-5xl ${st.tone ?? ""}`}>{st.node}</p>
              </GlassPanel>
            </Reveal>
          ))}
        </ul>
        <RiskNote className="mt-4" />
        {!hasData && (
          <div className="mt-6">
            <EmptyState
              title="The record starts soon"
              body="Accounts, trades and payouts will show here as soon as they are published."
            />
          </div>
        )}
      </section>

      {/* ── Equity curve ───────────────────────────────── */}
      {curve.length > 1 && (
        <Section
          id="equity"
          eyebrow="Track record"
          title="One curve, every account"
          action={<MoreLink href="/performance">Full performance</MoreLink>}
        >
          <Reveal>
            <GlassPanel className="overflow-hidden p-4 sm:p-8">
              <EquityChart
                label="Cumulative net P&L across all accounts"
                series={[{ name: "Net P&L", color: "#22D3EE", points: curve }]}
                height={320}
              />
            </GlassPanel>
          </Reveal>
          <RiskNote className="mt-4" />
        </Section>
      )}

      {settings.show_tradingview_widgets && (
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <TradingViewWidget />
        </div>
      )}

      {/* ── Latest payouts ─────────────────────────────── */}
      {show("payouts") && payouts.length > 0 && (
        <Section
          id="latest-payouts"
          eyebrow="Paid out"
          title="Latest payouts"
          action={<MoreLink href="/payouts">All payouts</MoreLink>}
        >
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {payouts.slice(0, 3).map((p, i) => (
              <Reveal as="li" key={p.id} delay={i * 0.08}>
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
          title="Accounts I am trading"
          action={<MoreLink href="/accounts">All accounts</MoreLink>}
        >
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {active.map((v, i) => (
              <Reveal as="li" key={v.account.id} delay={i * 0.08}>
                <AccountCard view={v} />
              </Reveal>
            ))}
          </ul>
          <RiskNote className="mt-4" />
        </Section>
      )}

      {/* ── How I trade ────────────────────────────────── */}
      {show("strategies") && strategies.length > 0 && (
        <Section
          id="strategies"
          eyebrow="Playbook"
          title="How I trade"
          action={<MoreLink href="/strategies">All strategies</MoreLink>}
        >
          <ol className="grid gap-4 md:grid-cols-3">
            {strategies.slice(0, 3).map((st, i) => (
              <Reveal as="li" key={st.id} delay={i * 0.08}>
                <Link href={`/strategies/${st.slug}`} className="group block h-full rounded-[1.25rem]">
                  <GlassPanel
                    className="spotlight flex h-full flex-col p-6 transition-transform duration-300 group-hover:-translate-y-1"
                    data-spotlight
                  >
                    <span className="num text-4xl font-semibold text-white/10">{String(i + 1).padStart(2, "0")}</span>
                    <p className="text-accent mt-4 text-[11px] tracking-[0.2em] uppercase">
                      {st.timeframes.join(" · ")}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">{st.name}</h3>
                    <p className="text-muted mt-2 line-clamp-3 text-sm leading-relaxed">{st.summary}</p>
                    <span className="text-violet-soft mt-auto inline-flex items-center gap-1 pt-5 text-sm">
                      Read the plan{" "}
                      <ArrowRight
                        className="size-4 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </span>
                  </GlassPanel>
                </Link>
              </Reveal>
            ))}
          </ol>
        </Section>
      )}

      {/* ── Goals ──────────────────────────────────────── */}
      {show("goals") && goals.length > 0 && (
        <Section id="goals" eyebrow="Working towards" title="Goals">
          <GoalList goals={goals} />
        </Section>
      )}

      {/* ── Toolkit: one moving line instead of a grid ─── */}
      {show("toolkit") && toolkit.length > 0 && (
        <section
          aria-label="What I use"
          className="border-line relative mt-8 overflow-hidden border-y [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)] py-5"
        >
          <ul className="animate-marquee font-display text-muted flex w-max gap-10 pr-10 text-lg [--marquee-duration:50s] hover:[animation-play-state:paused]">
            {[...toolkit.slice(0, 10), ...toolkit.slice(0, 10)].map((t, i) => (
              <li
                key={`${t.id}-${i}`}
                aria-hidden={i >= Math.min(10, toolkit.length) || undefined}
                className="flex items-center gap-10 whitespace-nowrap"
              >
                {t.name}
                <span className="bg-violet size-1 rounded-full" aria-hidden="true" />
              </li>
            ))}
          </ul>
          <div className="mt-3 text-center">
            <MoreLink href="/toolkit">Full toolkit</MoreLink>
          </div>
        </section>
      )}

      {/* ── Contact CTA ────────────────────────────────── */}
      <section aria-labelledby="cta-title" className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <Reveal>
          <div className="border-line-strong relative overflow-hidden rounded-[1.75rem] border bg-[radial-gradient(80%_120%_at_0%_0%,rgb(124_92_255/0.35),transparent_60%),radial-gradient(70%_120%_at_100%_100%,rgb(34_211_238/0.22),transparent_60%)] p-8 sm:p-14">
            <div className="orbit -top-24 -right-24 size-72 opacity-60" aria-hidden="true" />
            <h2 id="cta-title" className="max-w-2xl text-3xl font-semibold text-balance sm:text-5xl">
              Mentorship, collaboration or a question?
            </h2>
            <p className="text-muted mt-4 max-w-lg">
              Send a message. I read every one and reply to the ones I can help with.
            </p>
            <Button asChild size="lg" className="mt-8" data-magnetic>
              <Link href="/contact">
                <Mail aria-hidden="true" /> Get in touch
              </Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
