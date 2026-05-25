-- Account-owned multi-week stock-up list rows.
-- Rows are editable planning records backed by observed historical price facts; they do not store or imply price forecasts.

create table if not exists multi_week_stock_up_rows (
  user_id text not null references app_users(id) on delete cascade,
  row_id text not null,
  product_id text not null,
  product_name text not null,
  store_id text,
  store_name text not null,
  planning_weeks integer not null check (planning_weeks > 0 and planning_weeks <= 26),
  weekly_need_units numeric(12, 3) not null check (weekly_need_units > 0),
  package_units numeric(12, 3) not null check (package_units > 0),
  comparable_unit text not null,
  current_unit_price numeric(12, 2) not null check (current_unit_price >= 0),
  historical_low_unit_price numeric(12, 2) not null check (historical_low_unit_price >= 0),
  typical_unit_price numeric(12, 2) not null check (typical_unit_price >= 0),
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  history_window_start timestamptz not null,
  history_window_end timestamptz not null,
  storage_limit_weeks integer check (storage_limit_weeks is null or (storage_limit_weeks > 0 and storage_limit_weeks <= 26)),
  no_forecast_reason text not null default 'Historical low and typical prices are observed facts only; no future shelf price is predicted.',
  review_trigger text not null default 'Re-check observed prices before restocking or when a new verified row arrives.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, row_id),
  check (history_window_start <= history_window_end)
);

create index if not exists multi_week_stock_up_rows_user_updated_idx on multi_week_stock_up_rows (user_id, updated_at desc, row_id);
create index if not exists multi_week_stock_up_rows_product_idx on multi_week_stock_up_rows (product_id, user_id);
