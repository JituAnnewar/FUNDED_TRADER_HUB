import { AlertTriangle, ClipboardList, Inbox, PlusCircle, Upload, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { AdminHeader } from "@/components/admin/header";
import { GlassPanel } from "@/components/ui/glass-panel";
import { BreachMeter, EmptyState, PhaseBadge, StatTile } from "@/components/ui/misc";
import { Pnl } from "@/components/ui/pnl";
import { requireAdmin } from "@/lib/admin/auth";
import { adminPortfolio } from "@/lib/admin/portfolio";
import { formatMoney } from "@/lib/format";
import { formatDateTimeIST } from "@/lib/time";
import type { ActivityEntry } from "@/lib/types";

export const metadata: Metadata = { title: "Overview" };

const QUICK = [
  { href: "/admin/eod", label: "End-of-day update", icon: ClipboardList },
  { href: "/admin/trades/quick", label: "Quick add trade", icon: PlusCircle },
  { href: "/admin/r/payouts/new", label: "New payout", icon: Wallet },
  { href: "/admin/import", label: "Import CSV", icon: Upload },
];

export default async function OverviewPage() {
  const { sb } = await requireAdmin();
  await connection();
  const now = new Date();
  const [portfolio, unread, activity] = await Promise.all([
    adminPortfolio(sb, now),
    sb.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
    sb.from("activity_log").select("*").order("created_at", { ascending: false }).limit(12),
  ]);
  const active = portfolio.views.filter((v) => v.isActive);
  const atRisk = active
    .map((v) => ({ v, worst: Math.max(v.daily?.usedPct ?? 0, v.max?.usedPct ?? 0) }))
    .filter((x) => x.worst >= 50)
    .sort((a, b) => b.worst - a.worst);
  const firmName = new Map(portfolio.firms.map((f) => [f.id, f.name]));

  return (
    <>
      <AdminHeader title="Overview" description="Today at a glance." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Today, all accounts">
          <Pnl value={portfolio.totals.todayPnl} glow />
        </StatTile>
        <StatTile label="Active accounts" sub={`${formatMoney(active.reduce((s, v) => s + v.account.account_size, 0), { compact: true })} capital`}>
          <span className="num">{active.length}</span>
        </StatTile>
        <StatTile label="Close to breach">
          <span className={atRisk.length ? "num text-amber" : "num text-profit"}>{atRisk.length}</span>
        </StatTile>
        <StatTile label="Unread messages">
          <Link href="/admin/messages" className="num hover:text-accent">
            {unread.count ?? 0}
          </Link>
        </StatTile>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {QUICK.map((q) => (
          <Link key={q.href} href={q.href} className="glass flex items-center gap-2 p-3 text-sm transition-colors hover:bg-white/[0.04]">
            <q.icon className="size-4 text-accent" aria-hidden="true" /> {q.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <GlassPanel className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4 text-amber" aria-hidden="true" /> Accounts close to breach
          </h2>
          {atRisk.length ? (
            <ul className="space-y-5">
              {atRisk.map(({ v }) => (
                <li key={v.account.id}>
                  <Link href={`/admin/r/accounts/${v.account.id}`} className="mb-2 flex items-center justify-between gap-2 text-sm hover:text-accent">
                    <span>
                      {firmName.get(v.account.firm_id)} {v.account.label}
                    </span>
                    <PhaseBadge phase={v.account.phase} />
                  </Link>
                  <div className="space-y-2">
                    {v.daily && <BreachMeter label="Daily loss" usedPct={v.daily.usedPct} level={v.daily.level} detail={`${formatMoney(v.daily.distance)} left`} />}
                    {v.max && <BreachMeter label="Max loss" usedPct={v.max.usedPct} level={v.max.level} detail={`${formatMoney(v.max.distance)} left`} />}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">All active accounts are using less than half of their loss limits.</p>
          )}
        </GlassPanel>

        <GlassPanel className="p-5">
          <h2 className="mb-4 font-semibold">Today by account</h2>
          {active.length ? (
            <ul className="divide-y divide-line text-sm">
              {active.map((v) => (
                <li key={v.account.id} className="flex items-center justify-between py-2">
                  <span className="text-muted">
                    {firmName.get(v.account.firm_id)} {v.account.label}
                  </span>
                  <Pnl value={v.todayPnl} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No active accounts" body="Add an account to start tracking." action={{ href: "/admin/r/accounts/new", label: "New account" }} />
          )}
        </GlassPanel>
      </div>

      <GlassPanel className="mt-4 p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <Inbox className="size-4 text-accent" aria-hidden="true" /> Recent activity
        </h2>
        {(activity.data ?? []).length ? (
          <ul className="space-y-2 text-sm">
            {((activity.data ?? []) as ActivityEntry[]).map((a) => (
              <li key={a.id} className="flex flex-wrap gap-x-2">
                <span className="num text-muted">{formatDateTimeIST(new Date(a.created_at))}</span>
                <span className="capitalize">{a.action}</span>
                <span className="text-muted">{a.entity.replaceAll("_", " ")}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No changes logged yet.</p>
        )}
        <Link href="/admin/activity" className="mt-3 inline-block text-sm text-accent hover:underline">
          Full activity log →
        </Link>
      </GlassPanel>
    </>
  );
}
