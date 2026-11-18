/**
 * Shared loader used by the seed script (service role) and the admin button (admin session).
 * Relative imports only.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_TABLES, generateDemoData } from "./generate";

const CHUNK = 500;

export async function loadDemoData(sb: SupabaseClient, now = new Date()): Promise<{ inserted: number }> {
  const data = generateDemoData(now);
  let inserted = 0;
  for (const { key, table } of DEMO_TABLES) {
    const rows = data[key];
    if (key === "phaseHistory") {
      // The accounts trigger already wrote an initial history row; replace with the full demo history.
      const ids = data.accounts.map((a) => a.id as string);
      const { error } = await sb.from("account_phase_history").delete().in("account_id", ids);
      if (error) throw new Error(`account_phase_history cleanup: ${error.message}`);
    }
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error } = await sb.from(table).insert(rows.slice(i, i + CHUNK));
      if (error) throw new Error(`${table}: ${error.message}`);
    }
    inserted += rows.length;
  }
  return { inserted };
}
