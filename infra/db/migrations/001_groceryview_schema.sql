-- GroceryView product schema for PostgreSQL 18 with PostGIS and pg_trgm.
-- Price facts are stored as immutable observations; latest_prices is a rollup.

create extension if not exists pgcrypto;
create extension if not exists postgis;
create extension if not exists pg_trgm;

create table if not exists chains (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  name text not null,
  country_code char(2) not null default 'SE',
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references chains(id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  external_ref text,
  name text not null,
  address_line1 text not null,
  address_line2 text,
  postal_code text,
  city text not null,
  region text,
  country_code char(2) not null default 'SE',
  position geography(point, 4326),
  store_type text not null default 'supermarket',
  opening_hours jsonb not null default '{}'::jsonb,
  online_order_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chain_id, external_ref)
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  canonical_name text not null,
  brand text,
  brand_owner text,
  private_label_owner text,
  barcode text,
  category_path text[] not null default '{}',
  package_size numeric(12, 3),
  package_unit text,
  comparable_unit text not null,
  nutrition jsonb not null default '{}'::jsonb,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists aliases (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  source_type text not null check (source_type in ('retailer', 'receipt', 'community', 'import', 'manual')),
  source_ref text,
  match_confidence numeric(5, 4) not null check (match_confidence between 0 and 1),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (normalized_alias, source_type, source_ref)
);

create table if not exists source_runs (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('retailer_api', 'retailer_page', 'weekly_leaflet', 'receipt_ocr', 'community_report', 'manual_seed')),
  source_name text not null,
  source_url text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null check (status in ('running', 'succeeded', 'failed', 'partial')),
  provenance jsonb not null default '{}'::jsonb,
  error_message text
);

create table if not exists raw_records (
  id uuid primary key default gen_random_uuid(),
  source_run_id uuid not null references source_runs(id) on delete cascade,
  record_type text not null check (record_type in ('product', 'store', 'price', 'promotion', 'receipt', 'community_report')),
  external_ref text,
  observed_at timestamptz,
  payload jsonb not null,
  payload_hash text not null,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_run_id, payload_hash)
);

create table if not exists observations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete restrict,
  chain_id uuid not null references chains(id) on delete restrict,
  store_id uuid references stores(id) on delete restrict,
  source_run_id uuid references source_runs(id) on delete set null,
  raw_record_id uuid references raw_records(id) on delete set null,
  retailer_product_ref text,
  price_type text not null check (price_type in ('shelf', 'online', 'member', 'promotion', 'receipt', 'community', 'estimated')),
  price numeric(12, 2) not null check (price >= 0),
  regular_price numeric(12, 2) check (regular_price is null or regular_price >= 0),
  unit_price numeric(12, 4) not null check (unit_price >= 0),
  currency char(3) not null default 'SEK',
  quantity numeric(12, 3),
  quantity_unit text,
  promotion_text text,
  promotion_starts_on date,
  promotion_ends_on date,
  member_required boolean not null default false,
  observed_at timestamptz not null,
  valid_from timestamptz,
  valid_until timestamptz,
  confidence numeric(5, 4) not null check (confidence between 0 and 1),
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (store_id is not null or price_type = 'online')
);

create table if not exists latest_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  chain_id uuid not null references chains(id) on delete cascade,
  store_id uuid references stores(id) on delete cascade,
  price_type text not null check (price_type in ('shelf', 'online', 'member', 'promotion', 'receipt', 'community', 'estimated')),
  observation_id uuid not null references observations(id) on delete restrict,
  price numeric(12, 2) not null check (price >= 0),
  regular_price numeric(12, 2) check (regular_price is null or regular_price >= 0),
  unit_price numeric(12, 4) not null check (unit_price >= 0),
  currency char(3) not null default 'SEK',
  observed_at timestamptz not null,
  confidence numeric(5, 4) not null check (confidence between 0 and 1),
  provenance jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique nulls not distinct (product_id, chain_id, store_id, price_type)
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  display_name text,
  home_store_id uuid references stores(id) on delete set null,
  preferred_currency char(3) not null default 'SEK',
  dietary_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null default 'Watchlist',
  product_id uuid references products(id) on delete cascade,
  category_path text[],
  target_price numeric(12, 2) check (target_price is null or target_price >= 0),
  favorite_stores_only boolean not null default true,
  include_member_prices boolean not null default false,
  allowed_price_types text[] not null default array['shelf']::text[] check (
    cardinality(allowed_price_types) > 0
    and allowed_price_types <@ array['shelf', 'member', 'promotion', 'estimated']::text[]
  ),
  created_at timestamptz not null default now(),
  check (product_id is not null or category_path is not null)
);

create table if not exists baskets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null default 'Weekly basket',
  week_start date,
  status text not null default 'planning' check (status in ('planning', 'active', 'completed', 'archived')),
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  period text not null check (period in ('weekly', 'monthly')),
  amount numeric(12, 2) not null check (amount >= 0),
  currency char(3) not null default 'SEK',
  category_path text[],
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  watchlist_id uuid references watchlists(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  store_id uuid references stores(id) on delete cascade,
  alert_type text not null check (alert_type in ('target_price', 'deal_score', 'back_in_stock', 'price_drop')),
  target_price numeric(12, 2) check (target_price is null or target_price >= 0),
  deal_score_threshold integer check (deal_score_threshold between 0 and 100),
  active boolean not null default true,
  last_triggered_at timestamptz,
  created_at timestamptz not null default now(),
  check (watchlist_id is not null or product_id is not null)
);

create index if not exists stores_position_gix on stores using gist (position);
create index if not exists stores_name_trgm_idx on stores using gin (name gin_trgm_ops);
create index if not exists stores_slug_trgm_idx on stores using gin (slug gin_trgm_ops);
create unique index if not exists products_barcode_unique_idx on products (barcode) where barcode is not null;
create index if not exists products_name_trgm_idx on products using gin (canonical_name gin_trgm_ops);
create index if not exists products_slug_trgm_idx on products using gin (slug gin_trgm_ops);
create index if not exists aliases_normalized_trgm_idx on aliases using gin (normalized_alias gin_trgm_ops);
create index if not exists observations_product_observed_idx on observations (product_id, observed_at desc);
create index if not exists observations_store_observed_idx on observations (store_id, observed_at desc);
create index if not exists observations_price_type_idx on observations (price_type, observed_at desc);
create index if not exists observations_provenance_gin_idx on observations using gin (provenance);
create index if not exists latest_prices_lookup_idx on latest_prices (product_id, store_id, price_type, observed_at desc);
create index if not exists source_runs_status_started_idx on source_runs (status, started_at desc);
create index if not exists raw_records_payload_gin_idx on raw_records using gin (payload);
create index if not exists watchlists_user_idx on watchlists (user_id);
create index if not exists baskets_user_week_idx on baskets (user_id, week_start desc);
create index if not exists budgets_user_period_idx on budgets (user_id, period, starts_on desc);
create index if not exists alerts_active_user_idx on alerts (active, user_id);
