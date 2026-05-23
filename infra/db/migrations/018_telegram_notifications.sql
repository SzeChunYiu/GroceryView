alter table notification_tasks
  drop constraint if exists notification_tasks_channel_check;

alter table notification_tasks
  add constraint notification_tasks_channel_check
  check (channel in ('push', 'email', 'telegram'));

alter table notification_suppressions
  drop constraint if exists notification_suppressions_channel_check;

alter table notification_suppressions
  add constraint notification_suppressions_channel_check
  check (channel in ('push', 'email', 'telegram'));

create table if not exists notification_subscriptions (
  id text primary key,
  user_id text not null,
  channel text not null check (channel in ('push', 'email', 'telegram')),
  recipient text not null,
  chat_id text,
  product_id text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (channel <> 'telegram' or chat_id is not null)
);

create index if not exists notification_subscriptions_active_product_idx on notification_subscriptions (active, product_id, channel);

create index if not exists notification_subscriptions_user_idx on notification_subscriptions (user_id, channel, id);
