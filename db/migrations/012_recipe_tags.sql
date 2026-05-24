-- Recipe tag taxonomy for recipe-based shopping lists.
-- Keep this migration aligned with db/schema.sql and keep product linking text-based in the legacy schema.

create table if not exists recipe_tags (
  id bigserial primary key,
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists recipe_tags_name_uq_idx on recipe_tags (lower(name));

create table if not exists recipe_tag_items (
  id bigserial primary key,
  recipe_tag_id bigint not null references recipe_tags(id) on delete cascade,
  product_id text not null references products(id),
  ingredient_name text not null,
  amount_hint text,
  sort_order integer not null default 10,
  created_at timestamptz not null default now(),
  unique (recipe_tag_id, product_id, ingredient_name)
);

create index if not exists recipe_tag_items_tag_idx on recipe_tag_items (recipe_tag_id);
create index if not exists recipe_tag_items_product_idx on recipe_tag_items (product_id);
