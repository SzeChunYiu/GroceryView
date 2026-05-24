create table if not exists price_changes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  store_id text not null,
  old_price numeric(10, 2) not null,
  new_price numeric(10, 2) not null,
  changed_at timestamptz not null default now()
);

create index if not exists price_changes_product_store_changed_at_idx
  on price_changes(product_id, store_id, changed_at desc);
