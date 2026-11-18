/**
 * Admin resource definitions. One config per table drives the list page, the edit form,
 * and the zod schema used on BOTH client (react-hook-form) and server (Server Actions).
 */
import { z } from "zod";
import type { Tag } from "../data/tags";

export type FieldType =
  | "text"
  | "textarea"
  | "markdown"
  | "number"
  | "select"
  | "boolean"
  | "date"
  | "datetime"
  | "tags"
  | "url"
  | "image"
  | "file"
  | "checklist"
  | "relation";

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  options?: { value: string; label: string }[];
  /** For relation fields: which resource to pick from. */
  relation?: "firms" | "accounts" | "strategies";
  /** Storage bucket for image/file fields. */
  bucket?: "certificates" | "trade-screenshots" | "firm-logos" | "site-media";
  /** File field: also store a generated image thumbnail in this column. */
  thumbKey?: string;
  min?: number;
  max?: number;
  step?: string;
  /** Form grouping heading. */
  group?: string;
  /** Default for new records. */
  defaultValue?: unknown;
  /** Show this firm rule as a hint (accounts rule overrides). */
  firmRuleHint?: string;
  /** Auto-fill from another field (slug from name). */
  slugFrom?: string;
  /** Template for empty markdown fields on new records. */
  template?: string;
  maxLength?: number;
}

export interface Column {
  key: string;
  label: string;
  kind?: "text" | "money" | "pnl" | "date" | "datetime" | "bool" | "badge" | "relation" | "pct";
  relation?: Field["relation"];
}

export interface Resource {
  key: string;
  table: string;
  label: string;
  singular: string;
  fields: Field[];
  columns: Column[];
  search: string[];
  sort: { key: string; ascending: boolean };
  tags: Tag[];
  /** Has is_public column (enables visibility toggle + bulk actions). */
  publishable: boolean;
  /** Title for an edit page. */
  titleKey: string;
  hidden?: boolean;
}

const pct = (key: string, label: string, extra: Partial<Field> = {}): Field => ({ key, label, type: "number", step: "0.01", min: 0, max: 100, ...extra });
const VIS: Field = { key: "is_public", label: "Visible on the public site", type: "boolean", defaultValue: true };

export const PHASE_OPTIONS = [
  { value: "challenge_phase_1", label: "Phase 1" },
  { value: "challenge_phase_2", label: "Phase 2" },
  { value: "funded", label: "Funded" },
  { value: "passed", label: "Passed" },
  { value: "payout_pending", label: "Payout pending" },
  { value: "breached", label: "Breached" },
  { value: "closed", label: "Closed" },
];
export const DRAWDOWN_OPTIONS = [
  { value: "static", label: "Static" },
  { value: "trailing_eod", label: "Trailing (end of day)" },
  { value: "trailing_intraday", label: "Trailing (intraday)" },
];
export const PLATFORM_OPTIONS = ["MT4", "MT5", "cTrader", "DXtrade", "Match-Trader", "Tradovate", "Rithmic", "NinjaTrader", "TradingView", "Other"].map((v) => ({ value: v, label: v }));
export const DIRECTION_OPTIONS = [
  { value: "long", label: "Long" },
  { value: "short", label: "Short" },
];
export const MARKET_OPTIONS = ["forex", "index", "commodity", "crypto", "futures", "stock"].map((v) => ({ value: v, label: v[0]!.toUpperCase() + v.slice(1) }));

const JOURNAL_PLAN = "**Bias:**\n\n**Key levels:**\n- \n\n**Setups I will take:**\n- \n\n**Max trades / risk:** 2 trades, 0.5% each";
const JOURNAL_REVIEW = "**What went well:**\n- \n\n**What to improve:**\n- \n\n**Did I follow the plan?**";

export const RESOURCES: Record<string, Resource> = {
  firms: {
    key: "firms",
    table: "firms",
    label: "Firms",
    singular: "firm",
    titleKey: "name",
    publishable: true,
    search: ["name"],
    sort: { key: "sort_order", ascending: true },
    tags: ["firms", "accounts", "payouts"],
    columns: [
      { key: "name", label: "Name" },
      { key: "drawdown_type", label: "Drawdown", kind: "badge" },
      { key: "max_daily_loss_pct", label: "Daily", kind: "pct" },
      { key: "max_total_loss_pct", label: "Max", kind: "pct" },
      { key: "profit_split_pct", label: "Split", kind: "pct" },
      { key: "is_public", label: "Public", kind: "bool" },
    ],
    fields: [
      { key: "name", label: "Name", type: "text", required: true, maxLength: 120 },
      { key: "slug", label: "URL slug", type: "text", required: true, slugFrom: "name", help: "Lowercase letters, numbers and dashes." },
      { key: "website", label: "Website", type: "url" },
      { key: "logo_url", label: "Logo", type: "image", bucket: "firm-logos" },
      { key: "description", label: "Short description", type: "textarea" },
      { key: "profit_split_pct", label: "Profit split %", type: "number", step: "1", min: 0, max: 100, group: "Rules" },
      { key: "drawdown_type", label: "Drawdown type", type: "select", options: DRAWDOWN_OPTIONS, required: true, defaultValue: "static", group: "Rules" },
      pct("max_daily_loss_pct", "Max daily loss %", { group: "Rules" }),
      pct("max_total_loss_pct", "Max total loss %", { group: "Rules" }),
      pct("profit_target_phase1_pct", "Phase 1 target %", { group: "Rules" }),
      pct("profit_target_phase2_pct", "Phase 2 target %", { group: "Rules" }),
      { key: "min_trading_days", label: "Min trading days", type: "number", step: "1", min: 0, group: "Rules" },
      pct("consistency_rule_pct", "Consistency rule % (blank = none)", { group: "Rules" }),
      { key: "payout_frequency", label: "Payout frequency", type: "text", group: "Rules" },
      { key: "personal_review", label: "My review", type: "markdown", group: "Review" },
      { key: "sort_order", label: "Sort order", type: "number", step: "1", defaultValue: 0 },
      VIS,
    ],
  },
  accounts: {
    key: "accounts",
    table: "accounts",
    label: "Accounts",
    singular: "account",
    titleKey: "label",
    publishable: true,
    search: ["label", "masked_account_id"],
    sort: { key: "sort_order", ascending: true },
    tags: ["accounts", "snapshots"],
    columns: [
      { key: "firm_id", label: "Firm", kind: "relation", relation: "firms" },
      { key: "label", label: "Label" },
      { key: "account_size", label: "Size", kind: "money" },
      { key: "phase", label: "Phase", kind: "badge" },
      { key: "current_balance", label: "Balance", kind: "money" },
      { key: "is_public", label: "Public", kind: "bool" },
    ],
    fields: [
      { key: "firm_id", label: "Firm", type: "relation", relation: "firms", required: true, group: "Account" },
      { key: "account_size", label: "Account size ($)", type: "number", required: true, min: 1, step: "1000", group: "Account", help: "Balances default to this on create." },
      { key: "label", label: "Label", type: "text", required: true, maxLength: 60, help: 'E.g. "100K #2".', group: "Account" },
      { key: "phase", label: "Phase", type: "select", options: PHASE_OPTIONS, required: true, defaultValue: "challenge_phase_1", group: "Account" },
      { key: "platform", label: "Platform", type: "select", options: PLATFORM_OPTIONS, required: true, defaultValue: "MT5", group: "Account" },
      { key: "masked_account_id", label: "Last 4 characters of account number", type: "text", maxLength: 4, help: "Only the last 4 are ever stored.", group: "Account" },
      { key: "currency", label: "Currency", type: "text", defaultValue: "USD", maxLength: 3, group: "Account" },
      { key: "start_date", label: "Start date", type: "date", required: true, group: "Account" },
      { key: "starting_balance", label: "Starting balance", type: "number", step: "0.01", group: "Balances" },
      { key: "current_balance", label: "Current balance", type: "number", step: "0.01", group: "Balances" },
      { key: "current_equity", label: "Current equity", type: "number", step: "0.01", group: "Balances" },
      { key: "high_water_mark", label: "High-water mark", type: "number", step: "0.01", group: "Balances" },
      { key: "drawdown_type", label: "Drawdown type override", type: "select", options: DRAWDOWN_OPTIONS, firmRuleHint: "drawdown_type", group: "Rule overrides (blank = firm rule)" },
      pct("max_daily_loss_pct", "Max daily loss %", { firmRuleHint: "max_daily_loss_pct", group: "Rule overrides (blank = firm rule)" }),
      pct("max_total_loss_pct", "Max total loss %", { firmRuleHint: "max_total_loss_pct", group: "Rule overrides (blank = firm rule)" }),
      pct("profit_target_phase1_pct", "Phase 1 target %", { firmRuleHint: "profit_target_phase1_pct", group: "Rule overrides (blank = firm rule)" }),
      pct("profit_target_phase2_pct", "Phase 2 target %", { firmRuleHint: "profit_target_phase2_pct", group: "Rule overrides (blank = firm rule)" }),
      { key: "min_trading_days", label: "Min trading days", type: "number", step: "1", firmRuleHint: "min_trading_days", group: "Rule overrides (blank = firm rule)" },
      pct("consistency_rule_pct", "Consistency rule %", { firmRuleHint: "consistency_rule_pct", group: "Rule overrides (blank = firm rule)" }),
      { key: "status_note", label: "Public status note", type: "textarea", group: "Notes" },
      { key: "private_notes", label: "Private notes (never public)", type: "textarea", group: "Notes" },
      { key: "sort_order", label: "Sort order", type: "number", step: "1", defaultValue: 0, group: "Notes" },
      VIS,
    ],
  },
  trades: {
    key: "trades",
    table: "trades",
    label: "Trades",
    singular: "trade",
    titleKey: "symbol",
    publishable: true,
    search: ["symbol", "notes", "external_ticket_id"],
    sort: { key: "opened_at", ascending: false },
    tags: ["trades", "accounts"],
    columns: [
      { key: "opened_at", label: "Opened", kind: "datetime" },
      { key: "symbol", label: "Symbol" },
      { key: "direction", label: "Side", kind: "badge" },
      { key: "account_id", label: "Account", kind: "relation", relation: "accounts" },
      { key: "net_pnl", label: "Net", kind: "pnl" },
      { key: "is_public", label: "Public", kind: "bool" },
    ],
    fields: [
      { key: "account_id", label: "Account", type: "relation", relation: "accounts", required: true, group: "Trade" },
      { key: "strategy_id", label: "Strategy", type: "relation", relation: "strategies", group: "Trade" },
      { key: "symbol", label: "Symbol", type: "text", required: true, maxLength: 20, group: "Trade" },
      { key: "market", label: "Market", type: "select", options: MARKET_OPTIONS, required: true, defaultValue: "forex", group: "Trade" },
      { key: "direction", label: "Direction", type: "select", options: DIRECTION_OPTIONS, required: true, defaultValue: "long", group: "Trade" },
      { key: "timeframe", label: "Timeframe", type: "text", maxLength: 10, group: "Trade" },
      { key: "opened_at", label: "Opened at", type: "datetime", required: true, group: "Timing" },
      { key: "closed_at", label: "Closed at", type: "datetime", group: "Timing" },
      { key: "entry_price", label: "Entry", type: "number", step: "any", group: "Prices" },
      { key: "stop_loss", label: "Stop loss", type: "number", step: "any", group: "Prices" },
      { key: "take_profit", label: "Take profit", type: "number", step: "any", group: "Prices" },
      { key: "exit_price", label: "Exit", type: "number", step: "any", group: "Prices" },
      { key: "size", label: "Size (lots / contracts)", type: "number", step: "any", group: "Prices" },
      { key: "pnl", label: "Gross P&L ($)", type: "number", step: "0.01", required: true, group: "Result" },
      { key: "fees", label: "Fees + commission ($)", type: "number", step: "0.01", defaultValue: 0, group: "Result" },
      { key: "risk_amount", label: "Risk ($)", type: "number", step: "0.01", min: 0, help: "Needed for R-multiple.", group: "Result" },
      { key: "external_ticket_id", label: "Platform ticket ID", type: "text", help: "Used to skip duplicates on import.", group: "Result" },
      { key: "setup_tags", label: "Setup tags", type: "tags", group: "Review" },
      { key: "mistake_tags", label: "Mistake tags", type: "tags", group: "Review" },
      { key: "emotion_before", label: "Emotion before", type: "text", group: "Review" },
      { key: "emotion_after", label: "Emotion after", type: "text", group: "Review" },
      { key: "rating", label: "Rating (1–5)", type: "number", step: "1", min: 1, max: 5, group: "Review" },
      { key: "followed_plan", label: "Followed the plan", type: "boolean", group: "Review" },
      { key: "notes", label: "Public notes", type: "markdown", group: "Notes" },
      { key: "private_notes", label: "Private notes (never public)", type: "textarea", group: "Notes" },
      VIS,
    ],
  },
  positions: {
    key: "positions",
    table: "open_positions",
    label: "Open positions",
    singular: "position",
    titleKey: "symbol",
    publishable: false,
    search: ["symbol"],
    sort: { key: "opened_at", ascending: false },
    tags: ["positions"],
    columns: [
      { key: "symbol", label: "Symbol" },
      { key: "direction", label: "Side", kind: "badge" },
      { key: "account_id", label: "Account", kind: "relation", relation: "accounts" },
      { key: "size", label: "Size" },
      { key: "floating_pnl", label: "Floating", kind: "pnl" },
      { key: "opened_at", label: "Opened", kind: "datetime" },
    ],
    fields: [
      { key: "account_id", label: "Account", type: "relation", relation: "accounts", required: true },
      { key: "symbol", label: "Symbol", type: "text", required: true, maxLength: 20 },
      { key: "direction", label: "Direction", type: "select", options: DIRECTION_OPTIONS, required: true, defaultValue: "long" },
      { key: "size", label: "Size", type: "number", step: "any", required: true },
      { key: "entry_price", label: "Entry", type: "number", step: "any", required: true },
      { key: "stop_loss", label: "Stop loss", type: "number", step: "any" },
      { key: "take_profit", label: "Take profit", type: "number", step: "any" },
      { key: "opened_at", label: "Opened at", type: "datetime", required: true },
      { key: "floating_pnl", label: "Floating P&L ($)", type: "number", step: "0.01", defaultValue: 0 },
    ],
  },
  payouts: {
    key: "payouts",
    table: "payouts",
    label: "Payouts",
    singular: "payout",
    titleKey: "paid_on",
    publishable: true,
    search: ["note"],
    sort: { key: "paid_on", ascending: false },
    tags: ["payouts"],
    columns: [
      { key: "paid_on", label: "Paid on", kind: "date" },
      { key: "firm_id", label: "Firm", kind: "relation", relation: "firms" },
      { key: "amount", label: "Amount", kind: "money" },
      { key: "method", label: "Method", kind: "badge" },
      { key: "is_featured", label: "Featured", kind: "bool" },
      { key: "is_public", label: "Public", kind: "bool" },
    ],
    fields: [
      { key: "firm_id", label: "Firm", type: "relation", relation: "firms", required: true },
      { key: "account_id", label: "Account", type: "relation", relation: "accounts" },
      { key: "amount", label: "Amount", type: "number", step: "0.01", min: 0.01, required: true },
      { key: "currency", label: "Currency", type: "text", defaultValue: "USD", maxLength: 3 },
      { key: "paid_on", label: "Paid on", type: "date", required: true },
      {
        key: "method",
        label: "Method",
        type: "select",
        required: true,
        defaultValue: "bank",
        options: [
          { value: "bank", label: "Bank" },
          { value: "crypto", label: "Crypto" },
          { value: "rise", label: "Rise" },
          { value: "deel", label: "Deel" },
          { value: "other", label: "Other" },
        ],
      },
      { key: "certificate_url", label: "Certificate (image or PDF)", type: "file", bucket: "certificates", thumbKey: "certificate_thumb_url" },
      { key: "verification_url", label: "Verification link", type: "url", help: "Shows a Verified badge." },
      { key: "note", label: "Note", type: "textarea" },
      { key: "is_featured", label: "Featured", type: "boolean", defaultValue: false },
      VIS,
    ],
  },
  strategies: {
    key: "strategies",
    table: "strategies",
    label: "Strategies",
    singular: "strategy",
    titleKey: "name",
    publishable: true,
    search: ["name", "summary"],
    sort: { key: "sort_order", ascending: true },
    tags: ["strategies"],
    columns: [
      { key: "name", label: "Name" },
      { key: "is_active", label: "Active", kind: "bool" },
      { key: "is_public", label: "Public", kind: "bool" },
    ],
    fields: [
      { key: "name", label: "Name", type: "text", required: true, maxLength: 120 },
      { key: "slug", label: "URL slug", type: "text", required: true, slugFrom: "name" },
      { key: "summary", label: "Summary", type: "textarea" },
      { key: "timeframes", label: "Timeframes", type: "tags" },
      { key: "markets", label: "Markets", type: "tags" },
      { key: "entry_rules", label: "Entry rules", type: "markdown" },
      { key: "exit_rules", label: "Exit rules", type: "markdown" },
      { key: "risk_rules", label: "Risk rules", type: "markdown" },
      { key: "checklist", label: "Pre-trade checklist", type: "checklist" },
      { key: "cover_image_url", label: "Cover image", type: "image", bucket: "site-media" },
      { key: "is_active", label: "Currently trading this", type: "boolean", defaultValue: true },
      { key: "sort_order", label: "Sort order", type: "number", step: "1", defaultValue: 0 },
      VIS,
    ],
  },
  journal: {
    key: "journal",
    table: "journal_entries",
    label: "Journal",
    singular: "journal entry",
    titleKey: "date",
    publishable: true,
    search: ["pre_market_plan", "post_market_review", "lessons"],
    sort: { key: "date", ascending: false },
    tags: ["journal"],
    columns: [
      { key: "date", label: "Date", kind: "date" },
      { key: "mood", label: "Mood" },
      { key: "focus", label: "Focus" },
      { key: "lessons", label: "Lesson" },
      { key: "is_public", label: "Public", kind: "bool" },
    ],
    fields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "pre_market_plan", label: "Pre-market plan", type: "markdown", template: JOURNAL_PLAN },
      { key: "post_market_review", label: "Post-market review", type: "markdown", template: JOURNAL_REVIEW },
      { key: "mood", label: "Mood (1–5)", type: "number", step: "1", min: 1, max: 5 },
      { key: "focus", label: "Focus (1–5)", type: "number", step: "1", min: 1, max: 5 },
      { key: "lessons", label: "Lesson of the day", type: "textarea" },
      { key: "tags", label: "Tags", type: "tags" },
      VIS,
    ],
  },
  toolkit: {
    key: "toolkit",
    table: "toolkit_items",
    label: "Toolkit",
    singular: "toolkit item",
    titleKey: "name",
    publishable: true,
    search: ["name", "description"],
    sort: { key: "sort_order", ascending: true },
    tags: ["toolkit"],
    columns: [
      { key: "name", label: "Name" },
      { key: "category", label: "Category", kind: "badge" },
      { key: "is_affiliate", label: "Affiliate", kind: "bool" },
      { key: "is_public", label: "Public", kind: "bool" },
    ],
    fields: [
      {
        key: "category",
        label: "Category",
        type: "select",
        required: true,
        defaultValue: "platform",
        options: ["platform", "charting", "indicator", "hardware", "broker", "education", "other"].map((v) => ({ value: v, label: v[0]!.toUpperCase() + v.slice(1) })),
      },
      { key: "name", label: "Name", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "url", label: "Link", type: "url" },
      { key: "image_url", label: "Image", type: "image", bucket: "site-media" },
      { key: "is_affiliate", label: "Affiliate link (labelled publicly)", type: "boolean", defaultValue: false },
      { key: "sort_order", label: "Sort order", type: "number", step: "1", defaultValue: 0 },
      VIS,
    ],
  },
  goals: {
    key: "goals",
    table: "goals",
    label: "Goals",
    singular: "goal",
    titleKey: "title",
    publishable: true,
    search: ["title"],
    sort: { key: "sort_order", ascending: true },
    tags: ["goals"],
    columns: [
      { key: "title", label: "Title" },
      { key: "metric", label: "Metric", kind: "badge" },
      { key: "target_amount", label: "Target", kind: "money" },
      { key: "deadline", label: "Deadline", kind: "date" },
    ],
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      {
        key: "metric",
        label: "Progress comes from",
        type: "select",
        required: true,
        defaultValue: "total_payouts",
        options: [
          { value: "total_payouts", label: "Total payouts" },
          { value: "monthly_pnl", label: "This month's net P&L" },
          { value: "funded_capital", label: "Funded capital" },
          { value: "custom", label: "Manual value" },
        ],
      },
      { key: "target_amount", label: "Target ($)", type: "number", step: "1", min: 1, required: true },
      { key: "current_override", label: "Current value (manual; blank = automatic)", type: "number", step: "0.01" },
      { key: "deadline", label: "Deadline", type: "date" },
      { key: "sort_order", label: "Sort order", type: "number", step: "1", defaultValue: 0 },
      VIS,
    ],
  },
  posts: {
    key: "posts",
    table: "posts",
    label: "Insights",
    singular: "post",
    titleKey: "title",
    publishable: true,
    search: ["title", "excerpt"],
    sort: { key: "published_at", ascending: false },
    tags: ["posts"],
    columns: [
      { key: "title", label: "Title" },
      { key: "published_at", label: "Published", kind: "datetime" },
      { key: "is_public", label: "Public", kind: "bool" },
    ],
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "slug", label: "URL slug", type: "text", required: true, slugFrom: "title" },
      { key: "excerpt", label: "Excerpt", type: "textarea" },
      { key: "body", label: "Body", type: "markdown", required: true },
      { key: "cover_url", label: "Cover image", type: "image", bucket: "site-media" },
      { key: "published_at", label: "Publish at (blank = draft)", type: "datetime" },
      VIS,
    ],
  },
  milestones: {
    key: "milestones",
    table: "milestones",
    label: "Milestones",
    singular: "milestone",
    titleKey: "title",
    publishable: true,
    search: ["title"],
    sort: { key: "date", ascending: true },
    tags: ["milestones"],
    columns: [
      { key: "date", label: "Date", kind: "date" },
      { key: "title", label: "Title" },
      { key: "is_public", label: "Public", kind: "bool" },
    ],
    fields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "title", label: "Title", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
      VIS,
    ],
  },
};

export function getResource(key: string): Resource | null {
  return Object.hasOwn(RESOURCES, key) ? RESOURCES[key]! : null;
}

// ── zod schema built from fields ────────────────────────────────────

const emptyToNull = (v: unknown) => (v === "" || v === undefined || (typeof v === "number" && Number.isNaN(v)) ? null : v);

function fieldSchema(f: Field): z.ZodType {
  let s: z.ZodType;
  switch (f.type) {
    case "number": {
      let n = z.coerce.number({ error: `${f.label} must be a number.` });
      if (f.min !== undefined) n = n.min(f.min, `${f.label} must be at least ${f.min}.`);
      if (f.max !== undefined) n = n.max(f.max, `${f.label} must be at most ${f.max}.`);
      if (f.step === "1") n = n.int(`${f.label} must be a whole number.`);
      s = n;
      break;
    }
    case "boolean":
      return z.preprocess((v) => v === true || v === "true" || v === "on", z.boolean());
    case "tags":
      return z.preprocess(
        (v) => (Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : []),
        z.array(z.string().trim().min(1).max(40)).max(30).transform((a) => [...new Set(a.map((x) => x.trim()).filter(Boolean))]),
      );
    case "checklist":
      return z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(z.object({ text: z.string().trim().min(1).max(200) })).max(30));
    case "url":
      s = z.url({ error: `${f.label} must be a full link starting with https://` }).max(500);
      break;
    case "image":
    case "file":
      s = z.string().max(1000);
      break;
    case "date":
      s = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `${f.label} must be a date.`);
      break;
    case "datetime":
      s = z.string().refine((v) => !Number.isNaN(Date.parse(v)), `${f.label} must be a date and time.`);
      break;
    case "select":
      s = z.enum((f.options ?? []).map((o) => o.value) as [string, ...string[]], { error: `Choose a ${f.label.toLowerCase()}.` });
      break;
    case "relation":
      s = z.uuid(`Choose a ${f.label.toLowerCase()}.`);
      break;
    default: {
      let t = z.string().trim();
      if (f.maxLength) t = t.max(f.maxLength, `${f.label} must be ${f.maxLength} characters or fewer.`);
      if (f.slugFrom) t = t.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only.");
      s = t;
    }
  }
  if (f.required) return z.preprocess(emptyToNull, s.refine((v) => v !== null, `${f.label} is required.`));
  return z.preprocess(emptyToNull, s.nullable());
}

export function resourceSchema(r: Resource) {
  return z.object(Object.fromEntries(r.fields.flatMap((f) => [[f.key, fieldSchema(f)], ...(f.thumbKey ? [[f.thumbKey, z.preprocess(emptyToNull, z.string().max(1000).nullable())]] : [])])));
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export const ADMIN_NAV: { href: string; label: string; group: string }[] = [
  { href: "/admin", label: "Overview", group: "Daily" },
  { href: "/admin/eod", label: "End-of-day update", group: "Daily" },
  { href: "/admin/trades/quick", label: "Quick add trade", group: "Daily" },
  { href: "/admin/r/trades", label: "Trades", group: "Trading" },
  { href: "/admin/import", label: "CSV import", group: "Trading" },
  { href: "/admin/r/positions", label: "Open positions", group: "Trading" },
  { href: "/admin/r/accounts", label: "Accounts", group: "Trading" },
  { href: "/admin/r/firms", label: "Firms", group: "Trading" },
  { href: "/admin/r/payouts", label: "Payouts", group: "Trading" },
  { href: "/admin/r/strategies", label: "Strategies", group: "Content" },
  { href: "/admin/r/journal", label: "Journal", group: "Content" },
  { href: "/admin/r/posts", label: "Insights", group: "Content" },
  { href: "/admin/r/toolkit", label: "Toolkit", group: "Content" },
  { href: "/admin/r/goals", label: "Goals", group: "Content" },
  { href: "/admin/r/milestones", label: "Milestones", group: "Content" },
  { href: "/admin/messages", label: "Messages", group: "Site" },
  { href: "/admin/settings", label: "Settings", group: "Site" },
  { href: "/admin/data", label: "Data & backups", group: "Site" },
  { href: "/admin/activity", label: "Activity log", group: "Site" },
];
