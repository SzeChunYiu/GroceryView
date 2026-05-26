-- Append-only observed prices emitted by crawler/source runs.
-- One row represents one observation event; corrections are inserted as new rows.

create table if not exists price_observation (
  id bigserial primary key,
  listing_id uuid not null references product_listing(id) on delete restrict,
  store_id uuid references store(id) on delete restrict,
  price_amount numeric not null,
  currency char(3) not null,
  country char(2) not null,
  unit text not null,
  is_list_price boolean not null default false,
  observed_at timestamptz not null,
  source_run_id uuid references source_runs(id) on delete set null,
  source_url text,
  check (price_amount >= 0),
  check (currency ~ '^[A-Z]{3}$'),
  check (country ~ '^[A-Z]{2}$'),
  check (unit <> '')
);

create index if not exists price_observation_listing_observed_idx on price_observation (listing_id, observed_at desc);
create index if not exists price_observation_store_observed_idx on price_observation (store_id, observed_at desc) where store_id is not null;
create index if not exists price_observation_country_observed_idx on price_observation (country, observed_at desc);
create index if not exists price_observation_source_run_idx on price_observation (source_run_id) where source_run_id is not null;

create or replace function prevent_price_observation_update()
returns trigger language plpgsql as $$
begin
  raise exception 'price_observation is append-only; insert a new observation instead of updating id=%', old.id;
end;
$$;

drop trigger if exists price_observation_no_update on price_observation;
create trigger price_observation_no_update
before update on price_observation
for each row execute function prevent_price_observation_update();

do $$
begin
  if to_regprocedure('create_hypertable(regclass,name)') is not null then
    perform create_hypertable('price_observation'::regclass, 'observed_at', if_not_exists => true);
  end if;
end;
$$;
