create table if not exists shopping_lists (
  id uuid primary key,
  user_id text not null,
  name text not null,
  created_at timestamptz not null default current_timestamp
);

create table if not exists list_items (
  id uuid primary key,
  list_id uuid not null references shopping_lists(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  quantity integer not null default 1,
  checked boolean not null default false,
  note text
);

create index if not exists shopping_lists_user_id_idx on shopping_lists(user_id);
create index if not exists list_items_list_id_idx on list_items(list_id);
create index if not exists list_items_product_id_idx on list_items(product_id);
