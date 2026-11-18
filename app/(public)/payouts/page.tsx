import type { Metadata } from "next";
import { CertificateGallery } from "@/components/cards/certificate-gallery";
import { EquityChart } from "@/components/charts/equity-chart";
import { BreakdownBars } from "@/components/charts/svg-charts";
import { RiskNote } from "@/components/layout/risk-note";
import { CountUp, Reveal } from "@/components/motion/reveal";
import { CoinCanvas } from "@/components/three/lazy-canvas";
import { GlassPanel } from "@/components/ui/glass-panel";
import { EmptyState, Section } from "@/components/ui/misc";
import { ShareButton } from "@/components/ui/share-button";
import { getFirms, getPayouts } from "@/lib/data/public";
import { formatMoney } from "@/lib/format";
import { formatDateIST } from "@/lib/time";

export const metadata: Metadata = {
  title: "Payouts",
  description: "Every payout received from a prop firm, with certificates and verification links.",
};

const METHOD: Record<string, string> = { bank: "Bank", crypto: "Crypto", rise: "Rise", deel: "Deel", other: "Other" };

export default async function PayoutsPage() {
  const [payouts, firms] = await Promise.all([getPayouts(), getFirms()]);
  const firmName = new Map(firms.map((f) => [f.id, f.name]));
  const total = payouts.reduce((s, p) => s + p.amount, 0);
  const asc = [...payouts].sort((a, b) => a.paid_on.localeCompare(b.paid_on));
  const cumulative = asc.map((p, i) => ({
    time: `${p.paid_on}T12:00:00Z`,
    value: asc.slice(0, i + 1).reduce((s, x) => s + x.amount, 0),
  }));
  const byFirm = [...new Set(payouts.map((p) => p.firm_id))]
    .map((id) => {
      const list = payouts.filter((p) => p.firm_id === id);
      return {
        key: firmName.get(id) ?? "Firm",
        net: list.reduce((s, p) => s + p.amount, 0),
        count: list.length,
        wins: list.length,
        winRate: 1,
      };
    })
    .sort((a, b) => b.net - a.net);

  return (
    <>
      <header className="relative isolate overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 pt-14 pb-6 sm:px-6 sm:pt-20 md:grid-cols-[1fr_320px]">
          <div>
            <p className="text-gold mb-3 flex items-center gap-2 text-xs font-medium tracking-[0.25em] uppercase">
              <span className="bg-gold/60 h-px w-6" aria-hidden="true" />
              Paid out
            </p>
            <h1 className="text-4xl font-semibold sm:text-5xl">Payouts</h1>
            <p className="text-muted mt-6 text-[11px] tracking-[0.25em] uppercase">Total received</p>
            <p className="text-gold glow-gold mt-1 text-6xl font-semibold sm:text-7xl">
              <CountUp value={total} format="money" />
            </p>
            <p className="text-muted mt-2 text-sm">
              {payouts.length} payout{payouts.length === 1 ? "" : "s"} from {byFirm.length} firm
              {byFirm.length === 1 ? "" : "s"}
            </p>
            <div className="mt-6">
              <ShareButton
                title={`${formatMoney(total)} in prop firm payouts`}
                path="/payouts"
                imagePath="/payouts/share"
              />
            </div>
          </div>
          <div className="relative mx-auto aspect-square w-64 md:w-full">
            <div
              className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgb(245_196_81/0.25),transparent_65%)]"
              aria-hidden="true"
            />
            <div
              className="border-gold/40 from-gold/30 to-gold/5 absolute inset-[18%] grid place-items-center rounded-full border bg-gradient-to-br shadow-[0_0_60px_rgb(245_196_81/0.3)]"
              aria-hidden="true"
            >
              <span className="text-gold text-5xl">★</span>
            </div>
            <CoinCanvas className="absolute inset-0" />
          </div>
        </div>
      </header>

      {payouts.length === 0 ? (
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <EmptyState
            title="No payouts yet"
            body="Payouts will appear here with their certificates as soon as they are received."
          />
        </div>
      ) : (
        <>
          <Section id="cumulative" title="Cumulative payouts">
            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <GlassPanel className="p-4 sm:p-6">
                <EquityChart
                  label="Cumulative payouts"
                  series={[{ name: "Payouts", color: "#FBBF24", points: cumulative }]}
                  height={280}
                />
              </GlassPanel>
              <GlassPanel className="p-5">
                <h3 className="mb-4 font-semibold">By firm</h3>
                <BreakdownBars label="Payouts by firm" keyLabel="Firm" rows={byFirm} />
              </GlassPanel>
            </div>
            <RiskNote className="mt-4" />
          </Section>

          <Section id="timeline" title="Timeline">
            <ol className="border-gold/30 relative space-y-3 border-l pl-6">
              {payouts.map((p, i) => (
                <Reveal as="li" key={p.id} delay={Math.min(i, 8) * 0.04} className="relative">
                  <span
                    className="border-bg bg-gold absolute top-4 -left-[29px] size-2.5 rounded-full border-2 shadow-[0_0_10px_var(--c-gold)]"
                    aria-hidden="true"
                  />
                  <GlassPanel className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="num text-gold text-lg font-semibold">{formatMoney(p.amount)}</p>
                      <p className="text-muted text-xs">
                        {firmName.get(p.firm_id)} · {METHOD[p.method] ?? p.method}
                        {p.note ? ` · ${p.note}` : ""}
                      </p>
                    </div>
                    <p className="num text-muted text-sm">{formatDateIST(new Date(p.paid_on))}</p>
                  </GlassPanel>
                </Reveal>
              ))}
            </ol>
          </Section>

          <Section id="certificates" title="Certificates">
            <CertificateGallery
              items={payouts.map((p) => ({
                id: p.id,
                amount: p.amount,
                paidOn: p.paid_on,
                firm: firmName.get(p.firm_id) ?? "",
                image:
                  p.certificate_thumb_url ??
                  (p.certificate_url && !p.certificate_url.endsWith(".pdf") ? p.certificate_url : null),
                file: p.certificate_url,
                verificationUrl: p.verification_url,
              }))}
            />
            <RiskNote className="mt-4" />
          </Section>
        </>
      )}
    </>
  );
}
