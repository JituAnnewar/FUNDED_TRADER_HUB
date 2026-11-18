import type { Metadata } from "next";
import { connection } from "next/server";
import { EodTable, type EodAccount } from "@/components/admin/eod-table";
import { AdminHeader } from "@/components/admin/header";
import { EmptyState } from "@/components/ui/misc";
import { requireAdmin } from "@/lib/admin/auth";
import { formatMoney } from "@/lib/format";
import { todayIst } from "@/lib/time-input";
import { ACTIVE_PHASES, type Account, type Firm, type Snapshot } from "@/lib/types";

export const metadata: Metadata = { title: "End-of-day update" };

export default async function EodPage() {
  const { sb } = await requireAdmin();
  await connection();
  const today = todayIst();
  const [a, f, s] = await Promise.all([
    sb.from("accounts").select("*").in("phase", ACTIVE_PHASES).order("sort_order"),
    sb.from("firms").select("id,name"),
    sb.from("account_snapshots").select("*").gte("date", new Date(Date.parse(`${today}T00:00:00Z`) - 45 * 86_400_000).toISOString().slice(0, 10)).order("date", { ascending: false }),
  ]);
  const accounts = (a.data ?? []) as Account[];
  const firmName = new Map(((f.data ?? []) as Pick<Firm, "id" | "name">[]).map((x) => [x.id, x.name]));
  const snaps = (s.data ?? []) as Snapshot[];

  const rows: EodAccount[] = accounts.map((acc) => {
    const own = snaps.filter((x) => x.account_id === acc.id);
    const todaySnap = own.find((x) => x.date === today);
    const prev = own.find((x) => x.date < today);
    const prevBalance = prev?.balance ?? acc.starting_balance;
    return {
      id: acc.id,
      label: `${firmName.get(acc.firm_id) ?? ""} ${formatMoney(acc.account_size, { compact: true })} ${acc.label}`.trim(),
      prevBalance,
      balance: todaySnap?.balance ?? acc.current_balance,
      equity: todaySnap?.equity ?? acc.current_equity,
      dayPnl: todaySnap ? todaySnap.day_pnl : null,
      note: todaySnap?.note ?? "",
      savedToday: Boolean(todaySnap),
    };
  });

  return (
    <>
      <AdminHeader title="End-of-day update" description="Enter each account's closing balance and equity. Today's P&L fills in from the previous day; change it if needed. Press Enter to move to the next box." />
      {rows.length ? <EodTable accounts={rows} date={today} /> : <EmptyState title="No active accounts" body="Add an account first." action={{ href: "/admin/r/accounts/new", label: "New account" }} />}
    </>
  );
}
