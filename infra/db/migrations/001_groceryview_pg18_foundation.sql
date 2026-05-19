-- GroceryView infrastructure schema for PostgreSQL 18 with PostGIS and pg_trgm.
-- Price facts are immutable observations; latest_prices is only a derived read model.

create extension if not exists postgis;
create extension if not exists pg_trgm;

create table if not exists chains (
  id text primary key,
  name text not null,
  country_code char(2) not null default 'SE',
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists stores (
  id text primary key,
  chain_id text not null references chains(id),
  name text not null,
  address text not null,
  city text not null,
  region text,
  country_code char(2) not null default 'SE',
  location geography(point, 4326),
  opening_hours jsonb not null default '{}'::jsonb,
  retailer_store_id text,
  is_online boolean not null default false,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chain_id, retailer_store_id)
);

create table if not exists products (
  id text primary key,
  barcode text,
  canonical_name text not null,
  brand text,
  category text,
  package_size numeric(12, 3),
  package_unit text,
  comparable_unit text not null,
  image_url text,
  attributes jsonb not null default '{}'::jsonb,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists aliases (
  id bigserial primary key,
  product_id text references products(id) on delete cascade,
  alias text not null,
  alias_type text not null check (alias_type in ('barcode', 'retailer_name', 'search_name', 'receipt_name')),
  source_type text not null,
  confidence numeric(5, 4) not null check (confidence between 0 and 1),
  observed_at timestamptz not null default now(),
  provenance jsonb not null default '{}'::jsonb,
  unique (alias_type, alias, source_type)
);

create table if not exists users (
  id text primary key,
  email text unique,
  display_name text,
  preferred_currency char(3) not null default 'SEK',
  locale text not null default 'sv-SE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists watchlists (
  id bigserial primary key,
  user_id text not null references users(id) on delete cascade,
  product_id text references products(id) on delete cascade,
  query text,
  target_price numeric(12, 2),
  price_type text check (price_type in ('shelf', 'promotion', 'member', 'online', 'estimated', 'crowd_reported')),
  created_at timestamptz not null default now(),
  check (product_id is not null or query is not null)
);

create table if not exists budgets (
  id bigserial primary key,
  user_id text not null references users(id) on delete cascade,
  period text not null check (period in ('weekly', 'monthly')),
  amount numeric(12, 2) not null check (amount >= 0),
  currency char(3) not null default 'SEK',
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now(),
  check (starts_on <= ends_on)
);

create table if not exists baskets (
  id bigserial primary key,
  user_id text not null references users(id) on delete cascade,
  name text not null,
  budget_id bigint references budgets(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists basket_items (
  id bigserial primary key,
  basket_id bigint not null references baskets(id) on delete cascade,
  product_id text references products(id),
  raw_name text,
  quantity numeric(12, 3) not null default 1,
  unit text,
  created_at timestamptz not null default now(),
  check (product_id is not null or raw_name is not null)
);

create table if not exists source_runs (
  id text primary key,
  source_type text not null,
  source_name text not null,
  started_at timestamptz not null,
  finished_at timestamptz,
  status text not null check (status in ('running', 'succeeded', 'failed')),
  fetched_record_count integer not null default 0 check (fetched_record_count >= 0),
  provenance jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists raw_records (
  id bigserial primary key,
  source_run_id text not null references source_runs(id) on delete cascade,
  source_type text not null,
  source_record_id text,
  fetched_at timestamptz not null,
  payload jsonb not null,
  payload_hash text not null,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_type, payload_hash)
);

create table if not exists observations (
  id bigserial primary key,
  product_id text not null references products(id),
  store_id text references stores(id),
  chain_id text not null references chains(id),
  source_run_id text references source_runs(id),
  raw_record_id bigint references raw_records(id),
  observed_at timestamptz not null,
  price numeric(12, 2) not null check (price >= 0),
  unit_price numeric(12, 4) check (unit_price >= 0),
  currency char(3) not null default 'SEK',
  price_type text not null check (price_type in ('shelf', 'promotion', 'member', 'online', 'estimated', 'crowd_reported')),
  regular_price numeric(12, 2) check (regular_price is null or regular_price >= 0),
  promotion_label text,
  member_only boolean not null default false,
  confidence numeric(5, 4) not null check (confidence between 0 and 1),
  source_type text not null,
  source_url text,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists latest_prices (
  id bigserial primary key,
  product_id text not null references products(id),
  store_id text references stores(id),
  chain_id text not null references chains(id),
  observation_id bigint not null references observations(id),
  observed_at timestamptz not null,
  price numeric(12, 2) not null check (price >= 0),
  unit_price numeric(12, 4) check (unit_price >= 0),
  currency char(3) not null default 'SEK',
  price_type text not null check (price_type in ('shelf', 'promotion', 'member', 'online', 'estimated', 'crowd_reported')),
  confidence numeric(5, 4) not null check (confidence between 0 and 1),
  source_type text not null,
  provenance jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace view price_observations as
  select * from observations;

create table if not exists alerts (
  id bigserial primary key,
  user_id text not null references users(id) on delete cascade,
  product_id text references products(id) on delete cascade,
  watchlist_id bigint references watchlists(id) on delete cascade,
  alert_type text not null check (alert_type in ('target_price', 'promotion', 'back_in_stock', 'budget_risk')),
  threshold_price numeric(12, 2) check (threshold_price is null or threshold_price >= 0),
  price_type text check (price_type in ('shelf', 'promotion', 'member', 'online', 'estimated', 'crowd_reported')),
  channel text not null default 'push' check (channel in ('push', 'email')),
  active boolean not null default true,
  last_triggered_at timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stores_location_gix on stores using gist (location);
create index if not exists products_canonical_name_trgm_idx on products using gin (canonical_name gin_trgm_ops);
create index if not exists aliases_alias_trgm_idx on aliases using gin (alias gin_trgm_ops);
create index if not exists observations_product_time_idx on observations (product_id, observed_at desc);
create index if not exists observations_store_time_idx on observations (store_id, observed_at desc);
create index if not exists latest_prices_product_idx on latest_prices (product_id, observed_at desc);
create unique index if not exists latest_prices_identity_idx on latest_prices nulls not distinct (product_id, chain_id, price_type, store_id);
create index if not exists source_runs_status_started_idx on source_runs (status, started_at desc);
create index if not exists raw_records_source_run_idx on raw_records (source_run_id);
create index if not exists alerts_user_active_idx on alerts (user_id, active);
