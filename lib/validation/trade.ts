import { z } from "zod";

/** Quick-add trade: shared by the phone form and the server action. */
export const quickTradeSchema = z.object({
  account_id: z.uuid("Choose an account."),
  strategy_id: z.uuid().nullable().optional().or(z.literal("")),
  symbol: z
    .string()
    .trim()
    .min(2, "Enter a symbol.")
    .max(20)
    .transform((s) => s.toUpperCase()),
  direction: z.enum(["long", "short"]),
  net_pnl: z.coerce.number({ error: "Enter the P&L (use a minus sign for a loss)." }).refine((n) => Number.isFinite(n) && Math.abs(n) < 10_000_000, "That P&L looks wrong."),
  risk_amount: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.coerce.number().positive().optional()),
  is_public: z.boolean().default(true),
});

export type QuickTradeInput = z.input<typeof quickTradeSchema>;

export function marketForSymbol(symbol: string): "forex" | "commodity" | "index" | "crypto" {
  const s = symbol.toUpperCase();
  if (/^(XAU|XAG|XPT|XPD|USOIL|UKOIL|WTI|BRENT)/.test(s)) return "commodity";
  if (/^(BTC|ETH|SOL|XRP|LTC|DOGE)/.test(s)) return "crypto";
  if (/^(US30|NAS100|SPX|US500|GER40|DE40|UK100|JP225|HK50)/.test(s)) return "index";
  return "forex";
}
