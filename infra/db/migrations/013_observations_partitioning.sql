-- Partitioned observation tape for high-volume price history.
--
-- The legacy observations table stays the canonical write target so existing
-- latest_prices foreign keys and repository adapters keep working. This
-- migration adds observations_v2 as a range-partitioned mirror that is kept in
-- sync by triggers and can be used by long-range analytics before a future
-- cutover makes the partitioned table canonical.

create table if not exists observations_v2 (
  id uuid not null default gen_random_uuid(),
  product_id uuid not null references products(id) on delete restrict,
  chain_id uuid not null references chains(id) on delete restrict,
  store_id uuid references stores(id) on delete restrict,
  domain text not null default 'grocery' check (domain in ('grocery', 'fuel', 'pharmacy')),
  source_run_id uuid references source_runs(id) on delete set null,
  raw_record_id uuid references raw_records(id) on delete set null,
  retailer_product_ref text,
  price_type text not null check (price_type in ('shelf', 'online', 'member', 'promotion', 'receipt', 'community', 'counter_meat', 'counter_deli', 'counter_fish', 'estimated')),
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
  primary key (id, observed_at),
  check (store_id is not null or price_type = 'online')
) partition by range (observed_at);

create table if not exists observations_default partition of observations_v2 default;

create index if not exists observations_v2_observed_brin_idx on observations_v2 using brin (observed_at);
create index if not exists observations_v2_product_observed_idx on observations_v2 (product_id, observed_at desc);
create index if not exists observations_v2_store_observed_idx on observations_v2 (store_id, observed_at desc) where store_id is not null;
create index if not exists observations_v2_price_type_idx on observations_v2 (price_type, observed_at desc);
create index if not exists observations_v2_domain_observed_idx on observations_v2 (domain, observed_at desc);
create index if not exists observations_v2_provenance_gin_idx on observations_v2 using gin (provenance);

create or replace function ensure_observations_monthly_partition(partition_month date)
returns text
language plpgsql
as $$
declare
  partition_name text;
  partition_start timestamptz;
  partition_end timestamptz;
begin
  partition_month := date_trunc('month', partition_month)::date;
  partition_name := 'observations_' || to_char(partition_month, 'YYYY_MM');
  partition_start := partition_month::timestamptz;
  partition_end := (partition_month + interval '1 month')::timestamptz;

  execute format(
    'create table if not exists %I partition of observations_v2 for values from (%L) to (%L)',
    partition_name,
    partition_start,
    partition_end
  );
  execute format('create index if not exists %I on %I using brin (observed_at)', partition_name || '_observed_brin_idx', partition_name);
  execute format('create index if not exists %I on %I (product_id, observed_at desc)', partition_name || '_product_observed_idx', partition_name);
  execute format('create index if not exists %I on %I (store_id, observed_at desc) where store_id is not null', partition_name || '_store_observed_idx', partition_name);
  execute format('create index if not exists %I on %I (price_type, observed_at desc)', partition_name || '_price_type_idx', partition_name);
  execute format('create index if not exists %I on %I (domain, observed_at desc)', partition_name || '_domain_observed_idx', partition_name);
  execute format('create index if not exists %I on %I using gin (provenance)', partition_name || '_provenance_gin_idx', partition_name);

  return partition_name;
end;
$$;

create or replace function create_observations_partitions(window_start date, months_ahead integer)
returns text[]
language plpgsql
as $$
declare
  created_partitions text[] := array[]::text[];
  month_offset integer;
  normalized_start date := date_trunc('month', window_start)::date;
  months_to_create integer := greatest(coalesce(months_ahead, 0), 0);
begin
  for month_offset in 0..months_to_create loop
    created_partitions := array_append(
      created_partitions,
      ensure_observations_monthly_partition((normalized_start + (month_offset || ' months')::interval)::date)
    );
  end loop;

  return created_partitions;
end;
$$;

create or replace function drop_observations_partitions_before(cutoff_month date)
returns text[]
language plpgsql
as $$
declare
  partition_table record;
  partition_month date;
  normalized_cutoff date := date_trunc('month', cutoff_month)::date;
  dropped_partitions text[] := array[]::text[];
begin
  for partition_table in
    select child.relname
    from pg_inherits inherit
    join pg_class child on child.oid = inherit.inhrelid
    join pg_class parent on parent.oid = inherit.inhparent
    join pg_namespace namespace on namespace.oid = child.relnamespace
    where parent.relname = 'observations_v2'
      and namespace.nspname = 'public'
      and child.relname ~ '^observations_[0-9]{4}_[0-9]{2}$'
  loop
    partition_month := to_date(substring(partition_table.relname from 'observations_([0-9]{4}_[0-9]{2})'), 'YYYY_MM');
    if partition_month < normalized_cutoff then
      execute format('drop table if exists %I', partition_table.relname);
      dropped_partitions := array_append(dropped_partitions, partition_table.relname);
    end if;
  end loop;

  return dropped_partitions;
end;
$$;

create or replace function mirror_observations_to_v2()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    delete from observations_v2
    where id = old.id
      and observed_at = old.observed_at;
    return old;
  end if;

  if tg_op = 'UPDATE' and old.observed_at is distinct from new.observed_at then
    delete from observations_v2
    where id = old.id
      and observed_at = old.observed_at;
  end if;

  perform ensure_observations_monthly_partition(date_trunc('month', new.observed_at)::date);

  insert into observations_v2(
    id,
    product_id,
    chain_id,
    store_id,
    domain,
    source_run_id,
    raw_record_id,
    retailer_product_ref,
    price_type,
    price,
    regular_price,
    unit_price,
    currency,
    quantity,
    quantity_unit,
    promotion_text,
    promotion_starts_on,
    promotion_ends_on,
    member_required,
    observed_at,
    valid_from,
    valid_until,
    confidence,
    provenance,
    created_at
  )
  values (
    new.id,
    new.product_id,
    new.chain_id,
    new.store_id,
    coalesce(new.domain, 'grocery'),
    new.source_run_id,
    new.raw_record_id,
    new.retailer_product_ref,
    new.price_type,
    new.price,
    new.regular_price,
    new.unit_price,
    new.currency,
    new.quantity,
    new.quantity_unit,
    new.promotion_text,
    new.promotion_starts_on,
    new.promotion_ends_on,
    new.member_required,
    new.observed_at,
    new.valid_from,
    new.valid_until,
    new.confidence,
    new.provenance,
    new.created_at
  )
  on conflict (id, observed_at) do update set
    product_id = excluded.product_id,
    chain_id = excluded.chain_id,
    store_id = excluded.store_id,
    domain = excluded.domain,
    source_run_id = excluded.source_run_id,
    raw_record_id = excluded.raw_record_id,
    retailer_product_ref = excluded.retailer_product_ref,
    price_type = excluded.price_type,
    price = excluded.price,
    regular_price = excluded.regular_price,
    unit_price = excluded.unit_price,
    currency = excluded.currency,
    quantity = excluded.quantity,
    quantity_unit = excluded.quantity_unit,
    promotion_text = excluded.promotion_text,
    promotion_starts_on = excluded.promotion_starts_on,
    promotion_ends_on = excluded.promotion_ends_on,
    member_required = excluded.member_required,
    valid_from = excluded.valid_from,
    valid_until = excluded.valid_until,
    confidence = excluded.confidence,
    provenance = excluded.provenance,
    created_at = excluded.created_at;

  return new;
end;
$$;

select create_observations_partitions((date_trunc('month', now()) - interval '1 month')::date, 14);

insert into observations_v2(
  id,
  product_id,
  chain_id,
  store_id,
  domain,
  source_run_id,
  raw_record_id,
  retailer_product_ref,
  price_type,
  price,
  regular_price,
  unit_price,
  currency,
  quantity,
  quantity_unit,
  promotion_text,
  promotion_starts_on,
  promotion_ends_on,
  member_required,
  observed_at,
  valid_from,
  valid_until,
  confidence,
  provenance,
  created_at
)
select
  id,
  product_id,
  chain_id,
  store_id,
  coalesce(domain, 'grocery'),
  source_run_id,
  raw_record_id,
  retailer_product_ref,
  price_type,
  price,
  regular_price,
  unit_price,
  currency,
  quantity,
  quantity_unit,
  promotion_text,
  promotion_starts_on,
  promotion_ends_on,
  member_required,
  observed_at,
  valid_from,
  valid_until,
  confidence,
  provenance,
  created_at
from observations
on conflict (id, observed_at) do update set
  product_id = excluded.product_id,
  chain_id = excluded.chain_id,
  store_id = excluded.store_id,
  domain = excluded.domain,
  source_run_id = excluded.source_run_id,
  raw_record_id = excluded.raw_record_id,
  retailer_product_ref = excluded.retailer_product_ref,
  price_type = excluded.price_type,
  price = excluded.price,
  regular_price = excluded.regular_price,
  unit_price = excluded.unit_price,
  currency = excluded.currency,
  quantity = excluded.quantity,
  quantity_unit = excluded.quantity_unit,
  promotion_text = excluded.promotion_text,
  promotion_starts_on = excluded.promotion_starts_on,
  promotion_ends_on = excluded.promotion_ends_on,
  member_required = excluded.member_required,
  valid_from = excluded.valid_from,
  valid_until = excluded.valid_until,
  confidence = excluded.confidence,
  provenance = excluded.provenance,
  created_at = excluded.created_at;

drop trigger if exists observations_partition_lane_sync on observations;
create trigger observations_partition_lane_sync
after insert or update or delete on observations
for each row execute function mirror_observations_to_v2();

comment on table observations_v2 is 'Range-partitioned monthly mirror of immutable observations for high-volume time-series reads and retention.';
comment on table observations_default is 'Fallback partition for observations_v2 rows outside pre-created monthly ranges; operators should drain by creating the matching monthly partition.';
comment on function ensure_observations_monthly_partition(date) is 'Creates one observations_v2 monthly range partition plus BRIN, lookup, and provenance indexes.';
comment on function create_observations_partitions(date, integer) is 'Pre-creates a window of observations_v2 monthly partitions for daily ingestion.';
comment on function drop_observations_partitions_before(date) is 'Drops old observations_v2 monthly partitions before the cutoff month for retention tiering.';
