create table if not exists notification_suppressions (
  id text primary key,
  recipient text not null,
  channel text check (channel in ('push', 'email')),
  reason text not null check (reason in ('unsubscribed', 'bounce', 'complaint')),
  active boolean not null default true,
  updated_at timestamptz not null
);

create index if not exists notification_suppressions_active_recipient_idx on notification_suppressions(active, recipient);
