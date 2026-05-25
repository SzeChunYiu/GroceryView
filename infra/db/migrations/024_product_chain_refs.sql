create table if not exists product_chain_refs (
  id uuid primary key default gen_random_uuid(),
  canonical_product_id uuid not null references products(id) on delete cascade,
  source_product_id uuid references products(id) on delete set null,
  chain_id uuid not null references chains(id) on delete cascade,
  retailer_product_ref text not null,
  ean_code text not null check (ean_code ~ '^[0-9]{8,14}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chain_id, retailer_product_ref)
);

create index if not exists product_chain_refs_canonical_idx on product_chain_refs (canonical_product_id);
create index if not exists product_chain_refs_ean_idx on product_chain_refs (ean_code);
