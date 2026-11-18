/**
 * Seed demo data into Supabase.
 *   npm run seed           → insert demo data
 *   npm run seed -- --reset → remove existing demo rows first
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import { createClient } from "@supabase/supabase-js";
import { loadDemoData } from "../lib/demo/load";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const DELETE_ORDER = [
  "trade_images",
  "trades",
  "open_positions",
  "account_snapshots",
  "account_phase_history",
  "payouts",
  "accounts",
  "firms",
  "strategies",
  "journal_entries",
  "toolkit_items",
  "goals",
  "posts",
  "milestones",
];

async function main() {
  if (process.argv.includes("--reset")) {
    for (const table of DELETE_ORDER) {
      const { error } = await sb.from(table).delete().eq("is_demo", true);
      if (error) throw new Error(`reset ${table}: ${error.message}`);
    }
    console.log("Removed existing demo rows.");
  }
  const { inserted } = await loadDemoData(sb);
  console.log(`Inserted ${inserted} demo rows.`);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
