-- GroceryView PostgreSQL schema foundation.
-- Stores observations as immutable events and keeps confidence/provenance explicit.

create table if not exists chains (
  id text primary key,
  name text not null,
  domain text not null default 'grocery' check (domain in ('grocery', 'fuel', 'pharmacy')),
  country_code text not null default 'SE',
  created_at timestamptz not null default now()
);

create table if not exists stores (
  id text primary key,
  chain_id text not null references chains(id),
  name text not null,
  address text not null,
  city text not null,
  district text,
  domain text not null default 'grocery' check (domain in ('grocery', 'fuel', 'pharmacy')),
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  store_type text,
  opening_hours jsonb,
  online_store_id text,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id text primary key,
  parent_id text references categories(id),
  name text not null
);

create table if not exists products (
  id text primary key,
  barcode text,
  canonical_name text not null,
  domain text not null default 'grocery' check (domain in ('grocery', 'fuel', 'pharmacy')),
  fuel_grade_id text,
  brand text,
  brand_owner text,
  private_label_owner text,
  category_id text references categories(id),
  subcategory_id text references categories(id),
  package_size numeric(12, 3),
  package_unit text,
  comparable_unit text not null,
  organic boolean not null default false,
  lactose_free boolean not null default false,
  gluten_free boolean not null default false,
  vegan boolean not null default false,
  image_url text,
  nutrition_source text,
  created_at timestamptz not null default now()
);

create table if not exists product_aliases (
  id bigserial primary key,
  raw_name text not null,
  source_type text not null,
  matched_product_id text references products(id),
  match_confidence numeric(5, 4) not null check (match_confidence between 0 and 1),
  reviewed_by_human boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists price_observations (
  id bigserial primary key,
  product_id text not null references products(id),
  retailer_product_id text,
  store_id text references stores(id),
  chain_id text not null references chains(id),
  domain text not null default 'grocery' check (domain in ('grocery', 'fuel', 'pharmacy')),
  observed_at timestamptz not null,
  price numeric(12, 2) not null check (price >= 0),
  unit_price numeric(12, 4) not null check (unit_price >= 0),
  currency char(3) not null default 'SEK',
  regular_price numeric(12, 2),
  promo_price numeric(12, 2),
  member_price numeric(12, 2),
  promo_type text,
  source_type text not null,
  source_url text,
  confidence_score numeric(5, 4) not null check (confidence_score between 0 and 1),
  is_online_price boolean not null default false,
  is_instore_price boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists promotion_observations (
  id bigserial primary key,
  product_id text not null references products(id),
  chain_id text not null references chains(id),
  store_id text references stores(id),
  promo_start date,
  promo_end date,
  promo_price numeric(12, 2) not null,
  regular_price_claimed numeric(12, 2),
  promo_text text,
  member_only boolean not null default false,
  multi_buy_quantity integer,
  multi_buy_price numeric(12, 2),
  source_type text not null,
  confidence_score numeric(5, 4) not null check (confidence_score between 0 and 1),
  created_at timestamptz not null default now()
);

create table if not exists app_users (
  id text primary key,
  email text unique,
  disabled_at timestamptz,
  verification_sent_at timestamptz,
  created_at timestamptz not null default now()
);

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

create table if not exists user_preferences (
  user_id text primary key references app_users(id) on delete cascade,
  weekly_budget numeric(12, 2),
  monthly_budget numeric(12, 2),
  accept_private_label text not null default 'maybe',
  accept_budget_private_label text not null default 'maybe',
  include_member_prices boolean not null default false,
  preferred_language text not null default 'en',
  preferred_currency char(3) not null default 'SEK',
  dietary_preferences jsonb not null default '{}'::jsonb,
  notification_preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists favorite_stores (
  user_id text not null references app_users(id) on delete cascade,
  store_id text not null references stores(id),
  label text,
  created_at timestamptz not null default now(),
  primary key (user_id, store_id)
);

create table if not exists watchlist_items (
  id bigserial primary key,
  user_id text not null references app_users(id) on delete cascade,
  product_id text references products(id),
  category_id text references categories(id),
  target_price numeric(12, 2),
  preferred_brands text[] not null default '{}',
  accept_private_label text not null default 'maybe',
  organic_only boolean not null default false,
  alert_deal_score_at integer,
  favorite_stores_only boolean not null default true,
  stock_up_allowed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists webhook_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text references app_users(id) on delete cascade,
  product_id text references products(id),
  chain text,
  callback_url text not null,
  secret text,
  active boolean not null default true,
  last_delivery_at timestamptz,
  failure_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists weekly_baskets (
  id bigserial primary key,
  user_id text not null references app_users(id) on delete cascade,
  household_id text,
  week_start date not null,
  budget numeric(12, 2),
  status text not null default 'planning',
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table if not exists basket_items (
  id bigserial primary key,
  basket_id bigint not null references weekly_baskets(id) on delete cascade,
  product_id text references products(id),
  raw_name text,
  quantity numeric(12, 3) not null default 1,
  preferred_brand text,
  substitution_mode text not null default 'equivalent_allowed',
  marked_bought boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists budgets (
  id bigserial primary key,
  user_id text not null references app_users(id) on delete cascade,
  period text not null,
  amount numeric(12, 2) not null,
  category_id text references categories(id),
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now()
);

create table if not exists receipt_uploads (
  id bigserial primary key,
  user_id text not null references app_users(id) on delete cascade,
  store_id text references stores(id),
  purchased_at timestamptz,
  total_amount numeric(12, 2) not null,
  image_url text,
  ocr_confidence numeric(5, 4) check (ocr_confidence between 0 and 1),
  created_at timestamptz not null default now()
);

create table if not exists receipt_items (
  id bigserial primary key,
  receipt_id bigint not null references receipt_uploads(id) on delete cascade,
  raw_name text not null,
  product_id text references products(id),
  quantity numeric(12, 3),
  item_total numeric(12, 2) not null,
  discounts numeric(12, 2),
  member_price numeric(12, 2),
  match_confidence numeric(5, 4) check (match_confidence between 0 and 1)
);

create table if not exists community_price_reports (
  id bigserial primary key,
  user_id text references app_users(id) on delete set null,
  product_id text references products(id),
  store_id text references stores(id),
  observed_at timestamptz not null,
  price numeric(12, 2) not null,
  source_type text not null,
  photo_url text,
  confidence_score numeric(5, 4) not null check (confidence_score between 0 and 1),
  review_status text not null default 'pending'
);

create table if not exists community_reporter_trust (
  reporter_id text primary key,
  reports_last_24_hours integer not null default 0 check (reports_last_24_hours >= 0),
  pending_reports integer not null default 0 check (pending_reports >= 0),
  accepted_reports_last_30_days integer not null default 0 check (accepted_reports_last_30_days >= 0),
  rejected_reports_last_30_days integer not null default 0 check (rejected_reports_last_30_days >= 0),
  updated_at timestamptz not null
);

create table if not exists fuel_grades (
  id text primary key check (id in ('fuel-95-e10', 'fuel-98', 'fuel-diesel', 'fuel-hvo100', 'fuel-e85')),
  grade_code text not null unique check (grade_code in ('95', '98', 'diesel', 'hvo100', 'e85')),
  label text not null,
  comparable_unit text not null default 'l' check (comparable_unit = 'l'),
  match_key text not null default 'fuel_grade' check (match_key = 'fuel_grade'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists fuel_price_sources (
  id bigserial primary key,
  source_kind text not null check (source_kind in ('operator_public_price_page', 'crowd_station_report')),
  operator_id text,
  operator_name text,
  station_id text references stores(id),
  reporter_id text references community_reporter_trust(reporter_id),
  reporter_trust_tier text check (reporter_trust_tier in ('new', 'trusted', 'operator_verified')),
  evidence_type text check (evidence_type in ('receipt', 'pump_photo', 'manual_entry')),
  source_url text,
  parser_version text,
  captured_at timestamptz,
  submitted_at timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (
    (source_kind = 'operator_public_price_page'
      and operator_id is not null
      and operator_name is not null
      and source_url is not null
      and parser_version is not null
      and captured_at is not null
      and station_id is null
      and reporter_id is null
      and evidence_type is null)
    or
    (source_kind = 'crowd_station_report'
      and station_id is not null
      and reporter_id is not null
      and reporter_trust_tier is not null
      and evidence_type is not null
      and submitted_at is not null)
  )
);

create table if not exists fuel_price_source_observations (
  source_id bigint not null references fuel_price_sources(id) on delete restrict,
  price_observation_id bigint not null references price_observations(id) on delete cascade,
  fuel_grade_id text not null references fuel_grades(id) on delete restrict,
  original_price_text text not null,
  original_effective_date date,
  created_at timestamptz not null default now(),
  primary key (source_id, price_observation_id),
  unique (price_observation_id)
);

create table if not exists notification_tasks (
  id text primary key,
  channel text not null check (channel in ('push', 'email', 'telegram')),
  type text not null,
  title text not null,
  body text not null,
  priority text not null check (priority in ('normal', 'high')),
  send_at timestamptz not null,
  recipient text not null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null check (max_attempts > 0),
  status text not null check (status in ('queued', 'delivered', 'dead_lettered', 'suppressed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notification_suppressions (
  id text primary key,
  recipient text not null,
  channel text check (channel in ('push', 'email', 'telegram')),
  reason text not null check (reason in ('unsubscribed', 'bounce', 'complaint')),
  active boolean not null default true,
  updated_at timestamptz not null
);

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

create table if not exists human_reviewers (
  id text primary key,
  role text not null check (role in ('viewer', 'moderator', 'lead')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists human_review_assignments (
  id text primary key,
  review_id text not null unique,
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

create table if not exists grocery_indices (
  id text primary key,
  label text not null,
  scope_type text not null,
  scope_id text,
  base_date date not null,
  methodology text not null,
  confidence_score numeric(5, 4) not null check (confidence_score between 0 and 1),
  created_at timestamptz not null default now()
);

create table if not exists grocery_index_components (
  index_id text not null references grocery_indices(id) on delete cascade,
  product_id text not null references products(id),
  weight numeric(12, 6) not null default 1,
  comparable_unit text not null,
  primary key (index_id, product_id)
);

create index if not exists price_observations_product_time_idx on price_observations(product_id, observed_at desc);
create index if not exists price_observations_store_time_idx on price_observations(store_id, observed_at desc);
create index if not exists price_observations_domain_time_idx on price_observations(domain, observed_at desc);
create index if not exists promotion_observations_product_dates_idx on promotion_observations(product_id, promo_start, promo_end);
create index if not exists products_category_idx on products(category_id);
create index if not exists products_fuel_grade_idx on products(fuel_grade_id) where domain = 'fuel';
create index if not exists subscription_entitlements_status_idx on subscription_entitlements (status, updated_at desc);
create unique index if not exists subscription_entitlements_provider_subscription_idx on subscription_entitlements (provider, provider_subscription_id) where provider_subscription_id is not null;
create index if not exists community_reporter_trust_pending_idx on community_reporter_trust(pending_reports desc);
create index if not exists fuel_price_sources_kind_captured_idx on fuel_price_sources(source_kind, captured_at desc nulls last, submitted_at desc nulls last);
create index if not exists fuel_price_source_observations_grade_idx on fuel_price_source_observations(fuel_grade_id, created_at desc);
create index if not exists notification_tasks_status_send_idx on notification_tasks(status, send_at);
create index if not exists notification_suppressions_active_recipient_idx on notification_suppressions(active, recipient);
create index if not exists notification_subscriptions_active_product_idx on notification_subscriptions (active, product_id, channel);
create index if not exists notification_subscriptions_user_idx on notification_subscriptions (user_id, channel, id);
create index if not exists human_reviewers_role_active_idx on human_reviewers(role, active);
create index if not exists human_review_assignments_status_due_idx on human_review_assignments(status, due_at);
create index if not exists human_review_assignments_assignee_status_idx on human_review_assignments(assignee_id, status);
