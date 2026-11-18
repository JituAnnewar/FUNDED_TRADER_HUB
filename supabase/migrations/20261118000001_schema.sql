-- ════════════════════════════════════════════════════════════════════
-- Schema: prop firm trader portfolio, journal and admin
-- All timestamps are timestamptz (UTC). Display time zone is handled in the app.
-- ════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Enums ───────────────────────────────────────────────────────────
create type public.drawdown_type as enum ('static', 'trailing_eod', 'trailing_intraday');
create type public.account_phase as enum (
  'challenge_phase_1', 'challenge_phase_2', 'funded', 'passed', 'payout_pending', 'breached', 'closed'
);
create type public.trading_platform as enum (
  'MT4', 'MT5', 'cTrader', 'DXtrade', 'Match-Trader', 'Tradovate', 'Rithmic', 'NinjaTrader', 'TradingView', 'Other'
);
create type public.trade_direction as enum ('long', 'short');
create type public.market_type as enum ('forex', 'index', 'commodity', 'crypto', 'futures', 'stock');
create type public.trade_session as enum ('asia', 'london', 'new_york', 'london_ny_overlap');
create type public.image_kind as enum ('before', 'after', 'other');
create type public.payout_method as enum ('bank', 'crypto', 'rise', 'deel', 'other');
create type public.toolkit_category as enum ('platform', 'charting', 'indicator', 'hardware', 'broker', 'education', 'other');
create type public.goal_metric as enum ('total_payouts', 'monthly_pnl', 'funded_capital', 'custom');
create type public.message_category as enum ('mentorship', 'collaboration', 'business', 'general');
create type public.message_status as enum ('new', 'read', 'replied', 'archived');

-- ── updated_at trigger ─────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ── Admins ─────────────────────────────────────────────────────────
create table public.admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ── Firms ──────────────────────────────────────────────────────────
create table public.firms (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_demo boolean not null default false,
  is_public boolean not null default true,
  name text not null,
  slug text not null unique,
  logo_url text,
  website text,
  description text,
  profit_split_pct numeric(5,2),
  drawdown_type public.drawdown_type not null default 'static',
  max_daily_loss_pct numeric(5,2),
  max_total_loss_pct numeric(5,2),
  profit_target_phase1_pct numeric(5,2),
  profit_target_phase2_pct numeric(5,2),
  min_trading_days int,
  consistency_rule_pct numeric(5,2),
  payout_frequency text,
  personal_review text,
  sort_order int not null default 0
);

-- ── Accounts ───────────────────────────────────────────────────────
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_demo boolean not null default false,
  is_public boolean not null default true,
  firm_id uuid not null references public.firms (id) on delete restrict,
  label text not null,
  account_size numeric(14,2) not null check (account_size > 0),
  currency text not null default 'USD',
  phase public.account_phase not null default 'challenge_phase_1',
  platform public.trading_platform not null default 'MT5',
  masked_account_id text check (masked_account_id is null or char_length(masked_account_id) <= 4),
  starting_balance numeric(14,2) not null,
  current_balance numeric(14,2) not null,
  current_equity numeric(14,2) not null,
  high_water_mark numeric(14,2) not null,
  start_date date not null default current_date,
  status_note text,
  private_notes text,
  -- Rule overrides (null = use firm rule)
  drawdown_type public.drawdown_type,
  max_daily_loss_pct numeric(5,2),
  max_total_loss_pct numeric(5,2),
  profit_target_phase1_pct numeric(5,2),
  profit_target_phase2_pct numeric(5,2),
  min_trading_days int,
  consistency_rule_pct numeric(5,2),
  sort_order int not null default 0
);
create index accounts_firm_idx on public.accounts (firm_id);

create table public.account_phase_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_demo boolean not null default false,
  account_id uuid not null references public.accounts (id) on delete cascade,
  from_phase public.account_phase,
  to_phase public.account_phase not null,
  changed_at timestamptz not null default now(),
  note text
);
create index aph_account_idx on public.account_phase_history (account_id, changed_at);

create table public.account_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_demo boolean not null default false,
  account_id uuid not null references public.accounts (id) on delete cascade,
  date date not null,
  balance numeric(14,2) not null,
  equity numeric(14,2) not null,
  day_pnl numeric(14,2) not null default 0,
  note text,
  unique (account_id, date)
);
create index snapshots_date_idx on public.account_snapshots (date);

create table public.open_positions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_demo boolean not null default false,
  account_id uuid not null references public.accounts (id) on delete cascade,
  symbol text not null,
  direction public.trade_direction not null,
  size numeric(14,4) not null,
  entry_price numeric(18,6) not null,
  stop_loss numeric(18,6),
  take_profit numeric(18,6),
  opened_at timestamptz not null default now(),
  floating_pnl numeric(14,2) not null default 0
);

-- ── Strategies ─────────────────────────────────────────────────────
create table public.strategies (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_demo boolean not null default false,
  is_public boolean not null default true,
  name text not null,
  slug text not null unique,
  summary text,
  timeframes text[] not null default '{}',
  markets text[] not null default '{}',
  entry_rules text,
  exit_rules text,
  risk_rules text,
  checklist jsonb not null default '[]'::jsonb,
  cover_image_url text,
  is_active boolean not null default true,
  sort_order int not null default 0
);

-- ── Trades ─────────────────────────────────────────────────────────
create table public.trades (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_demo boolean not null default false,
  is_public boolean not null default true,
  account_id uuid not null references public.accounts (id) on delete cascade,
  strategy_id uuid references public.strategies (id) on delete set null,
  symbol text not null,
  market public.market_type not null default 'forex',
  direction public.trade_direction not null,
  opened_at timestamptz not null,
  closed_at timestamptz,
  entry_price numeric(18,6),
  exit_price numeric(18,6),
  stop_loss numeric(18,6),
  take_profit numeric(18,6),
  size numeric(14,4),
  risk_amount numeric(14,2) check (risk_amount is null or risk_amount >= 0),
  pnl numeric(14,2) not null default 0,
  fees numeric(14,2) not null default 0,
  net_pnl numeric(14,2) generated always as (pnl - fees) stored,
  r_multiple numeric(8,2) generated always as (
    case when risk_amount > 0 then round((pnl - fees) / risk_amount, 2) end
  ) stored,
  session public.trade_session,
  timeframe text,
  setup_tags text[] not null default '{}',
  mistake_tags text[] not null default '{}',
  emotion_before text,
  emotion_after text,
  rating smallint check (rating between 1 and 5),
  followed_plan boolean,
  notes text,
  private_notes text,
  external_ticket_id text,
  unique (account_id, external_ticket_id)
);
create index trades_account_idx on public.trades (account_id, opened_at desc);
create index trades_opened_idx on public.trades (opened_at desc);
create index trades_strategy_idx on public.trades (strategy_id);

create table public.trade_images (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_demo boolean not null default false,
  trade_id uuid not null references public.trades (id) on delete cascade,
  url text not null,
  caption text,
  kind public.image_kind not null default 'other',
  sort_order int not null default 0
);
create index trade_images_trade_idx on public.trade_images (trade_id);

-- ── Payouts ────────────────────────────────────────────────────────
create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_demo boolean not null default false,
  is_public boolean not null default true,
  account_id uuid references public.accounts (id) on delete set null,
  firm_id uuid not null references public.firms (id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'USD',
  paid_on date not null,
  method public.payout_method not null default 'bank',
  certificate_url text,
  certificate_thumb_url text,
  verification_url text,
  note text,
  is_featured boolean not null default false
);
create index payouts_paid_idx on public.payouts (paid_on desc);

-- ── Journal ────────────────────────────────────────────────────────
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_demo boolean not null default false,
  is_public boolean not null default true,
  date date not null unique,
  pre_market_plan text,
  post_market_review text,
  mood smallint check (mood between 1 and 5),
  focus smallint check (focus between 1 and 5),
  lessons text,
  tags text[] not null default '{}'
);

-- ── Toolkit, goals, posts ──────────────────────────────────────────
create table public.toolkit_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_demo boolean not null default false,
  is_public boolean not null default true,
  category public.toolkit_category not null default 'other',
  name text not null,
  description text,
  url text,
  image_url text,
  is_affiliate boolean not null default false,
  sort_order int not null default 0
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_demo boolean not null default false,
  is_public boolean not null default true,
  title text not null,
  metric public.goal_metric not null default 'custom',
  target_amount numeric(14,2) not null check (target_amount > 0),
  current_override numeric(14,2),
  deadline date,
  sort_order int not null default 0
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_demo boolean not null default false,
  is_public boolean not null default true,
  title text not null,
  slug text not null unique,
  excerpt text,
  body text not null default '',
  cover_url text,
  published_at timestamptz
);

-- ── Milestones (About page timeline) ───────────────────────────────
create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_demo boolean not null default false,
  is_public boolean not null default true,
  date date not null,
  title text not null,
  description text
);

-- ── Contact messages ───────────────────────────────────────────────
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_demo boolean not null default false,
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254),
  category public.message_category not null default 'general',
  subject text not null check (char_length(subject) between 1 and 200),
  message text not null check (char_length(message) between 1 and 5000),
  status public.message_status not null default 'new',
  ip_hash text,
  user_agent text
);
create index contact_ip_idx on public.contact_messages (ip_hash, created_at desc);

-- ── Site settings (single row) ─────────────────────────────────────
create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  singleton boolean not null default true unique check (singleton),
  brand_name text not null default 'JEETU',
  trader_name text not null default 'JEETU',
  tagline text not null default 'LESS IS MORE',
  hero_copy text,
  about_text text,
  avatar_url text,
  socials jsonb not null default '{}'::jsonb,
  sections jsonb not null default '{}'::jsonb,
  show_open_positions_publicly boolean not null default false,
  usd_to_inr_rate numeric(10,4) not null default 84.0,
  disclaimer_text text,
  seo_title text,
  seo_description text,
  show_tradingview_widgets boolean not null default false
);
insert into public.site_settings (singleton) values (true);

-- ── Activity log ───────────────────────────────────────────────────
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  actor uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  diff jsonb
);
create index activity_created_idx on public.activity_log (created_at desc);

create or replace function public.log_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  rec_id uuid;
  d jsonb;
begin
  -- Only log writes made by a signed-in user (admin UI). Service-role scripts (seed) are skipped.
  if auth.uid() is null then
    return coalesce(new, old);
  end if;
  -- Demo rows (bulk load / bulk delete) are not logged, to keep the log readable.
  if coalesce((to_jsonb(coalesce(new, old)) ->> 'is_demo')::boolean, false) then
    return coalesce(new, old);
  end if;
  if tg_op = 'DELETE' then
    rec_id := old.id;
    d := jsonb_build_object('old', to_jsonb(old));
  elsif tg_op = 'UPDATE' then
    rec_id := new.id;
    select jsonb_object_agg(n.key, jsonb_build_object('from', o.value, 'to', n.value))
      into d
      from jsonb_each(to_jsonb(new)) n
      join jsonb_each(to_jsonb(old)) o using (key)
      where n.value is distinct from o.value and n.key <> 'updated_at';
  else
    rec_id := new.id;
    d := jsonb_build_object('new', to_jsonb(new));
  end if;
  insert into public.activity_log (actor, action, entity, entity_id, diff)
  values (auth.uid(), lower(tg_op), tg_table_name, rec_id, d);
  return coalesce(new, old);
end $$;

-- Attach updated_at + activity triggers to every content table.
do $$
declare t text;
begin
  foreach t in array array[
    'admins', 'firms', 'accounts', 'account_phase_history', 'account_snapshots', 'open_positions',
    'strategies', 'trades', 'trade_images', 'payouts', 'journal_entries', 'toolkit_items', 'goals',
    'posts', 'milestones', 'contact_messages', 'site_settings', 'activity_log'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_updated_at', t);
  end loop;
  foreach t in array array[
    'firms', 'accounts', 'account_phase_history', 'account_snapshots', 'open_positions', 'strategies',
    'trades', 'trade_images', 'payouts', 'journal_entries', 'toolkit_items', 'goals', 'posts',
    'milestones', 'contact_messages', 'site_settings'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function public.log_activity()',
      t || '_activity', t);
  end loop;
end $$;

-- Record phase changes automatically.
create or replace function public.track_phase_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.account_phase_history (account_id, from_phase, to_phase, changed_at, is_demo)
    values (new.id, null, new.phase, coalesce(new.start_date::timestamptz, now()), new.is_demo);
  elsif new.phase is distinct from old.phase then
    insert into public.account_phase_history (account_id, from_phase, to_phase, is_demo)
    values (new.id, old.phase, new.phase, new.is_demo);
  end if;
  return new;
end $$;

create trigger accounts_phase_history
after insert or update of phase on public.accounts
for each row execute function public.track_phase_change();
