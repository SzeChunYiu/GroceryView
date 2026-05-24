create table if not exists push_notification_subscriptions (
  id text primary key,
  user_id text not null references app_users(id) on delete cascade,
  provider text not null default 'expo' check (provider in ('expo')),
  push_token text not null,
  platform text check (platform in ('ios', 'android', 'web')),
  device_id text,
  permission_status text not null check (permission_status in ('granted', 'denied', 'prompt', 'default')),
  alerts_enabled boolean not null default true,
  reminders_enabled boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists push_notification_subscriptions_user_active_idx
  on push_notification_subscriptions (user_id, active, updated_at desc);

create index if not exists push_notification_subscriptions_token_idx
  on push_notification_subscriptions (provider, push_token);
