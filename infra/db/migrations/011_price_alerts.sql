-- Target-price alert subscriptions captured by the web alert API.

create table if not exists price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  product_id text not null,
  target_price numeric(12, 2) not null check (target_price >= 0),
  created_at timestamptz not null default now()
);

create index if not exists price_alerts_user_created_idx on price_alerts (user_email, created_at desc, id);
create index if not exists price_alerts_product_idx on price_alerts (product_id, id);
