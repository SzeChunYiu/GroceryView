create extension if not exists pgcrypto;

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  product_id text null references products(id) on delete set null,
  anonymous_id text null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists analytics_events_event_name_occurred_at_idx
  on analytics_events(event_name, occurred_at desc);

create index if not exists analytics_events_product_id_idx
  on analytics_events(product_id)
  where product_id is not null;
