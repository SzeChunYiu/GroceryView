-- Application repository support tables used by packages/db.
-- These tables keep app workflow state separate from the canonical product catalog.

create table if not exists app_users (
  id text primary key,
  email text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists favorite_stores (
  user_id text not null references app_users(id) on delete cascade,
  store_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, store_id)
);

create table if not exists user_preferences (
  user_id text primary key references app_users(id) on delete cascade,
  weekly_budget numeric(12, 2) not null check (weekly_budget >= 0),
  monthly_budget numeric(12, 2) not null check (monthly_budget >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists watchlist_items (
  id bigserial primary key,
  user_id text not null references app_users(id) on delete cascade,
  product_id text not null,
  target_price numeric(12, 2) check (target_price is null or target_price >= 0),
  alert_deal_score_at integer check (alert_deal_score_at between 0 and 100),
  favorite_stores_only boolean not null default true,
  allowed_price_types text[] not null default array['shelf']::text[] check (
    cardinality(allowed_price_types) > 0
    and allowed_price_types <@ array['shelf', 'member', 'promotion', 'estimated']::text[]
  ),
  created_at timestamptz not null default now()
);

create table if not exists weekly_baskets (
  id bigserial primary key,
  user_id text not null references app_users(id) on delete cascade,
  week_start date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table if not exists basket_items (
  id bigserial primary key,
  basket_id bigint not null references weekly_baskets(id) on delete cascade,
  product_id text not null,
  quantity numeric(12, 3) not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create table if not exists human_review_assignments (
  id text primary key,
  review_id text not null,
  subject_type text not null check (subject_type in ('product_match', 'community_report')),
  subject_id text not null,
  priority text not null check (priority in ('high', 'medium', 'low')),
  reason text not null,
  assignee_id text not null,
  assigned_at timestamptz not null,
  due_at timestamptz not null,
  status text not null check (status in ('assigned', 'in_progress', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists human_reviewers (
  id text primary key,
  role text not null check (role in ('viewer', 'moderator', 'lead')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists community_reporter_trust (
  reporter_id text primary key,
  reports_last_24_hours integer not null check (reports_last_24_hours >= 0),
  pending_reports integer not null check (pending_reports >= 0),
  accepted_reports_last_30_days integer not null check (accepted_reports_last_30_days >= 0),
  rejected_reports_last_30_days integer not null check (rejected_reports_last_30_days >= 0),
  updated_at timestamptz not null
);

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
  max_attempts integer not null default 3 check (max_attempts > 0),
  status text not null check (status in ('queued', 'delivered', 'dead_lettered', 'suppressed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notification_suppressions (
  id text primary key,
  recipient text not null,
  channel text check (channel in ('push', 'email')),
  reason text not null check (reason in ('unsubscribed', 'bounce', 'complaint')),
  active boolean not null default true,
  updated_at timestamptz not null
);

create index if not exists favorite_stores_user_idx on favorite_stores (user_id);
create index if not exists watchlist_items_user_idx on watchlist_items (user_id, id);
create index if not exists weekly_baskets_user_week_idx on weekly_baskets (user_id, week_start desc);
create index if not exists basket_items_basket_idx on basket_items (basket_id, id);
create index if not exists human_review_assignments_open_idx on human_review_assignments (status, due_at, id);
create index if not exists notification_tasks_due_idx on notification_tasks (status, send_at, id);
create index if not exists notification_suppressions_active_idx on notification_suppressions (active, recipient, channel, id);
