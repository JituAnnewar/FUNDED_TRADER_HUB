-- Saved CSV column-mapping presets for the admin importer.
alter table public.site_settings add column if not exists import_presets jsonb not null default '[]'::jsonb;

-- Anonymous visitors never need the presets.
revoke select on public.site_settings from anon;
grant select (
  id, created_at, updated_at, singleton, brand_name, trader_name, tagline, hero_copy, about_text, avatar_url,
  socials, sections, show_open_positions_publicly, usd_to_inr_rate, disclaimer_text, seo_title, seo_description,
  show_tradingview_widgets
) on public.site_settings to anon;
