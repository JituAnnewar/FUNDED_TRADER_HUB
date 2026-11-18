import Link from "next/link";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Tag } from "@/components/ui/misc";
import { Pnl, RValue } from "@/components/ui/pnl";
import { TRADE_SESSION_LABELS } from "@/lib/sessions";
import { formatDateTimeIST } from "@/lib/time";
import type { Trade } from "@/lib/types";

/** Trades as a table on desktop and cards on mobile. */
export function TradeTable({ trades, accountLabel }: { trades: Trade[]; accountLabel: Map<string, string> }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-line md:block">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] text-left text-[11px] tracking-[0.12em] text-muted uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Opened (IST)</th>
              <th scope="col" className="px-4 py-3 font-medium">Symbol</th>
              <th scope="col" className="px-4 py-3 font-medium">Side</th>
              <th scope="col" className="px-4 py-3 font-medium">Account</th>
              <th scope="col" className="px-4 py-3 font-medium">Session</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">R</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Net P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id} className="group relative border-t border-line transition-colors hover:bg-white/[0.02]">
                <td className="num px-4 py-3 text-muted">
                  <Link href={`/journal/${t.id}`} className="after:absolute after:inset-0 group-hover:text-fg">
                    {formatDateTimeIST(new Date(t.opened_at))}
                  </Link>
                </td>
                <td className="px-4 py-3 font-medium">{t.symbol}</td>
                <td className="px-4 py-3">
                  <Tag tone={t.direction === "long" ? "accent" : "default"}>{t.direction === "long" ? "Long" : "Short"}</Tag>
                </td>
                <td className="px-4 py-3 text-muted">{accountLabel.get(t.account_id) ?? ""}</td>
                <td className="px-4 py-3 text-muted">{t.session ? TRADE_SESSION_LABELS[t.session] : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <RValue value={t.r_multiple} />
                </td>
                <td className="relative px-4 py-3 text-right">
                  <Pnl value={t.net_pnl} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-2 md:hidden">
        {trades.map((t) => (
          <li key={t.id}>
            <Link href={`/journal/${t.id}`} className="block rounded-2xl">
              <GlassPanel className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">
                    {t.symbol} <span className="text-xs text-muted">· {t.direction === "long" ? "Long" : "Short"}</span>
                  </p>
                  <p className="num text-xs text-muted">{formatDateTimeIST(new Date(t.opened_at))}</p>
                  <p className="text-xs text-muted">{accountLabel.get(t.account_id) ?? ""}</p>
                </div>
                <div className="text-right">
                  <Pnl value={t.net_pnl} className="block" />
                  <RValue value={t.r_multiple} className="text-xs" />
                </div>
              </GlassPanel>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
