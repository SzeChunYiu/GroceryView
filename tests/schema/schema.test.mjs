import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const schema = readFileSync(new URL('../../db/schema.sql', import.meta.url), 'utf8').toLowerCase();

const requiredTables = [
  'chains',
  'stores',
  'products',
  'product_aliases',
  'price_observations',
  'promotion_observations',
  'user_preferences',
  'favorite_stores',
  'watchlist_items',
  'weekly_baskets',
  'basket_items',
  'budgets',
  'receipt_uploads',
  'receipt_items',
  'community_price_reports',
  'community_reporter_trust',
  'fuel_grades',
  'fuel_price_sources',
  'fuel_price_source_observations',
  'subscription_entitlements',
  'notification_tasks',
  'notification_suppressions',
  'notification_subscriptions',
  'human_reviewers',
  'human_review_assignments',
  'grocery_indices',
  'grocery_index_components'
];

const requiredColumns = [
  'observed_at',
  'unit_price',
  'member_price',
  'source_type',
  'domain',
  'confidence_score',
  'barcode',
  'canonical_name',
  'private_label_owner',
  'match_confidence',
  'weekly_budget',
  'monthly_budget',
  'accept_private_label',
  'target_price',
  'alert_deal_score_at',
  'assignee_id',
  'due_at',
  'role',
  'reports_last_24_hours',
  'accepted_reports_last_30_days',
  'tier',
  'current_period_ends_at',
  'provider_customer_id',
  'provider_subscription_id',
  'send_at',
  'attempt_count',
  'max_attempts',
  'reason',
  'chat_id',
  'base_date',
  'weight',
  'domain',
  'fuel_grade_id',
  'source_kind',
  'original_price_text'
];

describe('db/schema.sql', () => {
  it('contains every proposal-critical MVP table', () => {
    for (const table of requiredTables) {
      assert.match(schema, new RegExp(`create table (if not exists )?${table}\\b`), `${table} table missing`);
    }
  });

  it('contains required proposal columns for price confidence, products, budgets, alerts, and indices', () => {
    for (const column of requiredColumns) {
      assert.match(schema, new RegExp(`\\b${column}\\b`), `${column} column missing`);
    }
  });

  it('allows suppressed notification task state for terminal unsubscribe handling', () => {
    assert.match(schema, /status in \('queued', 'delivered', 'dead_lettered', 'suppressed'\)/);
  });

  it('keeps one weekly basket per user and week for deterministic basket item writes', () => {
    assert.match(schema, /unique\s*\(\s*user_id\s*,\s*week_start\s*\)/);
  });

  it('stores subscription entitlements without card or secret data', () => {
    assert.match(schema, /create table (if not exists )?subscription_entitlements\b/);
    assert.match(schema, /tier text not null check \(tier in \('free', 'premium'\)\)/);
    assert.match(schema, /provider text check \(provider in \('stripe_compatible'\)\)/);
    assert.doesNotMatch(schema, /\b(card_number|cvc|client_secret|payment_method_secret)\b/);
  });

  it('models fuel prices as source-backed per-grade observations', () => {
    assert.match(schema, /domain in \('grocery', 'fuel', 'pharmacy'\)/);
    assert.match(schema, /fuel-95-e10/);
    assert.match(schema, /fuel-98/);
    assert.match(schema, /fuel-diesel/);
    assert.match(schema, /fuel-hvo100/);
    assert.match(schema, /fuel-e85/);
    assert.match(schema, /source_kind in \('operator_public_price_page', 'crowd_station_report'\)/);
    assert.match(schema, /reporter_id text references community_reporter_trust/);
    assert.match(schema, /price_observation_id bigint not null references price_observations/);
  });

  it('deduplicates scraper price snapshots by product, store, and observed date', () => {
    assert.match(schema, /create unique index if not exists price_observations_product_store_date_uidx/);
    assert.match(schema, /on price_observations\s*\(\s*product_id,\s*chain_id,\s*store_id,\s*observed_at,\s*source_type\s*\)/);
    assert.match(schema, /nulls not distinct/);
  });

  it('deduplicates barcoded products by canonical barcode when present', () => {
    assert.match(schema, /create unique index if not exists products_barcode_unique_idx on products\s*\(\s*barcode\s*\) where barcode is not null/);
  });
});
