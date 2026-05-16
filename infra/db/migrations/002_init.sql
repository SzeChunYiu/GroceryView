-- GroceryView core PostgreSQL schema.
-- Prices are immutable observations; current/chart tables are read-model projections.

CREATE TYPE price_type AS ENUM ('regular', 'promotion', 'member', 'online', 'in_store', 'clearance', 'estimated');
CREATE TYPE source_type AS ENUM ('retailer_page', 'retailer_api', 'flyer', 'receipt', 'shelf_photo', 'manual_admin', 'open_data', 'estimated');
CREATE TYPE confidence_band AS ENUM ('verified', 'high', 'medium', 'low', 'estimated');
CREATE TYPE alert_status AS ENUM ('active', 'paused', 'triggered', 'expired', 'deleted');
CREATE TYPE observation_status AS ENUM ('pending', 'accepted', 'rejected', 'superseded');
CREATE TYPE moderation_status AS ENUM ('open', 'in_review', 'approved', 'rejected', 'merged');
CREATE TYPE receipt_status AS ENUM ('uploaded', 'processing', 'parsed', 'failed', 'reviewed');

CREATE TABLE cities (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  country_code CHAR(2) NOT NULL,
  currency_code CHAR(3) NOT NULL DEFAULT 'SEK',
  timezone TEXT NOT NULL DEFAULT 'Europe/Stockholm',
  locale TEXT NOT NULL DEFAULT 'sv-SE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, country_code)
);

CREATE TABLE chains (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  country_code CHAR(2) NOT NULL DEFAULT 'SE',
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE stores (
  id BIGSERIAL PRIMARY KEY,
  chain_id BIGINT NOT NULL REFERENCES chains(id),
  city_id BIGINT NOT NULL REFERENCES cities(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  district TEXT,
  postal_code TEXT,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  location geography(Point, 4326),
  retailer_store_id TEXT,
  opening_hours JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (chain_id, retailer_store_id),
  CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180))
);

CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  ean TEXT UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  brand TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  unit TEXT NOT NULL,
  unit_size NUMERIC(12,3),
  unit_quantity_text TEXT,
  package_size TEXT,
  nutrition JSONB,
  image_url TEXT,
  is_private_label BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE product_aliases (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  source_type source_type NOT NULL DEFAULT 'manual_admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, alias)
);

CREATE TABLE product_equivalence_groups (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE product_equivalence_members (
  group_id BIGINT NOT NULL REFERENCES product_equivalence_groups(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  equivalence_score NUMERIC(5,4) NOT NULL DEFAULT 1.0 CHECK (equivalence_score >= 0 AND equivalence_score <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, product_id)
);

CREATE TABLE source_runs (
  id BIGSERIAL PRIMARY KEY,
  source_type source_type NOT NULL,
  source_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status observation_status NOT NULL DEFAULT 'pending',
  parser_version TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE source_records_raw (
  id BIGSERIAL PRIMARY KEY,
  source_run_id BIGINT REFERENCES source_runs(id) ON DELETE SET NULL,
  source_type source_type NOT NULL,
  source_url TEXT,
  storage_uri TEXT,
  record_hash TEXT UNIQUE,
  payload JSONB,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  parser_version TEXT,
  confidence_score NUMERIC(5,4) CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1))
);

CREATE TABLE price_observations (
  id BIGSERIAL,
  product_id BIGINT NOT NULL REFERENCES products(id),
  store_id BIGINT REFERENCES stores(id),
  city_id BIGINT NOT NULL REFERENCES cities(id),
  chain_id BIGINT REFERENCES chains(id),
  price_type price_type NOT NULL,
  price_sek NUMERIC(12,2) NOT NULL CHECK (price_sek >= 0),
  regular_price_sek NUMERIC(12,2) CHECK (regular_price_sek IS NULL OR regular_price_sek >= 0),
  member_price_sek NUMERIC(12,2) CHECK (member_price_sek IS NULL OR member_price_sek >= 0),
  unit_price_sek NUMERIC(12,2) CHECK (unit_price_sek IS NULL OR unit_price_sek >= 0),
  unit_price_unit TEXT,
  currency_code CHAR(3) NOT NULL DEFAULT 'SEK',
  observed_at TIMESTAMPTZ NOT NULL,
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  source_type source_type NOT NULL,
  source_url TEXT,
  source_run_id BIGINT REFERENCES source_runs(id) ON DELETE SET NULL,
  raw_record_id BIGINT REFERENCES source_records_raw(id) ON DELETE SET NULL,
  parser_version TEXT NOT NULL,
  confidence_score NUMERIC(5,4) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  confidence_band confidence_band NOT NULL,
  status observation_status NOT NULL DEFAULT 'accepted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, observed_at),
  CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from)
) PARTITION BY RANGE (observed_at);

-- Seed partitions cover the initial MVP development window. The default partition
-- prevents ingestion failures for backfilled or future observations until the
-- monthly partition maintenance job is added.
CREATE TABLE price_observations_2026_05 PARTITION OF price_observations
  FOR VALUES FROM ('2026-05-01 00:00:00+00') TO ('2026-06-01 00:00:00+00');
CREATE TABLE price_observations_2026_06 PARTITION OF price_observations
  FOR VALUES FROM ('2026-06-01 00:00:00+00') TO ('2026-07-01 00:00:00+00');
CREATE TABLE price_observations_2026_07 PARTITION OF price_observations
  FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-08-01 00:00:00+00');
CREATE TABLE price_observations_2026_08 PARTITION OF price_observations
  FOR VALUES FROM ('2026-08-01 00:00:00+00') TO ('2026-09-01 00:00:00+00');
CREATE TABLE price_observations_default PARTITION OF price_observations DEFAULT;

CREATE TABLE promotion_observations (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id),
  store_id BIGINT REFERENCES stores(id),
  city_id BIGINT NOT NULL REFERENCES cities(id),
  chain_id BIGINT REFERENCES chains(id),
  promo_price_sek NUMERIC(12,2) NOT NULL CHECK (promo_price_sek >= 0),
  regular_price_sek NUMERIC(12,2) CHECK (regular_price_sek IS NULL OR regular_price_sek >= 0),
  unit_price_sek NUMERIC(12,2) CHECK (unit_price_sek IS NULL OR unit_price_sek >= 0),
  unit_price_unit TEXT,
  promo_start DATE,
  promo_end DATE,
  member_only BOOLEAN NOT NULL DEFAULT FALSE,
  promotion_text TEXT,
  source_type source_type NOT NULL,
  source_url TEXT,
  source_run_id BIGINT REFERENCES source_runs(id) ON DELETE SET NULL,
  raw_record_id BIGINT REFERENCES source_records_raw(id) ON DELETE SET NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  parser_version TEXT NOT NULL,
  confidence_score NUMERIC(5,4) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  confidence_band confidence_band NOT NULL,
  status observation_status NOT NULL DEFAULT 'accepted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (promo_end IS NULL OR promo_start IS NULL OR promo_end >= promo_start)
);

CREATE TABLE latest_store_prices (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id),
  store_id BIGINT NOT NULL REFERENCES stores(id),
  city_id BIGINT NOT NULL REFERENCES cities(id),
  chain_id BIGINT REFERENCES chains(id),
  price_observation_id BIGINT,
  price_observation_observed_at TIMESTAMPTZ,
  price_type price_type NOT NULL,
  price_sek NUMERIC(12,2) NOT NULL CHECK (price_sek >= 0),
  regular_price_sek NUMERIC(12,2) CHECK (regular_price_sek IS NULL OR regular_price_sek >= 0),
  member_price_sek NUMERIC(12,2) CHECK (member_price_sek IS NULL OR member_price_sek >= 0),
  unit_price_sek NUMERIC(12,2) CHECK (unit_price_sek IS NULL OR unit_price_sek >= 0),
  unit_price_unit TEXT,
  observed_at TIMESTAMPTZ NOT NULL,
  source_type source_type NOT NULL,
  source_url TEXT,
  source_run_id BIGINT REFERENCES source_runs(id) ON DELETE SET NULL,
  raw_record_id BIGINT REFERENCES source_records_raw(id) ON DELETE SET NULL,
  parser_version TEXT NOT NULL,
  confidence_score NUMERIC(5,4) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  confidence_band confidence_band NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, store_id),
  FOREIGN KEY (price_observation_id, price_observation_observed_at)
    REFERENCES price_observations(id, observed_at) ON DELETE SET NULL,
  CHECK (
    (price_observation_id IS NULL AND price_observation_observed_at IS NULL)
    OR (price_observation_id IS NOT NULL AND price_observation_observed_at IS NOT NULL)
  )
);

CREATE TABLE price_series_daily (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id),
  city_id BIGINT NOT NULL REFERENCES cities(id),
  store_id BIGINT REFERENCES stores(id),
  chain_id BIGINT REFERENCES chains(id),
  series_date DATE NOT NULL,
  price_type price_type NOT NULL,
  min_price_sek NUMERIC(12,2),
  median_price_sek NUMERIC(12,2),
  max_price_sek NUMERIC(12,2),
  best_price_sek NUMERIC(12,2),
  unit_price_sek NUMERIC(12,2),
  observation_count INTEGER NOT NULL DEFAULT 0 CHECK (observation_count >= 0),
  confidence_band confidence_band NOT NULL DEFAULT 'medium',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, city_id, store_id, chain_id, series_date, price_type)
);

CREATE TABLE index_snapshots (
  id BIGSERIAL PRIMARY KEY,
  city_id BIGINT NOT NULL REFERENCES cities(id),
  index_key TEXT NOT NULL,
  index_name TEXT NOT NULL,
  category TEXT,
  chain_id BIGINT REFERENCES chains(id),
  snapshot_date DATE NOT NULL,
  value NUMERIC(14,4) NOT NULL,
  change_7d_pct NUMERIC(8,4),
  change_30d_pct NUMERIC(8,4),
  source_type source_type NOT NULL DEFAULT 'estimated',
  source_run_id BIGINT REFERENCES source_runs(id) ON DELETE SET NULL,
  raw_record_id BIGINT REFERENCES source_records_raw(id) ON DELETE SET NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  parser_version TEXT NOT NULL DEFAULT 'manual-v0',
  confidence_score NUMERIC(5,4) NOT NULL DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  confidence_band confidence_band NOT NULL DEFAULT 'estimated',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (city_id, index_key, snapshot_date)
);

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  home_city_id BIGINT REFERENCES cities(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE favorite_stores (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, store_id)
);

CREATE TABLE watchlist_items (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  target_price_sek NUMERIC(12,2) CHECK (target_price_sek IS NULL OR target_price_sek >= 0),
  threshold_pct NUMERIC(6,3),
  include_member_prices BOOLEAN NOT NULL DEFAULT TRUE,
  status alert_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE TABLE weekly_baskets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Weekly basket',
  week_start DATE NOT NULL,
  city_id BIGINT REFERENCES cities(id),
  budget_sek NUMERIC(12,2) CHECK (budget_sek IS NULL OR budget_sek >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start, name)
);

CREATE TABLE basket_items (
  id BIGSERIAL PRIMARY KEY,
  weekly_basket_id BIGINT NOT NULL REFERENCES weekly_baskets(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity NUMERIC(12,3) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit TEXT,
  is_checked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (weekly_basket_id, product_id)
);

CREATE TABLE budgets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  city_id BIGINT REFERENCES cities(id),
  period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly')),
  amount_sek NUMERIC(12,2) NOT NULL CHECK (amount_sek >= 0),
  category TEXT,
  starts_on DATE NOT NULL,
  ends_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_on IS NULL OR ends_on >= starts_on)
);

CREATE TABLE alerts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  watchlist_item_id BIGINT REFERENCES watchlist_items(id) ON DELETE SET NULL,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  city_id BIGINT REFERENCES cities(id),
  threshold_price_sek NUMERIC(12,2) CHECK (threshold_price_sek IS NULL OR threshold_price_sek >= 0),
  threshold_pct NUMERIC(6,3),
  status alert_status NOT NULL DEFAULT 'active',
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE alert_deliveries (
  id BIGSERIAL PRIMARY KEY,
  alert_id BIGINT NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('push', 'email', 'sms', 'in_app')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'failed', 'skipped')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE receipt_uploads (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  store_id BIGINT REFERENCES stores(id) ON DELETE SET NULL,
  city_id BIGINT REFERENCES cities(id),
  object_uri TEXT NOT NULL,
  receipt_date DATE,
  total_sek NUMERIC(12,2) CHECK (total_sek IS NULL OR total_sek >= 0),
  status receipt_status NOT NULL DEFAULT 'uploaded',
  source_type source_type NOT NULL DEFAULT 'receipt',
  source_url TEXT,
  source_run_id BIGINT REFERENCES source_runs(id) ON DELETE SET NULL,
  raw_record_id BIGINT REFERENCES source_records_raw(id) ON DELETE SET NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  parser_version TEXT,
  confidence_score NUMERIC(5,4) CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  confidence_band confidence_band DEFAULT 'estimated',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE receipt_line_items (
  id BIGSERIAL PRIMARY KEY,
  receipt_upload_id BIGINT NOT NULL REFERENCES receipt_uploads(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  raw_name TEXT NOT NULL,
  quantity NUMERIC(12,3) DEFAULT 1 CHECK (quantity IS NULL OR quantity > 0),
  unit TEXT,
  line_price_sek NUMERIC(12,2) CHECK (line_price_sek IS NULL OR line_price_sek >= 0),
  unit_price_sek NUMERIC(12,2) CHECK (unit_price_sek IS NULL OR unit_price_sek >= 0),
  confidence_score NUMERIC(5,4) CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE shelf_photo_reports (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  store_id BIGINT REFERENCES stores(id) ON DELETE SET NULL,
  object_uri TEXT NOT NULL,
  reported_price_sek NUMERIC(12,2) CHECK (reported_price_sek IS NULL OR reported_price_sek >= 0),
  source_type source_type NOT NULL DEFAULT 'shelf_photo',
  source_url TEXT,
  source_run_id BIGINT REFERENCES source_runs(id) ON DELETE SET NULL,
  raw_record_id BIGINT REFERENCES source_records_raw(id) ON DELETE SET NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  parser_version TEXT,
  confidence_score NUMERIC(5,4) CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  confidence_band confidence_band DEFAULT 'estimated',
  status moderation_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE moderation_queue (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id BIGINT NOT NULL,
  reason TEXT NOT NULL,
  status moderation_status NOT NULL DEFAULT 'open',
  assigned_to_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
