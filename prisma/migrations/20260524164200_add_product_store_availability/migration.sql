create table if not exists product_store_availability (
  product_id uuid not null references products(id) on delete cascade,
  store_id text not null,
  is_available boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (product_id, store_id)
);

create index if not exists product_store_availability_store_id_idx
  on product_store_availability (store_id);

create index if not exists product_store_availability_available_seen_idx
  on product_store_availability (is_available, last_seen_at);
