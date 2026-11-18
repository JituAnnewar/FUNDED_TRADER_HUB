import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Prose } from "@/components/layout/prose";
import { getSettings } from "@/lib/data/public";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "This site is for education and journaling only. It is not financial advice.",
};

export default async function DisclaimerPage() {
  const settings = await getSettings();
  return (
    <>
      <PageHeader eyebrow="Legal" title="Disclaimer" />
      <Prose>
        <p>
          <strong>{settings.brand_name || SITE.brand}</strong> is a personal trading journal and portfolio. Everything on this site is
          published for education and journaling purposes only.
        </p>

        <h2>Not financial advice</h2>
        <p>
          Nothing on this site is financial, investment, tax or legal advice, and nothing here is a solicitation or
          recommendation to buy or sell any financial instrument. I am not a licensed financial adviser. Make your
          own decisions and speak to a qualified professional before you trade.
        </p>

        <h2>Past performance</h2>
        <p>
          Past performance does not guarantee future results. The trades, statistics and payouts shown here
          describe what happened in the past. They do not predict what will happen next, for me or for anyone else.
        </p>

        <h2>Prop firm accounts</h2>
        <p>
          Most prop firm accounts, including challenge and funded accounts, trade simulated capital. Payouts are
          paid by the prop firm under its own terms, not by a market or a broker. Account sizes shown on this site
          are the firm&apos;s notional account sizes, not money I have deposited.
        </p>

        <h2>Risk</h2>
        <p>
          Trading forex, gold, indices, futures and crypto carries a substantial risk of loss and is not suitable
          for everyone. Leveraged products can lose money quickly. Only trade with money you can afford to lose.
        </p>

        <h2>Tools and calculators</h2>
        <p>
          The calculators and simulators on this site are simplified models for learning. Check every figure with
          your own broker or prop firm before relying on it.
        </p>

        <h2>Affiliate links</h2>
        <p>
          Some links in the toolkit are affiliate links and are labelled as such. I may earn a commission if you
          sign up through them, at no extra cost to you.
        </p>
        {settings.disclaimer_text && (
          <>
            <h2>Additional notes</h2>
            <p className="whitespace-pre-line">{settings.disclaimer_text}</p>
          </>
        )}
      </Prose>
    </>
  );
}
