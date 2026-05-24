create table if not exists price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  product_id uuid not null references products(id) on delete cascade,
  target_price numeric(10, 2) not null,
  channel text not null check (channel in ('email', 'push')),
  triggered boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists price_alerts_user_id_idx on price_alerts(user_id);
create index if not exists price_alerts_product_id_idx on price_alerts(product_id);
create index if not exists price_alerts_triggered_idx on price_alerts(triggered);
