-- Canonical products represent one real-world product independent of retailer listings.
create table if not exists product_canonical (
  id uuid primary key default gen_random_uuid(),
  ean text,
  brand text not null,
  name text not null,
  weight_grams numeric(12, 3) check (weight_grams is null or weight_grams > 0),
  volume_ml numeric(12, 3) check (volume_ml is null or volume_ml > 0),
  unit_count integer check (unit_count is null or unit_count > 0),
  category_id uuid references categories(id) on delete set null,
  country char(2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ean is null or length(regexp_replace(ean, '\\D', '', 'g')) between 8 and 14)
);

create unique index if not exists product_canonical_ean_country_uidx
  on product_canonical (ean, country)
  where ean is not null and btrim(ean) <> '';

create index if not exists product_canonical_brand_name_idx
  on product_canonical (lower(brand), lower(name));

create index if not exists product_canonical_soft_match_idx
  on product_canonical (country, lower(brand), lower(name), weight_grams, volume_ml, unit_count)
  where ean is null or btrim(ean) = '';
