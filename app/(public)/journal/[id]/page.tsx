import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BeforeAfter } from "@/components/journal/before-after";
import { RiskNote } from "@/components/layout/risk-note";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Markdown } from "@/components/ui/markdown";
import { StatTile, Tag } from "@/components/ui/misc";
import { Pnl, RValue } from "@/components/ui/pnl";
import { ShareButton } from "@/components/ui/share-button";
import { getAccounts, getFirms, getStrategies, getTrade } from "@/lib/data/public";
import { formatMoney, formatPnl } from "@/lib/format";
import { TRADE_SESSION_LABELS } from "@/lib/sessions";
import { formatDateTimeIST } from "@/lib/time";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await getTrade(id);
  if (!data) return { title: "Trade" };
  const t = data.trade;
  return { title: `${t.symbol} ${t.direction} ${formatPnl(t.net_pnl)}`, description: `${t.symbol} ${t.direction} trade closed at ${formatPnl(t.net_pnl)}.` };
}

export default function TradePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl space-y-4 px-4 pt-20 sm:px-6"><div className="skeleton h-12 w-72" /><div className="skeleton h-80" /></div>}>
      <TradeContent params={params} />
    </Suspense>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-2 text-sm last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="num">{value ?? "—"}</dd>
    </div>
  );
}

async function TradeContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, accounts, firms, strategies] = await Promise.all([getTrade(id), getAccounts(), getFirms(), getStrategies()]);
  if (!data) notFound();
  const { trade: t, images } = data;
  const account = accounts.find((a) => a.id === t.account_id);
  const firm = firms.find((f) => f.id === account?.firm_id);
  const strategy = strategies.find((s) => s.id === t.strategy_id);
  const before = images.find((i) => i.kind === "before");
  const after = images.find((i) => i.kind === "after");
  const others = images.filter((i) => i !== before && i !== after);
  const holdMin = t.closed_at ? Math.round((new Date(t.closed_at).getTime() - new Date(t.opened_at).getTime()) / 60_000) : null;

  return (
    <article className="mx-auto max-w-5xl px-4 pt-14 sm:px-6 sm:pt-20">
      <Link href="/journal" className="text-sm text-muted hover:text-fg">
        ← Journal
      </Link>
      <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="num text-sm text-muted">{formatDateTimeIST(new Date(t.opened_at))} IST</p>
          <h1 className="mt-1 text-4xl font-semibold sm:text-5xl">
            {t.symbol} <span className={t.direction === "long" ? "text-accent" : "text-muted"}>{t.direction === "long" ? "Long" : "Short"}</span>
          </h1>
          <p className="mt-2 text-sm text-muted">
            {firm?.name} {account?.label}
            {strategy && (
              <>
                {" · "}
                <Link href={`/strategies/${strategy.slug}`} className="text-accent hover:underline">
                  {strategy.name}
                </Link>
              </>
            )}
            {t.session && ` · ${TRADE_SESSION_LABELS[t.session]}`}
            {t.timeframe && ` · ${t.timeframe}`}
          </p>
        </div>
        <div className="text-right">
          <Pnl value={t.net_pnl} glow className="text-4xl font-semibold" />
          <p className="mt-1">
            <RValue value={t.r_multiple} />
          </p>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Gross P&L">
          <Pnl value={t.pnl} />
        </StatTile>
        <StatTile label="Fees">
          <span className="num">{formatMoney(t.fees)}</span>
        </StatTile>
        <StatTile label="Risk">
          <span className="num">{t.risk_amount ? formatMoney(t.risk_amount) : "—"}</span>
        </StatTile>
        <StatTile label="Held">
          <span className="num">{holdMin === null ? "Open" : holdMin < 60 ? `${holdMin}m` : `${Math.floor(holdMin / 60)}h ${holdMin % 60}m`}</span>
        </StatTile>
      </div>

      {before && after ? (
        <section className="mt-8" aria-label="Screenshots">
          <BeforeAfter before={before.url} after={after.url} alt={`${t.symbol} chart`} />
        </section>
      ) : null}
      {(others.length > 0 || (before && !after) || (!before && after)) && (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {[...(before && !after ? [before] : []), ...(!before && after ? [after] : []), ...others].map((img) => (
            <li key={img.id}>
              {/* eslint-disable-next-line @next/next/no-img-element -- storage images */}
              <img src={img.url} alt={img.caption ?? `${t.symbol} screenshot`} className="w-full rounded-2xl border border-line" loading="lazy" />
              {img.caption && <p className="mt-1 text-xs text-muted">{img.caption}</p>}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <GlassPanel className="p-5">
          <h2 className="mb-2 font-semibold">Plan vs execution</h2>
          <dl>
            <Row label="Entry" value={t.entry_price} />
            <Row label="Stop loss" value={t.stop_loss} />
            <Row label="Take profit" value={t.take_profit} />
            <Row label="Exit" value={t.exit_price} />
            <Row label="Size" value={t.size} />
            <Row label="Closed" value={t.closed_at ? formatDateTimeIST(new Date(t.closed_at)) : "Open"} />
            <Row label="Followed the plan" value={t.followed_plan === null ? "—" : t.followed_plan ? "Yes" : "No"} />
          </dl>
        </GlassPanel>
        <GlassPanel className="space-y-4 p-5">
          <div>
            <h2 className="mb-2 font-semibold">Mindset</h2>
            <p className="text-sm text-muted">
              Before: <span className="text-fg">{t.emotion_before ?? "—"}</span> · After: <span className="text-fg">{t.emotion_after ?? "—"}</span>
            </p>
            {t.rating && (
              <p className="mt-1 text-sm text-muted" aria-label={`Rated ${t.rating} out of 5`}>
                Rating: <span className="text-gold">{"★".repeat(t.rating)}</span>
                <span className="text-white/15">{"★".repeat(5 - t.rating)}</span>
              </p>
            )}
          </div>
          {t.setup_tags.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-xs tracking-[0.16em] text-muted uppercase">Setup</h3>
              <div className="flex flex-wrap gap-1.5">
                {t.setup_tags.map((x) => (
                  <Tag key={x} tone="accent">
                    {x}
                  </Tag>
                ))}
              </div>
            </div>
          )}
          {t.mistake_tags.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-xs tracking-[0.16em] text-muted uppercase">Mistakes</h3>
              <div className="flex flex-wrap gap-1.5">
                {t.mistake_tags.map((x) => (
                  <Tag key={x} tone="loss">
                    {x}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </GlassPanel>
      </div>

      {t.notes && (
        <GlassPanel className="mt-4 p-5 sm:p-6">
          <h2 className="mb-3 font-semibold">Notes</h2>
          <Markdown>{t.notes}</Markdown>
        </GlassPanel>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <ShareButton title={`${t.symbol} ${formatPnl(t.net_pnl)}`} path={`/journal/${t.id}`} imagePath={`/journal/${t.id}/opengraph-image`} />
      </div>
      <RiskNote className="mt-6" />
    </article>
  );
}
