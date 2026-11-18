/**
 * Preview mode: when Supabase is not configured, public pages render generated demo data
 * (with the "Demo data" banner) so the site can be reviewed before the database exists.
 * Set DEMO_PREVIEW=off to show empty states instead.
 */
import type {
  Account,
  Firm,
  Goal,
  JournalEntry,
  Milestone,
  Payout,
  PhaseHistory,
  Post,
  Snapshot,
  Strategy,
  ToolkitItem,
  Trade,
} from "../types";
import { generateDemoData } from "./generate";

export interface PreviewData {
  firms: Firm[];
  accounts: Account[];
  phaseHistory: PhaseHistory[];
  snapshots: Snapshot[];
  trades: Trade[];
  payouts: Payout[];
  strategies: Strategy[];
  journal: JournalEntry[];
  toolkit: ToolkitItem[];
  goals: Goal[];
  posts: Post[];
  milestones: Milestone[];
}

export function previewEnabled(): boolean {
  return process.env.DEMO_PREVIEW !== "off";
}

function base<T>(rows: Record<string, unknown>[], defaults: Record<string, unknown>, now: string): T[] {
  return rows.map((r) => ({ created_at: now, updated_at: now, is_demo: true, is_public: true, ...defaults, ...r }) as T);
}

export function buildPreview(now: Date): PreviewData {
  const d = generateDemoData(now);
  const iso = now.toISOString();
  const nullRules = {
    drawdown_type: null,
    max_daily_loss_pct: null,
    max_total_loss_pct: null,
    profit_target_phase1_pct: null,
    profit_target_phase2_pct: null,
    min_trading_days: null,
    consistency_rule_pct: null,
  };
  const trades = base<Trade>(d.trades, { closed_at: null, private_notes: null }, iso).map((t) => {
    const net = Math.round((t.pnl - t.fees) * 100) / 100;
    return { ...t, net_pnl: net, r_multiple: t.risk_amount ? Math.round((net / t.risk_amount) * 100) / 100 : null };
  });
  return {
    firms: base<Firm>(d.firms, { logo_url: null }, iso),
    accounts: base<Account>(d.accounts, { ...nullRules, status_note: null }, iso),
    phaseHistory: base<PhaseHistory>(d.phaseHistory, {}, iso),
    snapshots: base<Snapshot>(d.snapshots, {}, iso),
    trades: trades.sort((a, b) => b.opened_at.localeCompare(a.opened_at)),
    payouts: base<Payout>(d.payouts, {}, iso).sort((a, b) => b.paid_on.localeCompare(a.paid_on)),
    strategies: base<Strategy>(d.strategies, { cover_image_url: null }, iso),
    journal: base<JournalEntry>(d.journal, {}, iso),
    toolkit: base<ToolkitItem>(d.toolkit, { image_url: null }, iso),
    goals: base<Goal>(d.goals, { current_override: null }, iso),
    posts: base<Post>(d.posts, { cover_url: null }, iso),
    milestones: base<Milestone>(d.milestones, {}, iso),
  };
}
