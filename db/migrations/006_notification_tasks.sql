create table if not exists notification_tasks (
  id text primary key,
  channel text not null check (channel in ('push', 'email')),
  type text not null,
  title text not null,
  body text not null,
  priority text not null check (priority in ('normal', 'high')),
  send_at timestamptz not null,
  recipient text not null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null check (max_attempts > 0),
  status text not null check (status in ('queued', 'delivered', 'dead_lettered')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_tasks_status_send_idx on notification_tasks(status, send_at);
