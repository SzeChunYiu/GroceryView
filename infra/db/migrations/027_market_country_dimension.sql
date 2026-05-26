-- Add first-class market/country scoping while keeping existing domain/retailer_type columns.
-- Existing production rows are Swedish and are backfilled as SE without changing source facts.

create table if not exists markets (
  code char(2) primary key check (code ~ '^[A-Z]{2}$'),
  name text not null,
  default_currency char(3) not null,
  default_domain text not null default 'grocery',
  created_at timestamptz not null default now()
);

insert into markets(code, name, default_currency, default_domain) values
  ('SE', 'Sweden', 'SEK', 'grocery'),
  ('NO', 'Norway', 'NOK', 'grocery'),
  ('IS', 'Iceland', 'ISK', 'grocery')
on conflict (code) do update set
  name = excluded.name,
  default_currency = excluded.default_currency,
  default_domain = excluded.default_domain;

alter table chains add column if not exists market_code char(2);
update chains set market_code = upper(coalesce(nullif(country_code, ''), 'SE')) where market_code is null;
alter table chains alter column market_code set default 'SE';
alter table chains alter column market_code set not null;
alter table chains add constraint chains_market_code_fk foreign key (market_code) references markets(code) not valid;

alter table stores add column if not exists market_code char(2);
update stores set market_code = upper(coalesce(nullif(country_code, ''), 'SE')) where market_code is null;
alter table stores alter column market_code set default 'SE';
alter table stores alter column market_code set not null;
alter table stores add constraint stores_market_code_fk foreign key (market_code) references markets(code) not valid;

alter table products add column if not exists market_code char(2);
update products set market_code = 'SE' where market_code is null;
alter table products alter column market_code set default 'SE';
alter table products alter column market_code set not null;
alter table products add constraint products_market_code_fk foreign key (market_code) references markets(code) not valid;

alter table observations add column if not exists market_code char(2);
update observations
set market_code = coalesce(
  (select stores.market_code from stores where stores.id = observations.store_id),
  (select chains.market_code from chains where chains.id = observations.chain_id),
  'SE'
)
where market_code is null;
alter table observations alter column market_code set default 'SE';
alter table observations alter column market_code set not null;
alter table observations add constraint observations_market_code_fk foreign key (market_code) references markets(code) not valid;

alter table latest_prices add column if not exists market_code char(2);
update latest_prices
set market_code = coalesce(
  (select stores.market_code from stores where stores.id = latest_prices.store_id),
  (select chains.market_code from chains where chains.id = latest_prices.chain_id),
  'SE'
)
where market_code is null;
alter table latest_prices alter column market_code set default 'SE';
alter table latest_prices alter column market_code set not null;
alter table latest_prices add constraint latest_prices_market_code_fk foreign key (market_code) references markets(code) not valid;

create index if not exists chains_market_domain_idx on chains (market_code, retailer_type, slug);
create index if not exists stores_market_domain_idx on stores (market_code, store_type, city, slug);
create index if not exists products_market_category_idx on products (market_code, category_path);
create index if not exists observations_market_observed_idx on observations (market_code, observed_at desc);
create index if not exists latest_prices_market_chain_idx on latest_prices (market_code, chain_id, product_id);
