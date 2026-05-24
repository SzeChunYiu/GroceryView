-- App-facing alert rule state for target-price, Deal Score, stock, price-drop, and best-time-to-buy notifications.

create table if not exists alert_rules (
  id text primary key,
  user_id text not null references app_users(id) on delete cascade,
  product_id text,
  store_id text,
  category_id text,
  channel text not null check (channel in ('push', 'email')),
  alert_type text not null check (alert_type in ('target_price', 'deal_score', 'back_in_stock', 'price_drop', 'best_time_to_buy')),
  target_price numeric(12, 2) check (target_price is null or target_price >= 0),
  deal_score_threshold integer check (deal_score_threshold is null or deal_score_threshold between 0 and 100),
  minimum_confidence text check (minimum_confidence is null or minimum_confidence in ('high', 'medium', 'low', 'unverified')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (alert_type = 'best_time_to_buy' and store_id is not null and category_id is not null and minimum_confidence is not null)
    or (product_id is not null and (target_price is not null or deal_score_threshold is not null or alert_type in ('back_in_stock', 'price_drop')))
  )
);

create index if not exists alert_rules_active_user_idx on alert_rules (user_id, active, product_id, category_id, alert_type, id);
create index if not exists alert_rules_store_idx on alert_rules (store_id) where store_id is not null;
create index if not exists alert_rules_category_store_idx on alert_rules (category_id, store_id, minimum_confidence) where alert_type = 'best_time_to_buy' and active = true;
