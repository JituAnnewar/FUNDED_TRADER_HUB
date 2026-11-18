import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/header";
import { QuickTrade } from "@/components/admin/quick-trade";
import { EmptyState } from "@/components/ui/misc";
import { requireAdmin } from "@/lib/admin/auth";
import { loadRelations } from "@/lib/admin/data";
import { ACTIVE_PHASES, type AccountPhase } from "@/lib/types";

export const metadata: Metadata = { title: "Quick add trade" };

export default async function QuickTradePage() {
  const { sb } = await requireAdmin();
  const [relations, recent] = await Promise.all([loadRelations(sb), sb.from("trades").select("symbol").order("opened_at", { ascending: false }).limit(200)]);
  const counts = new Map<string, number>();
  for (const t of (recent.data ?? []) as { symbol: string }[]) counts.set(t.symbol, (counts.get(t.symbol) ?? 0) + 1);
  const symbols = [...new Set([...[...counts.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s), "XAUUSD", "EURUSD", "GBPUSD", "USDJPY"])].slice(0, 6);
  const accounts = relations.accounts.filter((a) => ACTIVE_PHASES.includes(a.extra?.phase as AccountPhase));

  return (
    <>
      <AdminHeader title="Quick add trade" description="The fastest way to log a trade from your phone. Add details later from the trade list." back={{ href: "/admin/r/trades", label: "Trades" }} />
      {accounts.length ? (
        <QuickTrade accounts={accounts} strategies={relations.strategies} symbols={symbols} />
      ) : (
        <EmptyState title="No active accounts" body="Add an account before logging trades." action={{ href: "/admin/r/accounts/new", label: "New account" }} />
      )}
    </>
  );
}
