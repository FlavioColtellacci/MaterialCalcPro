-- MaterialCalcPro: WordPress migration target schema
-- Run once in Supabase SQL Editor before `npm run migration:seed`.
-- Service role bypasses RLS for seeding; anon key is used by Next.js for reads.

-- Pages (one row per public route slug)
create table if not exists public.pages (
  slug text primary key,
  title text not null,
  body_html text not null default '',
  excerpt text,
  status text not null default 'publish',
  publish_date timestamptz,
  source_post_id bigint not null unique
);

-- SEO metadata (Rank Math–derived fields)
create table if not exists public.seo_meta (
  slug text primary key references public.pages (slug) on delete cascade,
  title text not null,
  description text,
  canonical text,
  og jsonb,
  twitter jsonb
);

-- Calculator definitions (reference + preserved WP script/style payload)
create table if not exists public.calculator_definitions (
  slug text primary key references public.pages (slug) on delete cascade,
  source_post_id bigint not null,
  wrapper_id text,
  input_schema jsonb,
  unit_systems jsonb,
  formula_source jsonb not null default '{}'::jsonb,
  copy_blocks jsonb not null default '{}'::jsonb
);

-- Extra calculator sections (FAQ, related links, etc.)
create table if not exists public.calculator_content_blocks (
  id bigserial primary key,
  slug text not null references public.pages (slug) on delete cascade,
  block_key text not null,
  block_type text,
  heading text,
  content_html text not null default '',
  sort_order integer not null default 0,
  unique (slug, block_key)
);

-- Raw WordPress post snapshot for audits / re-migration
create table if not exists public.raw_wp_items (
  source_post_id bigint primary key,
  slug text,
  post_type text,
  source_payload jsonb not null
);

-- Key/value site configuration (GA4, AdSense, canonical base, etc.)
create table if not exists public.site_settings (
  setting_key text primary key,
  setting_value jsonb
);

-- Row Level Security: public read for the Next.js anon client
alter table public.pages enable row level security;
alter table public.seo_meta enable row level security;
alter table public.calculator_definitions enable row level security;
alter table public.calculator_content_blocks enable row level security;
alter table public.raw_wp_items enable row level security;
alter table public.site_settings enable row level security;

create policy "Allow public read on pages"
  on public.pages for select using (true);

create policy "Allow public read on seo_meta"
  on public.seo_meta for select using (true);

create policy "Allow public read on calculator_definitions"
  on public.calculator_definitions for select using (true);

create policy "Allow public read on calculator_content_blocks"
  on public.calculator_content_blocks for select using (true);

create policy "Allow public read on raw_wp_items"
  on public.raw_wp_items for select using (true);

create policy "Allow public read on site_settings"
  on public.site_settings for select using (true);
