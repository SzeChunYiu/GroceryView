-- Append-only price observations. Prefer TimescaleDB hypertables when the
-- extension is installed; otherwise create a monthly range-partitioned table.
do $$
begin
  if exists (
    select 1 from pg_extension where extname = 'timescaledb'
  ) then
    execute $sql$
      create table if not exists price_observations (
        id bigserial primary key,
        listing_id bigint not null,
        store_id bigint,
        price_amount numeric not null check (price_amount >= 0),
        currency char(3) not null,
        country char(2) not null,
        unit text not null,
        is_list_price boolean not null,
        observed_at timestamptz not null,
        source_run_id bigint not null,
        source_url text
      )
    $sql$;
    execute $sql$select create_hypertable('price_observations', 'observed_at', if_not_exists => true)$sql$;
  else
    execute $sql$
      create table if not exists price_observations (
        id bigserial not null,
        listing_id bigint not null,
        store_id bigint,
        price_amount numeric not null check (price_amount >= 0),
        currency char(3) not null,
        country char(2) not null,
        unit text not null,
        is_list_price boolean not null,
        observed_at timestamptz not null,
        source_run_id bigint not null,
        source_url text,
        primary key (id, observed_at)
      ) partition by range (observed_at)
    $sql$;
    execute $sql$
      create table if not exists price_observations_default
      partition of price_observations default
    $sql$;
  end if;
end $$;

create index if not exists price_observations_listing_observed_at_idx
  on price_observations (listing_id, observed_at desc);
create index if not exists price_observations_store_observed_at_idx
  on price_observations (store_id, observed_at desc);
create index if not exists price_observations_source_run_id_idx
  on price_observations (source_run_id);

do $$
begin
  if to_regclass('public.listings') is not null and not exists (
    select 1 from pg_constraint where conname = 'price_observations_listing_id_fkey'
  ) then
    alter table price_observations
      add constraint price_observations_listing_id_fkey
      foreign key (listing_id) references listings(id);
  end if;

  if to_regclass('public.stores') is not null and not exists (
    select 1 from pg_constraint where conname = 'price_observations_store_id_fkey'
  ) then
    alter table price_observations
      add constraint price_observations_store_id_fkey
      foreign key (store_id) references stores(id);
  end if;

  if to_regclass('public.source_runs') is not null and not exists (
    select 1 from pg_constraint where conname = 'price_observations_source_run_id_fkey'
  ) then
    alter table price_observations
      add constraint price_observations_source_run_id_fkey
      foreign key (source_run_id) references source_runs(id);
  end if;
end $$;

create or replace function prevent_price_observations_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'price_observations is append-only';
end;
$$;

drop trigger if exists price_observations_prevent_update on price_observations;
create trigger price_observations_prevent_update
  before update on price_observations
  for each row execute function prevent_price_observations_mutation();

drop trigger if exists price_observations_prevent_delete on price_observations;
create trigger price_observations_prevent_delete
  before delete on price_observations
  for each row execute function prevent_price_observations_mutation();
