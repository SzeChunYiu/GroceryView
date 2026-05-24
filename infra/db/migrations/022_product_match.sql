create table if not exists product_match (
  id uuid primary key default gen_random_uuid(),
  canonical_id uuid not null references products(id) on delete cascade,
  listing_id uuid not null references aliases(id) on delete cascade,
  score numeric(5, 4) not null check (score between 0 and 1),
  method text not null check (method in ('ean', 'brand+name', 'fuzzy', 'manual')),
  matched_at timestamptz not null default now()
);

create index if not exists product_match_canonical_idx on product_match(canonical_id, matched_at desc);
create index if not exists product_match_listing_idx on product_match(listing_id, matched_at desc);
create index if not exists product_match_method_idx on product_match(method, matched_at desc);
