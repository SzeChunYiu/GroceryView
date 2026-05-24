-- Add brand alias normalization lookup for retailer-normalized brand names.

create table if not exists brand_aliases (
  canonical_brand text not null,
  alias text not null,
  normalized_alias text not null unique,
  created_at timestamptz not null default now(),
  created_by text,
  source text not null default 'seed',
  note text
);

create unique index if not exists brand_aliases_canonical_alias_idx on brand_aliases (canonical_brand, alias);

-- Seed known retailer-brand variants used by ingestion normalization.
insert into brand_aliases(canonical_brand, alias, normalized_alias, source, note)
values
  ('Arla', 'Arla Foods', 'arla foods', 'seed', 'Canonicalized with spaces and case normalized by scraper ingestion.'),
  ('ICA', 'ICA Nära', 'ica nara', 'seed', 'Branch-local ICA brand label normalized to parent brand.'),
  ('ICA', 'ICA Basic', 'ica basic', 'seed', 'ICA private-label naming variant.')
on conflict (normalized_alias) do nothing;
