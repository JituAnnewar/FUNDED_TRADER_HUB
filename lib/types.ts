/**
 * Domain row types, mirroring supabase/migrations. Numeric columns arrive as JSON numbers from PostgREST.
 * Kept free of path aliases so scripts can import it with relative paths.
 */

export type DrawdownType = "static" | "trailing_eod" | "trailing_intraday";
export type AccountPhase =
  | "challenge_phase_1"
  | "challenge_phase_2"
  | "funded"
  | "passed"
  | "payout_pending"
  | "breached"
  | "closed";
export type Platform =
  | "MT4"
  | "MT5"
  | "cTrader"
  | "DXtrade"
  | "Match-Trader"
  | "Tradovate"
  | "Rithmic"
  | "NinjaTrader"
  | "TradingView"
  | "Other";
export type Direction = "long" | "short";
export type MarketType = "forex" | "index" | "commodity" | "crypto" | "futures" | "stock";
export type TradeSession = "asia" | "london" | "new_york" | "london_ny_overlap";
export type ImageKind = "before" | "after" | "other";
export type PayoutMethod = "bank" | "crypto" | "rise" | "deel" | "other";
export type ToolkitCategory = "platform" | "charting" | "indicator" | "hardware" | "broker" | "education" | "other";
export type GoalMetric = "total_payouts" | "monthly_pnl" | "funded_capital" | "custom";
export type MessageCategory = "mentorship" | "collaboration" | "business" | "general";
export type MessageStatus = "new" | "read" | "replied" | "archived";

interface Base {
  id: string;
  created_at: string;
  updated_at: string;
  is_demo: boolean;
}
interface Publishable extends Base {
  is_public: boolean;
}

export interface RuleSet {
  drawdown_type: DrawdownType;
  max_daily_loss_pct: number | null;
  max_total_loss_pct: number | null;
  profit_target_phase1_pct: number | null;
  profit_target_phase2_pct: number | null;
  min_trading_days: number | null;
  consistency_rule_pct: number | null;
}

export interface Firm extends Publishable, RuleSet {
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  profit_split_pct: number | null;
  payout_frequency: string | null;
  personal_review: string | null;
  sort_order: number;
}

export interface Account extends Publishable {
  firm_id: string;
  label: string;
  account_size: number;
  currency: string;
  phase: AccountPhase;
  platform: Platform;
  masked_account_id: string | null;
  starting_balance: number;
  current_balance: number;
  current_equity: number;
  high_water_mark: number;
  start_date: string;
  status_note: string | null;
  private_notes?: string | null;
  drawdown_type: DrawdownType | null;
  max_daily_loss_pct: number | null;
  max_total_loss_pct: number | null;
  profit_target_phase1_pct: number | null;
  profit_target_phase2_pct: number | null;
  min_trading_days: number | null;
  consistency_rule_pct: number | null;
  sort_order: number;
}

export interface PhaseHistory extends Base {
  account_id: string;
  from_phase: AccountPhase | null;
  to_phase: AccountPhase;
  changed_at: string;
  note: string | null;
}

export interface Snapshot extends Base {
  account_id: string;
  date: string;
  balance: number;
  equity: number;
  day_pnl: number;
  note: string | null;
}

export interface OpenPosition extends Base {
  account_id: string;
  symbol: string;
  direction: Direction;
  size: number;
  entry_price: number;
  stop_loss: number | null;
  take_profit: number | null;
  opened_at: string;
  floating_pnl: number;
}

export interface ChecklistItem {
  text: string;
}

export interface Strategy extends Publishable {
  name: string;
  slug: string;
  summary: string | null;
  timeframes: string[];
  markets: string[];
  entry_rules: string | null;
  exit_rules: string | null;
  risk_rules: string | null;
  checklist: ChecklistItem[];
  cover_image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface Trade extends Publishable {
  account_id: string;
  strategy_id: string | null;
  symbol: string;
  market: MarketType;
  direction: Direction;
  opened_at: string;
  closed_at: string | null;
  entry_price: number | null;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  size: number | null;
  risk_amount: number | null;
  pnl: number;
  fees: number;
  net_pnl: number;
  r_multiple: number | null;
  session: TradeSession | null;
  timeframe: string | null;
  setup_tags: string[];
  mistake_tags: string[];
  emotion_before: string | null;
  emotion_after: string | null;
  rating: number | null;
  followed_plan: boolean | null;
  notes: string | null;
  private_notes?: string | null;
  external_ticket_id: string | null;
}

export interface TradeImage extends Base {
  trade_id: string;
  url: string;
  caption: string | null;
  kind: ImageKind;
  sort_order: number;
}

export interface Payout extends Publishable {
  account_id: string | null;
  firm_id: string;
  amount: number;
  currency: string;
  paid_on: string;
  method: PayoutMethod;
  certificate_url: string | null;
  certificate_thumb_url: string | null;
  verification_url: string | null;
  note: string | null;
  is_featured: boolean;
}

export interface JournalEntry extends Publishable {
  date: string;
  pre_market_plan: string | null;
  post_market_review: string | null;
  mood: number | null;
  focus: number | null;
  lessons: string | null;
  tags: string[];
}

export interface ToolkitItem extends Publishable {
  category: ToolkitCategory;
  name: string;
  description: string | null;
  url: string | null;
  image_url: string | null;
  is_affiliate: boolean;
  sort_order: number;
}

export interface Goal extends Publishable {
  title: string;
  metric: GoalMetric;
  target_amount: number;
  current_override: number | null;
  deadline: string | null;
  sort_order: number;
}

export interface Post extends Publishable {
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  cover_url: string | null;
  published_at: string | null;
}

export interface Milestone extends Publishable {
  date: string;
  title: string;
  description: string | null;
}

export interface ContactMessage extends Base {
  name: string;
  email: string;
  category: MessageCategory;
  subject: string;
  message: string;
  status: MessageStatus;
  ip_hash: string | null;
  user_agent: string | null;
}

export interface Socials {
  instagram?: string;
  x?: string;
  youtube?: string;
  telegram?: string;
  discord?: string;
  whatsapp?: string;
}

export interface SectionToggles {
  payouts?: boolean;
  accounts?: boolean;
  journal?: boolean;
  strategies?: boolean;
  toolkit?: boolean;
  tools?: boolean;
  insights?: boolean;
  goals?: boolean;
}

export interface SiteSettings {
  id: string;
  updated_at: string;
  brand_name: string;
  trader_name: string;
  tagline: string;
  hero_copy: string | null;
  about_text: string | null;
  avatar_url: string | null;
  socials: Socials;
  sections: SectionToggles;
  show_open_positions_publicly: boolean;
  usd_to_inr_rate: number;
  disclaimer_text: string | null;
  seo_title: string | null;
  seo_description: string | null;
  show_tradingview_widgets: boolean;
}

export interface ActivityEntry {
  id: string;
  created_at: string;
  actor: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  diff: Record<string, unknown> | null;
}

export const PHASE_LABELS: Record<AccountPhase, string> = {
  challenge_phase_1: "Phase 1",
  challenge_phase_2: "Phase 2",
  funded: "Funded",
  passed: "Passed",
  payout_pending: "Payout pending",
  breached: "Breached",
  closed: "Closed",
};

export const ACTIVE_PHASES: AccountPhase[] = ["challenge_phase_1", "challenge_phase_2", "funded", "payout_pending"];
