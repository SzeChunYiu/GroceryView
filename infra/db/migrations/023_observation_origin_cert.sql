-- Observation-level product origin and certification evidence.
--
-- `origin_country` is where the product was grown or raised, not the market
-- where it was sold. `cert_level` stores explicit source certification labels.

alter table observations add column if not exists origin_country char(2) check (origin_country is null or origin_country ~ '^[A-Z]{2}$');
alter table observations add column if not exists cert_level text check (
  cert_level is null or cert_level in (
    'krav',
    'eu_eco',
    'free_range',
    'asc',
    'msc',
    'rainforest_alliance',
    'fairtrade',
    'conventional'
  )
);

alter table observations_v2 add column if not exists origin_country char(2) check (origin_country is null or origin_country ~ '^[A-Z]{2}$');
alter table observations_v2 add column if not exists cert_level text check (
  cert_level is null or cert_level in (
    'krav',
    'eu_eco',
    'free_range',
    'asc',
    'msc',
    'rainforest_alliance',
    'fairtrade',
    'conventional'
  )
);

update observations_v2
set origin_country = observations.origin_country,
    cert_level = observations.cert_level
from observations
where observations.id = observations_v2.id
  and observations.observed_at = observations_v2.observed_at
  and (
    observations_v2.origin_country is distinct from observations.origin_country
    or observations_v2.cert_level is distinct from observations.cert_level
  );

create index if not exists observations_origin_cert_idx on observations (origin_country, cert_level);
create index if not exists observations_v2_origin_cert_idx on observations_v2 (origin_country, cert_level);

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
    origin_country,
    cert_level,
    confidence,
    provenance
  )
  nulls not distinct;

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
    origin_country,
    cert_level,
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
    new.origin_country,
    new.cert_level,
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
    origin_country = excluded.origin_country,
    cert_level = excluded.cert_level,
    valid_from = excluded.valid_from,
    valid_until = excluded.valid_until,
    confidence = excluded.confidence,
    provenance = excluded.provenance,
    created_at = excluded.created_at;

  return new;
end;
$$;

comment on column observations.origin_country is 'ISO-3166 alpha-2 country where the product was grown or raised, not where it was sold.';
comment on column observations.cert_level is 'Explicit source certification label: krav, eu_eco, free_range, asc, msc, rainforest_alliance, fairtrade, or conventional.';
comment on index observations_origin_cert_idx is 'Lookup index for observation-level origin and certification filters.';
