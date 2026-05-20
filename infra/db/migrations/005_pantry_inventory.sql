-- Persist user pantry inventory for replenishment planning and low-stock suggestions.

create table if not exists pantry_items (
  id text primary key,
  user_id text not null references app_users(id) on delete cascade,
  product_id text not null,
  name text not null,
  category text not null check (category in ('protein', 'pantry', 'vegetables', 'dairy', 'fruit', 'other')),
  quantity numeric(12, 3) not null check (quantity >= 0),
  unit text not null,
  minimum_quantity numeric(12, 3) not null check (minimum_quantity >= 0),
  target_quantity numeric(12, 3) check (target_quantity is null or target_quantity >= 0),
  expires_on date,
  updated_at timestamptz not null,
  unique (user_id, product_id)
);

create index if not exists pantry_items_user_idx on pantry_items (user_id, product_id);
create index if not exists pantry_items_expiry_idx on pantry_items (expires_on) where expires_on is not null;
