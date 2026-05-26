-- Audit trail of matches between canonical products and retailer listings.
-- Multiple rows per pair are allowed over time so matching can be re-run safely.

create table if not exists product_match (
  canonical_id uuid not null references products(id) on delete cascade,
  listing_id uuid not null references product_listing(id) on delete cascade,
  score numeric not null,
  method text not null check (method in ('ean', 'brand+name', 'fuzzy', 'manual')),
  matched_at timestamptz not null default now(),
  primary key (canonical_id, listing_id, method, matched_at),
  check (score >= 0 and score <= 1)
);

create index if not exists product_match_listing_idx on product_match (listing_id, matched_at desc);
create index if not exists product_match_canonical_idx on product_match (canonical_id, matched_at desc);
create index if not exists product_match_method_score_idx on product_match (method, score desc);
