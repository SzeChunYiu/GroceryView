create table if not exists subscription_entitlements (
  user_id text primary key references app_users(id) on delete cascade,
  tier text not null check (tier in ('free', 'premium')),
  plan text check (plan in ('premium_monthly', 'premium_yearly')),
  status text not null check (status in ('active', 'past_due', 'canceled')),
  current_period_ends_at timestamptz,
  provider text check (provider in ('stripe_compatible')),
  provider_customer_id text,
  provider_subscription_id text,
  updated_at timestamptz not null
);

create index if not exists subscription_entitlements_status_idx on subscription_entitlements (status, updated_at desc);
create unique index if not exists subscription_entitlements_provider_subscription_idx on subscription_entitlements (provider, provider_subscription_id) where provider_subscription_id is not null;
