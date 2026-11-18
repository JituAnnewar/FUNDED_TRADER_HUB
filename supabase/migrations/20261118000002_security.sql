-- ════════════════════════════════════════════════════════════════════
-- Row Level Security, column privileges, RPCs, storage, realtime
-- ════════════════════════════════════════════════════════════════════

-- ── Enable RLS everywhere ──────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'admins', 'firms', 'accounts', 'account_phase_history', 'account_snapshots', 'open_positions',
    'strategies', 'trades', 'trade_images', 'payouts', 'journal_entries', 'toolkit_items', 'goals',
    'posts', 'milestones', 'contact_messages', 'site_settings', 'activity_log'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- ── Admin: full access on every table ──────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'firms', 'accounts', 'account_phase_history', 'account_snapshots', 'open_positions',
    'strategies', 'trades', 'trade_images', 'payouts', 'journal_entries', 'toolkit_items', 'goals',
    'posts', 'milestones', 'contact_messages', 'site_settings', 'activity_log'
  ] loop
    execute format(
      'create policy "admin all" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t);
  end loop;
end $$;

create policy "admin read admins" on public.admins for select to authenticated using (public.is_admin());

-- ── Public read policies ───────────────────────────────────────────
-- Helper: an account is publicly visible when it and its firm are public.
create or replace function public.account_is_public(acc uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.accounts a join public.firms f on f.id = a.firm_id
    where a.id = acc and a.is_public and f.is_public
  );
$$;

create policy "public read" on public.firms for select to anon, authenticated using (is_public);
create policy "public read" on public.accounts for select to anon, authenticated
  using (is_public and exists (select 1 from public.firms f where f.id = firm_id and f.is_public));
create policy "public read" on public.account_phase_history for select to anon, authenticated
  using (public.account_is_public(account_id));
create policy "public read" on public.account_snapshots for select to anon, authenticated
  using (public.account_is_public(account_id));
create policy "public read" on public.open_positions for select to anon, authenticated
  using (
    public.account_is_public(account_id)
    and (select show_open_positions_publicly from public.site_settings limit 1)
  );
create policy "public read" on public.strategies for select to anon, authenticated using (is_public);
create policy "public read" on public.trades for select to anon, authenticated
  using (is_public and public.account_is_public(account_id));
create policy "public read" on public.trade_images for select to anon, authenticated
  using (exists (
    select 1 from public.trades t where t.id = trade_id and t.is_public and public.account_is_public(t.account_id)
  ));
create policy "public read" on public.payouts for select to anon, authenticated
  using (is_public and exists (select 1 from public.firms f where f.id = firm_id and f.is_public));
create policy "public read" on public.journal_entries for select to anon, authenticated using (is_public);
create policy "public read" on public.toolkit_items for select to anon, authenticated using (is_public);
create policy "public read" on public.goals for select to anon, authenticated using (is_public);
create policy "public read" on public.posts for select to anon, authenticated
  using (is_public and published_at is not null and published_at <= now());
create policy "public read" on public.milestones for select to anon, authenticated using (is_public);
create policy "public read" on public.site_settings for select to anon, authenticated using (true);
-- contact_messages, activity_log, admins: no public policies → anon cannot read or write.

-- ── Column privileges: hide private columns from anon ──────────────
revoke select on public.accounts from anon;
grant select (
  id, created_at, updated_at, is_demo, is_public, firm_id, label, account_size, currency, phase, platform,
  masked_account_id, starting_balance, current_balance, current_equity, high_water_mark, start_date,
  status_note, drawdown_type, max_daily_loss_pct, max_total_loss_pct, profit_target_phase1_pct,
  profit_target_phase2_pct, min_trading_days, consistency_rule_pct, sort_order
) on public.accounts to anon;

revoke select on public.trades from anon;
grant select (
  id, created_at, updated_at, is_demo, is_public, account_id, strategy_id, symbol, market, direction,
  opened_at, closed_at, entry_price, exit_price, stop_loss, take_profit, size, risk_amount, pnl, fees,
  net_pnl, r_multiple, session, timeframe, setup_tags, mistake_tags, emotion_before, emotion_after, rating,
  followed_plan, notes, external_ticket_id
) on public.trades to anon;

-- Anon has no write privileges at all; contact goes through the RPC below.
revoke insert, update, delete on all tables in schema public from anon;
revoke all on public.contact_messages from anon;
revoke all on public.activity_log from anon;
revoke all on public.admins from anon;

-- ── Contact form RPC (rate limited: 3 per 10 minutes per IP hash) ──
create or replace function public.submit_contact_message(
  p_name text,
  p_email text,
  p_category public.message_category,
  p_subject text,
  p_message text,
  p_ip_hash text,
  p_user_agent text
) returns text
language plpgsql security definer set search_path = public as $$
declare
  recent int;
begin
  if p_ip_hash is null or char_length(p_ip_hash) < 16 then
    raise exception 'invalid request';
  end if;
  select count(*) into recent from public.contact_messages
   where ip_hash = p_ip_hash and created_at > now() - interval '10 minutes';
  if recent >= 3 then
    return 'rate_limited';
  end if;
  insert into public.contact_messages (name, email, category, subject, message, ip_hash, user_agent)
  values (
    left(trim(p_name), 120), left(trim(p_email), 254), p_category, left(trim(p_subject), 200),
    left(trim(p_message), 5000), p_ip_hash, left(p_user_agent, 400)
  );
  return 'ok';
end $$;
revoke all on function public.submit_contact_message from public;
grant execute on function public.submit_contact_message to anon, authenticated;

-- ── Demo data helpers ──────────────────────────────────────────────
create or replace function public.site_has_demo_data()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.firms where is_demo)
      or exists (select 1 from public.accounts where is_demo)
      or exists (select 1 from public.trades where is_demo)
      or exists (select 1 from public.payouts where is_demo);
$$;
grant execute on function public.site_has_demo_data to anon, authenticated;

create or replace function public.remove_demo_data()
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;
  delete from public.trade_images where is_demo;
  delete from public.trades where is_demo;
  delete from public.open_positions where is_demo;
  delete from public.account_snapshots where is_demo;
  delete from public.account_phase_history where is_demo;
  delete from public.payouts where is_demo;
  delete from public.accounts where is_demo;
  delete from public.firms where is_demo and not exists (select 1 from public.accounts a where a.firm_id = firms.id);
  delete from public.strategies where is_demo;
  delete from public.journal_entries where is_demo;
  delete from public.toolkit_items where is_demo;
  delete from public.goals where is_demo;
  delete from public.posts where is_demo;
  delete from public.milestones where is_demo;
  delete from public.contact_messages where is_demo;
end $$;
revoke all on function public.remove_demo_data from public, anon;
grant execute on function public.remove_demo_data to authenticated;

-- ── Storage buckets (public read, admin write) ─────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('certificates', 'certificates', true, 10485760, array['image/webp', 'image/png', 'image/jpeg', 'application/pdf']),
  ('trade-screenshots', 'trade-screenshots', true, 10485760, array['image/webp', 'image/png', 'image/jpeg']),
  ('firm-logos', 'firm-logos', true, 2097152, array['image/webp', 'image/png', 'image/jpeg', 'image/svg+xml']),
  ('site-media', 'site-media', true, 10485760, array['image/webp', 'image/png', 'image/jpeg'])
on conflict (id) do nothing;

create policy "public read site buckets" on storage.objects for select to anon, authenticated
  using (bucket_id in ('certificates', 'trade-screenshots', 'firm-logos', 'site-media'));
create policy "admin insert site buckets" on storage.objects for insert to authenticated
  with check (bucket_id in ('certificates', 'trade-screenshots', 'firm-logos', 'site-media') and public.is_admin());
create policy "admin update site buckets" on storage.objects for update to authenticated
  using (bucket_id in ('certificates', 'trade-screenshots', 'firm-logos', 'site-media') and public.is_admin());
create policy "admin delete site buckets" on storage.objects for delete to authenticated
  using (bucket_id in ('certificates', 'trade-screenshots', 'firm-logos', 'site-media') and public.is_admin());

-- ── Realtime (Today panel, live P&L flashes) ───────────────────────
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.account_snapshots, public.accounts;
  end if;
end $$;
