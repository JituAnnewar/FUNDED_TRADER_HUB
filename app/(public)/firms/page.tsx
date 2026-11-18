import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { FirmMark } from "@/components/cards/account-card";
import { PageHeader } from "@/components/layout/page-header";
import { RiskNote } from "@/components/layout/risk-note";
import { Reveal } from "@/components/motion/reveal";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Markdown } from "@/components/ui/markdown";
import { EmptyState, Section } from "@/components/ui/misc";
import { getPortfolio } from "@/lib/data/portfolio";
import { formatMoney } from "@/lib/format";
import type { DrawdownType, Firm } from "@/lib/types";

export const metadata: Metadata = {
  title: "Firms",
  description: "The prop firms I trade with, their rules side by side, my accounts and payouts at each, and an honest review.",
};

const DD: Record<DrawdownType, string> = { static: "Static", trailing_eod: "Trailing (end of day)", trailing_intraday: "Trailing (intraday)" };
const pct = (v: number | null) => (v === null ? "—" : `${v}%`);

const ROWS: { label: string; get: (f: Firm) => string }[] = [
  { label: "Profit split", get: (f) => pct(f.profit_split_pct) },
  { label: "Drawdown type", get: (f) => DD[f.drawdown_type] },
  { label: "Max daily loss", get: (f) => pct(f.max_daily_loss_pct) },
  { label: "Max total loss", get: (f) => pct(f.max_total_loss_pct) },
  { label: "Phase 1 target", get: (f) => pct(f.profit_target_phase1_pct) },
  { label: "Phase 2 target", get: (f) => pct(f.profit_target_phase2_pct) },
  { label: "Min trading days", get: (f) => (f.min_trading_days === null ? "—" : String(f.min_trading_days)) },
  { label: "Consistency rule", get: (f) => (f.consistency_rule_pct === null ? "None" : `${f.consistency_rule_pct}%`) },
  { label: "Payouts", get: (f) => f.payout_frequency ?? "—" },
];

export default async function FirmsPage() {
  const { firms, views, payouts } = await getPortfolio();

  return (
    <>
      <PageHeader eyebrow="Where I trade" title="Firms" description="Rules summarised from each firm's current terms at the time of writing. Always check the firm's own website before you buy a challenge." />
      {firms.length === 0 ? (
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <EmptyState title="No firms listed yet" body="The prop firms I trade with will be listed here with their rules and my review." />
        </div>
      ) : (
        <>
          <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6">
            {firms.map((f, i) => {
              const accs = views.filter((v) => v.account.firm_id === f.id);
              const paid = payouts.filter((p) => p.firm_id === f.id);
              const paidTotal = paid.reduce((s, p) => s + p.amount, 0);
              return (
                <Reveal key={f.id} delay={i * 0.05}>
                  <GlassPanel className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_1.2fr]">
                    <div>
                      <div className="flex items-center gap-3">
                        <FirmMark name={f.name} logo={f.logo_url} className="size-12" />
                        <div>
                          <h2 className="text-xl font-semibold">{f.name}</h2>
                          {f.website && (
                            <a href={f.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                              Website <ExternalLink className="size-3" aria-hidden="true" />
                            </a>
                          )}
                        </div>
                      </div>
                      {f.description && <p className="mt-4 text-sm leading-relaxed text-muted">{f.description}</p>}
                      <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <dt className="text-xs text-muted">Accounts</dt>
                          <dd className="num text-lg">{accs.length}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted">Capital</dt>
                          <dd className="num text-lg">{formatMoney(accs.filter((v) => v.isActive).reduce((s, v) => s + v.account.account_size, 0), { compact: true })}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted">Paid out</dt>
                          <dd className="num text-lg text-gold">{formatMoney(paidTotal, { compact: true })}</dd>
                        </div>
                      </dl>
                    </div>
                    <div>
                      <h3 className="mb-2 text-xs tracking-[0.16em] text-muted uppercase">My review</h3>
                      {f.personal_review ? <Markdown>{f.personal_review}</Markdown> : <p className="text-sm text-muted">No review written yet.</p>}
                    </div>
                  </GlassPanel>
                </Reveal>
              );
            })}
            <RiskNote />
          </div>

          <Section id="compare" title="Rules side by side">
            <div className="overflow-x-auto rounded-2xl border border-line">
              <table className="w-full min-w-[560px] text-sm">
                <caption className="sr-only">Prop firm rules comparison</caption>
                <thead className="bg-white/[0.02]">
                  <tr>
                    <th scope="col" className="sticky left-0 bg-surface px-4 py-3 text-left text-[11px] font-medium tracking-[0.12em] text-muted uppercase">
                      Rule
                    </th>
                    {firms.map((f) => (
                      <th key={f.id} scope="col" className="px-4 py-3 text-left font-semibold">
                        {f.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((r) => (
                    <tr key={r.label} className="border-t border-line">
                      <th scope="row" className="sticky left-0 bg-surface px-4 py-2.5 text-left font-normal text-muted">
                        {r.label}
                      </th>
                      {firms.map((f) => (
                        <td key={f.id} className="num px-4 py-2.5">
                          {r.get(f)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}
    </>
  );
}
