-- 010: commodity taxonomy for unbranded / loose products.
--
-- Meat, vegetables, fruit, bakery, bulk and deli items have NO EAN/barcode and are
-- sold by weight, so the barcode-based cross-chain matching used for packaged goods
-- does not apply. Instead we map each chain's loose item to a canonical "commodity"
-- and compare on unit_price (kr/kg, kr/l, kr/st) — which already exists on
-- observations/latest_prices. Branded goods keep matching by `products.barcode`;
-- commodities match by `products.commodity_id` (+ optional variant/grade).
--
-- Confidence stays honest: barcode match = high; commodity/alias match = medium and
-- is labelled in the UI via the existing observations.confidence + aliases tables.

create table if not exists commodities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9.-]*$'),
  name_sv text not null,
  name_en text not null,
  category_path text[] not null default '{}',
  -- canonical comparison unit for this commodity
  comparable_unit text not null check (comparable_unit in ('kg', 'l', 'st')),
  -- optional default variant/grade axis, e.g. 'mince-10', 'vine', 'class-1'
  default_variant text,
  -- part of the representative staples basket used for the chain "fresh-food index"
  is_staple boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Classify products and link loose items to their canonical commodity.
alter table products
  add column if not exists product_kind text not null default 'branded'
    check (product_kind in ('branded', 'commodity')),
  add column if not exists commodity_id uuid references commodities(id) on delete set null,
  add column if not exists variant text,            -- cut/grade/type within the commodity
  add column if not exists is_organic boolean not null default false,
  add column if not exists origin_country char(2);  -- ISO-3166 country of origin, when known

-- Cross-chain commodity matching + staples-basket index lookups.
create index if not exists products_commodity_idx on products (commodity_id, variant);
create index if not exists products_kind_idx on products (product_kind);
create index if not exists commodities_staple_idx on commodities (is_staple) where is_staple;
create index if not exists commodities_category_gin_idx on commodities using gin (category_path);
