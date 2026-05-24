-- Add recipe tags and ingredient assignments for recipe-based shopping lists.

create table if not exists recipe_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists recipe_tag_items (
  id uuid primary key default gen_random_uuid(),
  recipe_tag_id uuid not null references recipe_tags(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  ingredient_name text not null,
  amount_hint text,
  sort_order integer not null default 10,
  created_at timestamptz not null default now(),
  unique (recipe_tag_id, product_id, ingredient_name)
);

create index if not exists recipe_tag_items_tag_idx on recipe_tag_items (recipe_tag_id);
create index if not exists recipe_tag_items_product_idx on recipe_tag_items (product_id);
create unique index if not exists recipe_tags_name_uq_idx on recipe_tags (lower(name));
