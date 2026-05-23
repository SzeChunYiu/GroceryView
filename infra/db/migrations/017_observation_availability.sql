-- Track source-provided stock availability on immutable observations and latest-price snapshots.
-- Existing rows default to available so historical prices stay visible until connectors prove otherwise.

alter table observations add column if not exists is_available boolean not null default true;
alter table latest_prices add column if not exists is_available boolean not null default true;
alter table observations_v2 add column if not exists is_available boolean not null default true;

update latest_prices
set is_available = observations.is_available
from observations
where observations.id = latest_prices.observation_id
  and latest_prices.is_available is distinct from observations.is_available;

update observations_v2
set is_available = observations.is_available
from observations
where observations.id = observations_v2.id
  and observations.observed_at = observations_v2.observed_at
  and observations_v2.is_available is distinct from observations.is_available;

drop index if exists observations_connector_idempotency_idx;
create unique index if not exists observations_connector_idempotency_idx
  on observations (
    product_id,
    chain_id,
    store_id,
    domain,
    retailer_product_ref,
    price_type,
    observed_at,
    price,
    unit_price,
    currency,
    is_available,
    confidence,
    provenance
  )
  nulls not distinct;

drop index concurrently if exists latest_prices_grocery_snapshot_idx;
create index concurrently if not exists latest_prices_grocery_snapshot_idx
  on latest_prices (domain, observed_at desc, product_id, chain_id, store_id, price_type)
  include (observation_id, price, regular_price, unit_price, currency, is_available, confidence, provenance)
  where domain = 'grocery';

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
    is_available,
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
    new.is_available,
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
    is_available = excluded.is_available,
    valid_from = excluded.valid_from,
    valid_until = excluded.valid_until,
    confidence = excluded.confidence,
    provenance = excluded.provenance,
    created_at = excluded.created_at;

  return new;
end;
$$;

comment on column observations.is_available is 'False when connector evidence shows the product is out of stock, not found, or returned an empty stock response; defaults true for historical rows.';
comment on column latest_prices.is_available is 'Copied availability from the winning observation so product cards can show Out of stock without joining history.';
comment on column observations_v2.is_available is 'Partitioned mirror of observations.is_available for long-range stock availability history.';
