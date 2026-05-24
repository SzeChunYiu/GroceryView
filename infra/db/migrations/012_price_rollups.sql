-- Price rollups for chart, 52-week-low, and historical range reads.
-- Raw observations remain immutable; these tables are derived summaries.

create table if not exists price_daily (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  chain_id uuid not null references chains(id) on delete cascade,
  store_id uuid references stores(id) on delete cascade,
  domain text not null default 'grocery' check (domain in ('grocery', 'fuel', 'pharmacy')),
  price_type text not null check (price_type in ('shelf', 'online', 'member', 'promotion', 'receipt', 'community', 'counter_meat', 'counter_deli', 'counter_fish', 'estimated')),
  currency char(3) not null default 'SEK',
  bucket_day date not null,
  min_price numeric(12, 2) not null check (min_price >= 0),
  max_price numeric(12, 2) not null check (max_price >= 0),
  avg_price numeric(12, 4) not null check (avg_price >= 0),
  last_price numeric(12, 2) not null check (last_price >= 0),
  min_unit_price numeric(12, 4) not null check (min_unit_price >= 0),
  max_unit_price numeric(12, 4) not null check (max_unit_price >= 0),
  avg_unit_price numeric(12, 4) not null check (avg_unit_price >= 0),
  last_unit_price numeric(12, 4) not null check (last_unit_price >= 0),
  first_observed_at timestamptz not null,
  last_observed_at timestamptz not null,
  observation_count integer not null check (observation_count > 0),
  source_observation_ids uuid[] not null default '{}',
  provenance jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  check (max_price >= min_price),
  check (max_unit_price >= min_unit_price),
  check (last_observed_at >= first_observed_at),
  unique nulls not distinct (product_id, chain_id, store_id, price_type, currency, bucket_day)
);

create table if not exists price_weekly (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  chain_id uuid not null references chains(id) on delete cascade,
  store_id uuid references stores(id) on delete cascade,
  domain text not null default 'grocery' check (domain in ('grocery', 'fuel', 'pharmacy')),
  price_type text not null check (price_type in ('shelf', 'online', 'member', 'promotion', 'receipt', 'community', 'counter_meat', 'counter_deli', 'counter_fish', 'estimated')),
  currency char(3) not null default 'SEK',
  week_start date not null,
  min_price numeric(12, 2) not null check (min_price >= 0),
  max_price numeric(12, 2) not null check (max_price >= 0),
  avg_price numeric(12, 4) not null check (avg_price >= 0),
  last_price numeric(12, 2) not null check (last_price >= 0),
  min_unit_price numeric(12, 4) not null check (min_unit_price >= 0),
  max_unit_price numeric(12, 4) not null check (max_unit_price >= 0),
  avg_unit_price numeric(12, 4) not null check (avg_unit_price >= 0),
  last_unit_price numeric(12, 4) not null check (last_unit_price >= 0),
  first_observed_at timestamptz not null,
  last_observed_at timestamptz not null,
  observation_count integer not null check (observation_count > 0),
  source_observation_ids uuid[] not null default '{}',
  provenance jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  check (max_price >= min_price),
  check (max_unit_price >= min_unit_price),
  check (last_observed_at >= first_observed_at),
  unique nulls not distinct (product_id, chain_id, store_id, price_type, currency, week_start)
);

with daily_rollups as (
  select
    product_id,
    chain_id,
    store_id,
    coalesce(domain, 'grocery') as domain,
    price_type,
    currency,
    observed_at::date as bucket_day,
    min(price) as min_price,
    max(price) as max_price,
    avg(price)::numeric(12, 4) as avg_price,
    (array_agg(price order by observed_at desc, id desc))[1] as last_price,
    min(unit_price) as min_unit_price,
    max(unit_price) as max_unit_price,
    avg(unit_price)::numeric(12, 4) as avg_unit_price,
    (array_agg(unit_price order by observed_at desc, id desc))[1] as last_unit_price,
    min(observed_at) as first_observed_at,
    max(observed_at) as last_observed_at,
    count(*)::integer as observation_count,
    array_agg(id order by observed_at, id) as source_observation_ids,
    jsonb_build_object(
      'rollup', 'price_daily',
      'source', 'observations',
      'generatedByMigration', '012_price_rollups'
    ) as provenance
  from observations
  group by product_id, chain_id, store_id, coalesce(domain, 'grocery'), price_type, currency, observed_at::date
)
insert into price_daily(
  product_id,
  chain_id,
  store_id,
  domain,
  price_type,
  currency,
  bucket_day,
  min_price,
  max_price,
  avg_price,
  last_price,
  min_unit_price,
  max_unit_price,
  avg_unit_price,
  last_unit_price,
  first_observed_at,
  last_observed_at,
  observation_count,
  source_observation_ids,
  provenance
)
select
  product_id,
  chain_id,
  store_id,
  domain,
  price_type,
  currency,
  bucket_day,
  min_price,
  max_price,
  avg_price,
  last_price,
  min_unit_price,
  max_unit_price,
  avg_unit_price,
  last_unit_price,
  first_observed_at,
  last_observed_at,
  observation_count,
  source_observation_ids,
  provenance
from daily_rollups
on conflict (product_id, chain_id, store_id, price_type, currency, bucket_day) do update set
  domain = excluded.domain,
  min_price = excluded.min_price,
  max_price = excluded.max_price,
  avg_price = excluded.avg_price,
  last_price = excluded.last_price,
  min_unit_price = excluded.min_unit_price,
  max_unit_price = excluded.max_unit_price,
  avg_unit_price = excluded.avg_unit_price,
  last_unit_price = excluded.last_unit_price,
  first_observed_at = excluded.first_observed_at,
  last_observed_at = excluded.last_observed_at,
  observation_count = excluded.observation_count,
  source_observation_ids = excluded.source_observation_ids,
  provenance = excluded.provenance,
  updated_at = now();

with weekly_rollups as (
  select
    product_id,
    chain_id,
    store_id,
    coalesce(domain, 'grocery') as domain,
    price_type,
    currency,
    date_trunc('week', observed_at)::date as week_start,
    min(price) as min_price,
    max(price) as max_price,
    avg(price)::numeric(12, 4) as avg_price,
    (array_agg(price order by observed_at desc, id desc))[1] as last_price,
    min(unit_price) as min_unit_price,
    max(unit_price) as max_unit_price,
    avg(unit_price)::numeric(12, 4) as avg_unit_price,
    (array_agg(unit_price order by observed_at desc, id desc))[1] as last_unit_price,
    min(observed_at) as first_observed_at,
    max(observed_at) as last_observed_at,
    count(*)::integer as observation_count,
    array_agg(id order by observed_at, id) as source_observation_ids,
    jsonb_build_object(
      'rollup', 'price_weekly',
      'source', 'observations',
      'generatedByMigration', '012_price_rollups'
    ) as provenance
  from observations
  group by product_id, chain_id, store_id, coalesce(domain, 'grocery'), price_type, currency, date_trunc('week', observed_at)::date
)
insert into price_weekly(
  product_id,
  chain_id,
  store_id,
  domain,
  price_type,
  currency,
  week_start,
  min_price,
  max_price,
  avg_price,
  last_price,
  min_unit_price,
  max_unit_price,
  avg_unit_price,
  last_unit_price,
  first_observed_at,
  last_observed_at,
  observation_count,
  source_observation_ids,
  provenance
)
select
  product_id,
  chain_id,
  store_id,
  domain,
  price_type,
  currency,
  week_start,
  min_price,
  max_price,
  avg_price,
  last_price,
  min_unit_price,
  max_unit_price,
  avg_unit_price,
  last_unit_price,
  first_observed_at,
  last_observed_at,
  observation_count,
  source_observation_ids,
  provenance
from weekly_rollups
on conflict (product_id, chain_id, store_id, price_type, currency, week_start) do update set
  domain = excluded.domain,
  min_price = excluded.min_price,
  max_price = excluded.max_price,
  avg_price = excluded.avg_price,
  last_price = excluded.last_price,
  min_unit_price = excluded.min_unit_price,
  max_unit_price = excluded.max_unit_price,
  avg_unit_price = excluded.avg_unit_price,
  last_unit_price = excluded.last_unit_price,
  first_observed_at = excluded.first_observed_at,
  last_observed_at = excluded.last_observed_at,
  observation_count = excluded.observation_count,
  source_observation_ids = excluded.source_observation_ids,
  provenance = excluded.provenance,
  updated_at = now();

create index if not exists price_daily_product_chain_day_idx on price_daily (product_id, chain_id, bucket_day desc, price_type);
create index if not exists price_daily_store_day_idx on price_daily (store_id, bucket_day desc, price_type) where store_id is not null;
create index if not exists price_daily_domain_day_idx on price_daily (domain, bucket_day desc);
create index if not exists price_weekly_product_chain_week_idx on price_weekly (product_id, chain_id, week_start desc, price_type);
create index if not exists price_weekly_store_week_idx on price_weekly (store_id, week_start desc, price_type) where store_id is not null;
create index if not exists price_weekly_domain_week_idx on price_weekly (domain, week_start desc);

comment on table price_daily is 'Derived daily price rollups for charts, 52-week-low, and historic range reads; raw observations remain authoritative.';
comment on table price_weekly is 'Derived weekly price rollups for long-range charts and market history; raw observations remain authoritative.';
