import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountCard } from "@/components/cards/account-card";
import { PageHeader } from "@/components/layout/page-header";
import { RiskNote } from "@/components/layout/risk-note";
import { PerformanceFilters } from "@/components/performance/filters";
import { Reveal } from "@/components/motion/reveal";
import { GlassPanel } from "@/components/ui/glass-panel";
import { EmptyState } from "@/components/ui/misc";
import { param, type SearchParams } from "@/lib/analytics/filter";
import { sizeBucket } from "@/lib/analytics/rules";
import { getPortfolio } from "@/lib/data/portfolio";
import { formatMoney } from "@/lib/format";
import { PHASE_LABELS, type AccountPhase } from "@/lib/types";

export const metadata: Metadata = {
  title: "Accounts",
  description:
    "Every prop firm challenge and funded account, with balance, rules, profit target progress and distance to breach.",
};

export default function AccountsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <>
      <PageHeader
        eyebrow="Prop firm accounts"
        title="Accounts"
        description="Balance, equity, profit target and how far each account is from its loss limits. Meters turn amber at 50% of a limit used and red at 80%."
      />
      <Suspense
        fallback={
          <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="skeleton h-80" />
            ))}
          </div>
        }
      >
        <AccountsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const PHASE_ORDER: AccountPhase[] = [
  "funded",
  "payout_pending",
  "challenge_phase_2",
  "challenge_phase_1",
  "passed",
  "breached",
  "closed",
];

async function AccountsContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const { views, firms, totals } = await getPortfolio();
  const firm = param(sp, "firm");
  const size = param(sp, "size");
  const phase = param(sp, "phase");

  const filtered = views
    .filter(
      (v) =>
        (!firm || v.account.firm_id === firm) &&
        (!size || sizeBucket(v.account.account_size) === size) &&
        (!phase || v.account.phase === phase),
    )
    .sort((a, b) => PHASE_ORDER.indexOf(a.account.phase) - PHASE_ORDER.indexOf(b.account.phase));
  const sizes = [...new Set(views.map((v) => sizeBucket(v.account.account_size)))];
  const phases = PHASE_ORDER.filter((p) => views.some((v) => v.account.phase === p));

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6">
      {totals.capitalByPhase.length > 0 && (
        <GlassPanel className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
          {totals.capitalByPhase.map((c) => (
            <div key={c.phase}>
              <p className="text-muted text-[11px] tracking-[0.16em] uppercase">{PHASE_LABELS[c.phase]}</p>
              <p className="num mt-1 text-xl font-semibold">{formatMoney(c.capital, { compact: true })}</p>
              <p className="text-muted text-xs">
                {c.count} account{c.count === 1 ? "" : "s"}
              </p>
            </div>
          ))}
        </GlassPanel>
      )}

      {views.length > 0 && (
        <PerformanceFilters
          showRange={false}
          filters={[
            { key: "firm", label: "Firms", options: firms.map((f) => ({ value: f.id, label: f.name })) },
            { key: "size", label: "Sizes", options: sizes.map((s) => ({ value: s, label: s })) },
            { key: "phase", label: "Phases", options: phases.map((p) => ({ value: p, label: PHASE_LABELS[p] })) },
          ]}
        />
      )}

      {filtered.length ? (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v, i) => (
            <Reveal as="li" key={v.account.id} delay={Math.min(i, 6) * 0.05}>
              <AccountCard view={v} />
            </Reveal>
          ))}
        </ul>
      ) : (
        <EmptyState
          title={views.length ? "No accounts match these filters" : "No accounts yet"}
          body={
            views.length ? "Clear a filter to see more." : "Prop firm accounts will appear here once they are added."
          }
        />
      )}
      <RiskNote />
    </div>
  );
}
