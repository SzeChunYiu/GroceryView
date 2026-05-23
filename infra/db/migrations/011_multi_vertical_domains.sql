-- Multi-vertical price-domain foundation.
-- Existing GroceryView rows stay in domain='grocery'. Fuel and pharmacy stay
-- schema-ready but price-empty until connector observations land.

alter table chains add column if not exists domain text not null default 'grocery';
alter table stores add column if not exists domain text not null default 'grocery';
alter table products add column if not exists domain text not null default 'grocery';
alter table observations add column if not exists domain text not null default 'grocery';
alter table latest_prices add column if not exists domain text not null default 'grocery';

update chains set domain = 'grocery' where domain is null;
update stores set domain = 'grocery' where domain is null;
update products set domain = 'grocery' where domain is null;
update observations set domain = 'grocery' where domain is null;
update latest_prices set domain = 'grocery' where domain is null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'chains_price_domain_check') then
    alter table chains add constraint chains_price_domain_check check (domain in ('grocery', 'fuel', 'pharmacy'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'stores_price_domain_check') then
    alter table stores add constraint stores_price_domain_check check (domain in ('grocery', 'fuel', 'pharmacy'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_price_domain_check') then
    alter table products add constraint products_price_domain_check check (domain in ('grocery', 'fuel', 'pharmacy'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'observations_price_domain_check') then
    alter table observations add constraint observations_price_domain_check check (domain in ('grocery', 'fuel', 'pharmacy'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'latest_prices_price_domain_check') then
    alter table latest_prices add constraint latest_prices_price_domain_check check (domain in ('grocery', 'fuel', 'pharmacy'));
  end if;
end $$;

create index if not exists chains_domain_idx on chains (domain, country_code, slug);
create index if not exists stores_domain_idx on stores (domain, country_code, city, slug);
create index if not exists products_domain_idx on products (domain, comparable_unit, slug);
create index if not exists observations_domain_observed_idx on observations (domain, observed_at desc);
create index if not exists latest_prices_domain_idx on latest_prices (domain, observed_at desc);

comment on column chains.domain is 'Price-intelligence vertical: grocery, fuel, or pharmacy. Existing rows default to grocery.';
comment on column stores.domain is 'Price-intelligence vertical inherited from the operator/chain for route scoping and future non-grocery maps.';
comment on column products.domain is 'Price-intelligence vertical for matching: grocery EAN/commodity, fuel grade, or pharmacy OTC EAN.';
comment on column observations.domain is 'Price-intelligence vertical for facts stored in observations; non-grocery claims require matching domain observations.';
comment on column latest_prices.domain is 'Copied price-intelligence vertical for latest price lookups; derived from observations.';
