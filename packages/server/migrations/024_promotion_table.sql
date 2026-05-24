-- Promotion rows are stored separately from price observations so stacked offers can be
-- validated and promoted without corrupting base listing prices.
create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references observations(id) on delete cascade,
  store_id uuid references stores(id) on delete set null,
  kind text not null check (kind in (
    'member',
    'multi_buy',
    'x_for_y',
    'percent_off',
    'bundle',
    'threshold',
    'bogo',
    'loyalty_points',
    'surplus',
    'coupon',
    'flyer'
  )),
  terms jsonb not null default '{}'::jsonb,
  list_price numeric(12, 2) check (list_price is null or list_price >= 0),
  effective_unit_price numeric(12, 4) not null check (effective_unit_price >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  observed_at timestamptz not null,
  source_run_id uuid references source_runs(id) on delete set null,
  source_url text,
  country char(2) not null,
  currency char(3) not null,
  created_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create index if not exists promotions_listing_idx on promotions (listing_id, observed_at desc);
create index if not exists promotions_store_idx on promotions (store_id, observed_at desc) where store_id is not null;
create index if not exists promotions_kind_country_idx on promotions (kind, country, observed_at desc);
create index if not exists promotions_source_run_idx on promotions (source_run_id) where source_run_id is not null;

create table if not exists promotions_staging (like promotions including defaults including constraints including indexes);
