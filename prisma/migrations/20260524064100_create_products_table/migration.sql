create table if not exists products (
  id uuid primary key,
  slug text unique,
  canonical_name text,
  name text not null,
  brand text,
  ean text unique,
  category_id text,
  category_path text[] not null default '{}',
  comparable_unit text not null default 'st',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table products add column if not exists name text;
alter table products add column if not exists ean text;
alter table products add column if not exists category_id text;

create index if not exists products_category_id_idx on products(category_id);
