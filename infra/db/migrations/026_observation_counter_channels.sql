-- Separate packaged shelf rows from in-store counter service rows without
-- overloading price_type. Counter meat, deli, and fish prices can coexist with
-- packaged shelf observations for the same product/store/date.

alter table observations
  add column if not exists channel text not null default 'packaged';

alter table latest_prices
  add column if not exists channel text not null default 'packaged';

alter table observations_v2
  add column if not exists channel text not null default 'packaged';

alter table observations
  drop constraint if exists observations_channel_check,
  add constraint observations_channel_check
    check (channel in ('packaged', 'loose', 'pre_packed', 'counter_meat', 'counter_deli', 'counter_fish'));

alter table latest_prices
  drop constraint if exists latest_prices_channel_check,
  add constraint latest_prices_channel_check
    check (channel in ('packaged', 'loose', 'pre_packed', 'counter_meat', 'counter_deli', 'counter_fish'));

alter table observations_v2
  drop constraint if exists observations_v2_channel_check,
  add constraint observations_v2_channel_check
    check (channel in ('packaged', 'loose', 'pre_packed', 'counter_meat', 'counter_deli', 'counter_fish'));

drop index if exists observations_connector_idempotency_idx;
create unique index if not exists observations_connector_idempotency_idx
  on observations (
    product_id,
    chain_id,
    store_id,
    domain,
    retailer_product_ref,
    price_type,
    channel,
    observed_at,
    price,
    unit_price,
    currency,
    is_available,
    confidence,
    provenance
  )
  nulls not distinct;

alter table latest_prices
  drop constraint if exists latest_prices_product_id_chain_id_store_id_price_type_key,
  drop constraint if exists latest_prices_product_id_chain_id_store_id_price_type_channel_key;

alter table latest_prices
  add constraint latest_prices_product_id_chain_id_store_id_price_type_channel_key
    unique nulls not distinct (product_id, chain_id, store_id, price_type, channel);

create index if not exists observations_channel_observed_idx on observations (channel, observed_at desc);
create index if not exists observations_v2_channel_observed_idx on observations_v2 (channel, observed_at desc);
create index if not exists latest_prices_channel_lookup_idx on latest_prices (product_id, store_id, price_type, channel, observed_at desc);

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
    channel,
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
    coalesce(new.channel, 'packaged'),
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
    coalesce(new.is_available, true),
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
    channel = excluded.channel,
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

comment on column observations.channel is 'Physical merchandising/service channel: packaged, loose, pre_packed, counter_meat, counter_deli, or counter_fish.';
comment on column latest_prices.channel is 'Copied from observations.channel so packaged and in-store counter prices can render side-by-side.';
