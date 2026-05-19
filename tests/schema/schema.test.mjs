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
  'human_review_assignments',
  'grocery_indices',
  'grocery_index_components'
];

const requiredColumns = [
  'observed_at',
  'unit_price',
  'member_price',
  'source_type',
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
  'base_date',
  'weight'
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
});
