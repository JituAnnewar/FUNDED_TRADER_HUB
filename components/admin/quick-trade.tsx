"use client";

import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { inputCls, Toggle } from "@/components/admin/fields";
import type { RelationOption } from "@/components/admin/record-form";
import { Button } from "@/components/ui/button";
import { quickAddTrade } from "@/lib/admin/trade-actions";
import { cn } from "@/lib/utils";

const LAST_ACCOUNT = "admin:last-account";

/** Phone-first quick add: account → symbol → side → P&L → save. */
export function QuickTrade({ accounts, strategies, symbols }: { accounts: RelationOption[]; strategies: RelationOption[]; symbols: string[] }) {
  const [account, setAccount] = useState(accounts[0]?.value ?? "");
  const [symbol, setSymbol] = useState(symbols[0] ?? "XAUUSD");
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [pnl, setPnl] = useState("");
  const [strategy, setStrategy] = useState("");
  const [risk, setRisk] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [lastId, setLastId] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_ACCOUNT);
      if (saved && accounts.some((a) => a.value === saved)) {
        const t = setTimeout(() => setAccount(saved), 0);
        return () => clearTimeout(t);
      }
    } catch {
      // storage unavailable
    }
  }, [accounts]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await quickAddTrade({ account_id: account, symbol, direction, net_pnl: pnl, strategy_id: strategy || null, risk_amount: risk, is_public: isPublic });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      try {
        localStorage.setItem(LAST_ACCOUNT, account);
      } catch {
        // ignore
      }
      toast.success(res.message ?? "Saved.");
      setLastId(res.data?.id ?? null);
      setPnl("");
      setRisk("");
    });
  }

  const n = Number(pnl);
  return (
    <form onSubmit={submit} className="glass mx-auto max-w-lg space-y-5 p-5 sm:p-6">
      <label className="block">
        <span className="mb-1.5 block text-sm">Account</span>
        <select value={account} onChange={(e) => setAccount(e.target.value)} className={inputCls} required>
          {accounts.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </label>

      <div>
        <span className="mb-1.5 block text-sm">Symbol</span>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {symbols.map((s) => (
            <button key={s} type="button" onClick={() => setSymbol(s)} aria-pressed={symbol === s} className={cn("rounded-lg border px-3 py-1.5 text-sm", symbol === s ? "border-accent bg-accent/10 text-accent" : "border-line text-muted")}>
              {s}
            </button>
          ))}
        </div>
        <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} className={`${inputCls} num`} aria-label="Symbol" autoCapitalize="characters" />
      </div>

      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Direction">
        {(["long", "short"] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDirection(d)}
            aria-pressed={direction === d}
            className={cn("h-12 rounded-xl border text-sm font-medium", direction === d ? (d === "long" ? "border-profit bg-profit/10 text-profit" : "border-loss bg-loss/10 text-loss") : "border-line text-muted")}
          >
            {d === "long" ? "Long / Buy" : "Short / Sell"}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm">Net P&amp;L ($) — use a minus for a loss</span>
        <input
          value={pnl}
          onChange={(e) => setPnl(e.target.value)}
          inputMode="decimal"
          required
          autoFocus
          placeholder="e.g. 450 or -200"
          className={cn(inputCls, "num h-14 text-2xl", n > 0 && "text-profit", n < 0 && "text-loss")}
        />
      </label>

      <details className="rounded-xl border border-line p-3">
        <summary className="cursor-pointer text-sm text-muted">More (strategy, risk, visibility)</summary>
        <div className="mt-3 space-y-3">
          <select value={strategy} onChange={(e) => setStrategy(e.target.value)} className={inputCls} aria-label="Strategy">
            <option value="">No strategy</option>
            {strategies.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <input value={risk} onChange={(e) => setRisk(e.target.value)} inputMode="decimal" placeholder="Risk in $ (for R multiple)" className={`${inputCls} num`} aria-label="Risk amount" />
          <Toggle id="qt-public" checked={isPublic} onChange={setIsPublic} label="Show on the public site" />
        </div>
      </details>

      <Button type="submit" size="lg" className="w-full" disabled={pending || !account}>
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />} Save trade
      </Button>
      {lastId && (
        <p className="text-center text-sm text-muted">
          Saved.{" "}
          <Link href={`/admin/r/trades/${lastId}`} className="text-accent hover:underline">
            Add screenshots or notes →
          </Link>
        </p>
      )}
    </form>
  );
}
