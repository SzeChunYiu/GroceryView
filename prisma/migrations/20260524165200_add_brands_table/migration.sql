create extension if not exists pgcrypto;

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table products add column if not exists brand_id uuid;
create index if not exists products_brand_id_idx on products(brand_id);

insert into brands (name, slug)
select distinct
  trim(brand) as name,
  regexp_replace(lower(trim(brand)), '[^a-z0-9]+', '-', 'g') as slug
from products
where brand is not null and trim(brand) <> ''
on conflict (slug) do update set name = excluded.name;

update products
set brand_id = brands.id
from brands
where products.brand_id is null
  and products.brand is not null
  and regexp_replace(lower(trim(products.brand)), '[^a-z0-9]+', '-', 'g') = brands.slug;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_brand_id_fkey'
  ) then
    alter table products
      add constraint products_brand_id_fkey
      foreign key (brand_id) references brands(id) on delete set null;
  end if;
end $$;
