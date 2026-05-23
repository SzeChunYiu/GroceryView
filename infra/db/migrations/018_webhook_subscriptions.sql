-- Outbound price-change webhook subscriptions for trusted server-side dispatch.

create table if not exists webhook_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text references app_users(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  chain text,
  callback_url text not null check (callback_url ~* '^https://'),
  secret text,
  active boolean not null default true,
  last_delivery_at timestamptz,
  failure_count integer not null default 0 check (failure_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (product_id is not null or chain is not null)
);

create index if not exists webhook_subscriptions_active_product_idx on webhook_subscriptions (active, product_id, chain, id);
create index if not exists webhook_subscriptions_user_idx on webhook_subscriptions (user_id, active, created_at desc, id) where user_id is not null;
