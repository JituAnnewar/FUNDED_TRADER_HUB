import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TradeTable } from "@/components/cards/trade-table";
import { SearchBox } from "@/components/journal/search-box";
import { PageHeader } from "@/components/layout/page-header";
import { RiskNote } from "@/components/layout/risk-note";
import { PerformanceFilters } from "@/components/performance/filters";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Markdown } from "@/components/ui/markdown";
import { EmptyState, Tag } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { Pnl } from "@/components/ui/pnl";
import { dayKey } from "@/lib/analytics/dates";
import { filterTrades, param, parseFilters, type SearchParams } from "@/lib/analytics/filter";
import { getPortfolio } from "@/lib/data/portfolio";
import { getJournalEntries, getStrategies } from "@/lib/data/public";
import { TRADE_SESSION_LABELS, type TradeSession } from "@/lib/sessions";
import { formatDateIST } from "@/lib/time";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Every public trade with screenshots, notes, emotions and lessons, plus the daily pre-market plan and review.",
};

const PER_PAGE = 25;

export default function JournalPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <>
      <PageHeader
        eyebrow="Trade log"
        title="Journal"
        description="Every trade I make public, and the plan and review I write each trading day."
      />
      <Suspense
        fallback={
          <div className="mx-auto max-w-6xl space-y-2 px-4 sm:px-6">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="skeleton h-12" />
            ))}
          </div>
        }
      >
        <JournalContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function JournalContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const view = param(sp, "view") === "days" ? "days" : "trades";
  const page = Math.max(1, Number(param(sp, "page") ?? 1) || 1);
  const flat: Record<string, string | undefined> = Object.fromEntries(Object.keys(sp).map((k) => [k, param(sp, k)]));

  const tabs = (
    <div
      className="border-line inline-flex gap-1 rounded-xl border bg-white/[0.02] p-1"
      role="tablist"
      aria-label="Journal view"
    >
      {(["trades", "days"] as const).map((v) => (
        <Link
          key={v}
          role="tab"
          aria-selected={view === v}
          href={v === "trades" ? "/journal" : "/journal?view=days"}
          className={cn(
            "rounded-lg px-4 py-1.5 text-sm",
            view === v
              ? "bg-[image:var(--grad-button)] text-white shadow-[0_6px_18px_-8px_rgb(124_92_255/0.9)]"
              : "text-muted hover:text-fg",
          )}
        >
          {v === "trades" ? "Trades" : "Daily journal"}
        </Link>
      ))}
    </div>
  );

  if (view === "days") {
    const entries = await getJournalEntries();
    const q = param(sp, "q")?.toLowerCase();
    const list = q
      ? entries.filter((e) =>
          `${e.pre_market_plan} ${e.post_market_review} ${e.lessons} ${e.tags.join(" ")}`.toLowerCase().includes(q),
        )
      : entries;
    const pages = Math.max(1, Math.ceil(list.length / 10));
    const slice = list.slice((page - 1) * 10, page * 10);
    return (
      <div className="mx-auto max-w-4xl space-y-5 px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {tabs}
          <SearchBox placeholder="Search the journal" />
        </div>
        {slice.length ? (
          <ol className="space-y-4">
            {slice.map((e) => (
              <li key={e.id}>
                <GlassPanel className="p-5 sm:p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="num text-lg font-semibold">{formatDateIST(new Date(e.date))}</h2>
                    <div className="flex flex-wrap gap-1.5">
                      {e.mood && <Tag>Mood {e.mood}/5</Tag>}
                      {e.focus && <Tag>Focus {e.focus}/5</Tag>}
                      {e.tags.map((t) => (
                        <Tag key={t} tone="accent">
                          {t}
                        </Tag>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <h3 className="text-muted mb-1.5 text-xs tracking-[0.16em] uppercase">Pre-market plan</h3>
                      <Markdown className="text-sm">{e.pre_market_plan ?? "—"}</Markdown>
                    </div>
                    <div>
                      <h3 className="text-muted mb-1.5 text-xs tracking-[0.16em] uppercase">Post-market review</h3>
                      <Markdown className="text-sm">{e.post_market_review ?? "—"}</Markdown>
                    </div>
                  </div>
                  {e.lessons && (
                    <p className="border-accent/20 bg-accent/5 mt-4 rounded-lg border px-3 py-2 text-sm">
                      <span className="text-accent">Lesson:</span> {e.lessons}
                    </p>
                  )}
                </GlassPanel>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            title="No journal entries"
            body={q ? "Nothing matches that search." : "Daily plans and reviews will appear here."}
          />
        )}
        <Pagination page={page} pages={pages} basePath="/journal" params={flat} />
      </div>
    );
  }

  const [{ trades: all, accounts, firms, generatedAt }, strategies] = await Promise.all([
    getPortfolio(),
    getStrategies(),
  ]);
  const trades = filterTrades(all, parseFilters(sp), accounts, new Date(generatedAt));
  const pages = Math.max(1, Math.ceil(trades.length / PER_PAGE));
  const current = Math.min(page, pages);
  const slice = trades.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const accountLabel = new Map(
    accounts.map((a) => [a.id, `${firms.find((f) => f.id === a.firm_id)?.name ?? ""} ${a.label}`.trim()]),
  );
  const net = trades.reduce((s, t) => s + t.net_pnl, 0);
  const today = dayKey(new Date(generatedAt));

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {tabs}
        <SearchBox placeholder="Search symbol, tag or note" />
      </div>
      <PerformanceFilters
        filters={[
          {
            key: "account",
            label: "Accounts",
            options: accounts.map((a) => ({ value: a.id, label: accountLabel.get(a.id) ?? a.label })),
          },
          { key: "strategy", label: "Strategies", options: strategies.map((s) => ({ value: s.id, label: s.name })) },
          {
            key: "symbol",
            label: "Symbols",
            options: [...new Set(all.map((t) => t.symbol))].sort().map((s) => ({ value: s, label: s })),
          },
          {
            key: "session",
            label: "Sessions",
            options: (Object.keys(TRADE_SESSION_LABELS) as TradeSession[]).map((s) => ({
              value: s,
              label: TRADE_SESSION_LABELS[s],
            })),
          },
          {
            key: "direction",
            label: "Directions",
            options: [
              { value: "long", label: "Long" },
              { value: "short", label: "Short" },
            ],
          },
        ]}
      />
      <p className="text-muted text-sm">
        <span className="num text-fg">{trades.length}</span> trades · net <Pnl value={net} />
        {trades.some((t) => dayKey(t.opened_at) === today) && <span> · includes today</span>}
      </p>
      {slice.length ? (
        <TradeTable trades={slice} accountLabel={accountLabel} />
      ) : (
        <EmptyState
          title="No trades found"
          body={
            all.length
              ? "Try a different search or clear the filters."
              : "Trades will appear here once they are logged."
          }
        />
      )}
      <Pagination page={current} pages={pages} basePath="/journal" params={flat} />
      <RiskNote />
    </div>
  );
}
