create table if not exists household_plans (
  id text primary key,
  user_id text not null references app_users(id) on delete cascade,
  name text not null,
  weekly_budget numeric(12, 2) not null check (weekly_budget >= 0),
  approval_limit numeric(12, 2) not null check (approval_limit >= 0),
  reviewer_user_id text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (user_id)
);

create table if not exists household_members (
  household_id text not null references household_plans(id) on delete cascade,
  user_id text not null,
  display_name text not null,
  primary key (household_id, user_id)
);

create table if not exists household_basket_items (
  household_id text not null references household_plans(id) on delete cascade,
  line_position integer not null check (line_position >= 0),
  product_id text not null,
  quantity numeric(12, 3) not null check (quantity > 0),
  added_by text not null,
  primary key (household_id, line_position)
);

create table if not exists household_watchlist_items (
  household_id text not null references household_plans(id) on delete cascade,
  line_position integer not null check (line_position >= 0),
  product_id text not null,
  added_by text not null,
  target_price numeric(12, 2) check (target_price is null or target_price >= 0),
  primary key (household_id, line_position)
);

create table if not exists household_favorite_stores (
  household_id text not null references household_plans(id) on delete cascade,
  store_id text not null,
  primary key (household_id, store_id)
);

create index if not exists household_plans_user_idx on household_plans (user_id);
create index if not exists household_members_user_idx on household_members (user_id, household_id);
create index if not exists household_basket_items_product_idx on household_basket_items (product_id, household_id);
create index if not exists household_watchlist_items_product_idx on household_watchlist_items (product_id, household_id);
