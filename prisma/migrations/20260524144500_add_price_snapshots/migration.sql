create table if not exists price_snapshots (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  store_id text not null,
  price numeric(10, 2) not null,
  unit_price numeric(10, 2),
  currency text not null default 'SEK',
  is_on_sale boolean not null default false,
  scraped_at timestamp(3) not null,
  created_at timestamp(3) not null default current_timestamp
);

create index if not exists price_snapshots_product_id_scraped_at_idx on price_snapshots(product_id, scraped_at);
create index if not exists price_snapshots_store_id_scraped_at_idx on price_snapshots(store_id, scraped_at);
