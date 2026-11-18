"use client";

import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { inputCls } from "@/components/admin/fields";
import { Button } from "@/components/ui/button";
import { saveEod } from "@/lib/admin/eod-actions";
import { formatPnl } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface EodAccount {
  id: string;
  label: string;
  prevBalance: number;
  balance: number;
  equity: number;
  dayPnl: number | null;
  note: string;
  savedToday: boolean;
}

interface RowState {
  balance: string;
  equity: string;
  day_pnl: string;
  note: string;
  pnlTouched: boolean;
}

const COLS = ["balance", "equity", "day_pnl", "note"] as const;

/** One-screen end-of-day update. Enter moves to the next field; the last Enter saves. */
export function EodTable({ accounts, date: initialDate }: { accounts: EodAccount[]; date: string }) {
  const router = useRouter();
  const [date, setDate] = useState(initialDate);
  const [pending, start] = useTransition();
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      accounts.map((a) => [
        a.id,
        {
          balance: String(a.balance),
          equity: String(a.equity),
          day_pnl: a.dayPnl === null ? String(Math.round((a.balance - a.prevBalance) * 100) / 100) : String(a.dayPnl),
          note: a.note,
          pnlTouched: a.dayPnl !== null,
        },
      ]),
    ),
  );
  const refs = useRef<Map<string, HTMLInputElement>>(new Map());

  const update = (id: string, key: (typeof COLS)[number], value: string) =>
    setRows((prev) => {
      const r = { ...prev[id]!, [key]: value };
      const acc = accounts.find((a) => a.id === id)!;
      if (key === "balance") {
        if (!r.pnlTouched && value !== "" && !Number.isNaN(Number(value))) r.day_pnl = String(Math.round((Number(value) - acc.prevBalance) * 100) / 100);
        if (prev[id]!.equity === prev[id]!.balance) r.equity = value;
      }
      if (key === "day_pnl") r.pnlTouched = true;
      return { ...prev, [id]: r };
    });

  const order = accounts.flatMap((a) => COLS.map((c) => `${a.id}:${c}`));
  const focusNext = (key: string) => {
    const i = order.indexOf(key);
    const next = order[i + 1];
    if (next) refs.current.get(next)?.focus();
    else save();
  };

  function save() {
    const payload = accounts.map((a) => ({ account_id: a.id, balance: rows[a.id]!.balance, equity: rows[a.id]!.equity, day_pnl: rows[a.id]!.day_pnl, note: rows[a.id]!.note || null }));
    if (payload.some((p) => p.balance === "" || p.equity === "" || p.day_pnl === "")) {
      toast.error("Fill in balance, equity and day P&L for every account.");
      return;
    }
    start(async () => {
      const res = await saveEod({ date, rows: payload });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Saved.");
      router.refresh();
    });
  }

  const input = (a: EodAccount, c: (typeof COLS)[number], extra = "") => (
    <input
      ref={(el) => {
        if (el) refs.current.set(`${a.id}:${c}`, el);
        else refs.current.delete(`${a.id}:${c}`);
      }}
      value={rows[a.id]![c]}
      onChange={(e) => update(a.id, c, e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          focusNext(`${a.id}:${c}`);
        }
      }}
      onFocus={(e) => e.currentTarget.select()}
      inputMode={c === "note" ? "text" : "decimal"}
      enterKeyHint="next"
      aria-label={`${a.label} ${c === "day_pnl" ? "day P&L" : c}`}
      className={cn(inputCls, c !== "note" && "num text-right", extra)}
      placeholder={c === "note" ? "Note (optional)" : undefined}
    />
  );

  const total = accounts.reduce((s, a) => s + (Number(rows[a.id]!.day_pnl) || 0), 0);

  return (
    <div className="space-y-4 pb-28">
      <label className="flex items-center gap-3 text-sm">
        <span className="text-muted">Date (IST)</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputCls} w-auto`} />
      </label>

      <div className="hidden overflow-x-auto rounded-2xl border border-line md:block">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] text-left text-[11px] tracking-[0.12em] text-muted uppercase">
            <tr>
              <th className="px-3 py-3 font-medium">Account</th>
              <th className="px-3 py-3 text-right font-medium">Balance</th>
              <th className="px-3 py-3 text-right font-medium">Equity</th>
              <th className="px-3 py-3 text-right font-medium">Today P&amp;L</th>
              <th className="px-3 py-3 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-t border-line">
                <td className="px-3 py-2">
                  <p>{a.label}</p>
                  <p className="text-xs text-muted">{a.savedToday ? "Updated for this date" : `Previous ${a.prevBalance.toLocaleString("en-US")}`}</p>
                </td>
                <td className="w-40 px-3 py-2">{input(a, "balance")}</td>
                <td className="w-40 px-3 py-2">{input(a, "equity")}</td>
                <td className="w-36 px-3 py-2">{input(a, "day_pnl")}</td>
                <td className="px-3 py-2">{input(a, "note")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {accounts.map((a) => (
          <li key={a.id} className="glass space-y-3 p-4">
            <div className="flex items-baseline justify-between">
              <p className="font-medium">{a.label}</p>
              <p className="text-xs text-muted">{a.savedToday ? "Updated" : `Prev ${a.prevBalance.toLocaleString("en-US")}`}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs text-muted">
                Balance
                {input(a, "balance", "mt-1")}
              </label>
              <label className="text-xs text-muted">
                Equity
                {input(a, "equity", "mt-1")}
              </label>
              <label className="text-xs text-muted">
                Today
                {input(a, "day_pnl", "mt-1")}
              </label>
            </div>
            {input(a, "note")}
          </li>
        ))}
      </ul>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 backdrop-blur-xl lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm text-muted">
            Total today <span className={cn("num", total > 0 ? "text-profit" : total < 0 ? "text-loss" : "text-fg")}>{formatPnl(total)}</span>
          </p>
          <Button type="button" onClick={save} disabled={pending} size="lg">
            {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />} Save all
          </Button>
        </div>
      </div>
    </div>
  );
}
