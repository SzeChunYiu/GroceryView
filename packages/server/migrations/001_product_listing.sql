create table if not exists product_listing (
  id uuid primary key default gen_random_uuid(),
  chain text not null,
  chain_sku_id text not null,
  canonical_id uuid references products(id) on delete set null,
  name text not null,
  brand text,
  weight_grams numeric,
  volume_ml numeric,
  unit_count integer,
  image_url text,
  source_url text,
  last_seen_at timestamptz not null,
  unique (chain, chain_sku_id),
  check (chain <> ''),
  check (chain_sku_id <> ''),
  check (weight_grams is null or weight_grams > 0),
  check (volume_ml is null or volume_ml > 0),
  check (unit_count is null or unit_count > 0)
);

create index if not exists product_listing_canonical_id_idx on product_listing (canonical_id);
create index if not exists product_listing_last_seen_at_idx on product_listing (last_seen_at desc);
