import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { createSessionToken, hashPassword, verifyPasswordHash } from '@groceryview/auth';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import { createOpenApiYaml } from '../src/openapi.js';
import { PostgresQueryExecutorService } from '../src/database/postgres-query-executor.service.js';

class RecordingPriceHistoryExecutor {
  calls: Array<{ sql: string; params: unknown[] }> = [];
  configured = true;
  watchlistRows: Array<{
    id: string;
    product_id: string;
    product_slug: string;
    target_price: number | null;
    alert_deal_score_at: number | null;
    favorite_stores_only: boolean;
    allowed_price_types: string[] | null;
  }> = [];
  preferenceRows = new Map<string, { preferred_currency: string; favorite_stores: string[]; notification_channels: string[]; algorithm_choice: string }>();
  passwordCredentialRows = new Map<string, { password_hash: string; algorithm: string; changed_at: string }>();
  passwordChangeRows: Array<{ id: string; user_id: string; changed_at: string }> = [];
  stockUpRows: StockUpListTestRow[] = [];

  isConfigured(): boolean {
    return this.configured;
  }

  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    this.calls.push({ sql, params });
    if (sql.includes('insert into app_users')) return [] as T[];
    if (sql.includes('insert into user_preferences')) {
      const userId = params[0] as string;
      const existing = this.preferenceRows.get(userId) ?? { preferred_currency: 'SEK', favorite_stores: [], notification_channels: [], algorithm_choice: 'balanced' };
      this.preferenceRows.set(userId, {
        preferred_currency: (params[1] as string | null) ?? existing.preferred_currency,
        notification_channels: (params[2] as string[] | null) ?? existing.notification_channels,
        algorithm_choice: (params[3] as string | null) ?? existing.algorithm_choice,
        favorite_stores: (params[4] as string[] | null) ?? existing.favorite_stores
      });
      return [] as T[];
    }
    if (sql.includes('select preferred_currency, favorite_stores, notification_channels')) {
      const row = this.preferenceRows.get(params[0] as string);
      return (row ? [{
        preferred_currency: row.preferred_currency,
        favorite_stores: row.favorite_stores,
        notification_channels: row.notification_channels,
        algorithm_choice: row.algorithm_choice
      }] : []) as T[];
    }
    if (sql.includes('from password_credentials') && sql.includes('password_hash')) {
      const row = this.passwordCredentialRows.get(params[0] as string);
      return (row ? [{ password_hash: row.password_hash }] : []) as T[];
    }
    if (sql.includes('update password_credentials')) {
      const row = this.passwordCredentialRows.get(params[0] as string);
      if (!row) return [] as T[];
      this.passwordCredentialRows.set(params[0] as string, {
        password_hash: params[1] as string,
        algorithm: 'scrypt',
        changed_at: '2026-05-25T08:20:00.000Z'
      });
      return [] as T[];
    }
    if (sql.includes('insert into password_changes')) {
      this.passwordChangeRows.push({
        id: params[0] as string,
        user_id: params[1] as string,
        changed_at: '2026-05-25T08:20:00.000Z'
      });
      return [] as T[];
    }
    if (sql.includes('insert into multi_week_stock_up_rows')) {
      const row: StockUpListTestRow = {
        user_id: params[0] as string,
        row_id: params[1] as string,
        product_id: params[2] as string,
        product_name: params[3] as string,
        store_id: params[4] as string | null,
        store_name: params[5] as string,
        planning_weeks: params[6] as number,
        weekly_need_units: params[7] as number,
        package_units: params[8] as number,
        comparable_unit: params[9] as string,
        current_unit_price: params[10] as number,
        historical_low_unit_price: params[11] as number,
        typical_unit_price: params[12] as number,
        confidence: params[13] as StockUpListTestRow['confidence'],
        history_window_start: params[14] as string,
        history_window_end: params[15] as string,
        storage_limit_weeks: params[16] as number | null,
        no_forecast_reason: params[17] as string,
        review_trigger: params[18] as string,
        updated_at: '2026-05-25T08:00:00.000Z'
      };
      const existingIndex = this.stockUpRows.findIndex((candidate) => candidate.user_id === row.user_id && candidate.row_id === row.row_id);
      if (existingIndex === -1) {
        this.stockUpRows.push(row);
      } else {
        this.stockUpRows[existingIndex] = row;
      }
      return [] as T[];
    }
    if (sql.includes('update multi_week_stock_up_rows set')) {
      const row = this.stockUpRows.find((candidate) => candidate.user_id === params[0] && candidate.row_id === params[1]);
      if (!row) return [] as T[];
      const patch = {
        product_id: params[2] as string | null,
        product_name: params[3] as string | null,
        store_id: params[4] as string | null,
        store_name: params[5] as string | null,
        planning_weeks: params[6] as number | null,
        weekly_need_units: params[7] as number | null,
        package_units: params[8] as number | null,
        comparable_unit: params[9] as string | null,
        current_unit_price: params[10] as number | null,
        historical_low_unit_price: params[11] as number | null,
        typical_unit_price: params[12] as number | null,
        confidence: params[13] as StockUpListTestRow['confidence'] | null,
        history_window_start: params[14] as string | null,
        history_window_end: params[15] as string | null,
        storage_limit_weeks: params[16] as number | null,
        no_forecast_reason: params[17] as string | null,
        review_trigger: params[18] as string | null
      };
      for (const [key, value] of Object.entries(patch)) {
        if (value !== null) (row as Record<string, unknown>)[key] = value;
      }
      row.updated_at = '2026-05-25T08:10:00.000Z';
      return [row] as T[];
    }
    if (sql.includes('from multi_week_stock_up_rows')) {
      return this.stockUpRows
        .filter((row) => row.user_id === params[0])
        .sort((left, right) => right.updated_at.localeCompare(left.updated_at) || left.row_id.localeCompare(right.row_id)) as T[];
    }
    if (sql.includes('latest_prices.observation_id') && sql.includes(' as product_name')) {
      if (params[0] === 'missing-product') return [] as T[];
      return [
        {
          product_id: 'product-coffee',
          product_slug: 'coffee',
          product_name: 'Zoégas Coffee 450g',
          observation_id: 'obs-latest-coffee-willys',
          store_slug: 'willys-odenplan',
          store_name: 'Willys Odenplan',
          chain_slug: 'willys',
          chain_name: 'Willys',
          price: '49.90',
          unit_price: '110.89',
          currency: 'SEK',
          price_type: 'shelf',
          confidence: '0.9400',
          observed_at: '2026-05-21T09:00:00.000Z',
          provenance: { sourceType: 'retailer_api', sourceRunId: 'run-latest-willys' }
        },
        {
          product_id: 'product-coffee',
          product_slug: 'coffee',
          product_name: 'Zoégas Coffee 450g',
          observation_id: 'obs-latest-coffee-lidl',
          store_slug: 'lidl-sveavagen',
          store_name: 'Lidl Sveavagen',
          chain_slug: 'lidl',
          chain_name: 'Lidl',
          price: '54.90',
          unit_price: '122.00',
          currency: 'SEK',
          price_type: 'promotion',
          confidence: '0.8200',
          observed_at: '2026-05-21T08:00:00.000Z',
          provenance: { sourceType: 'retailer_page', sourceRunId: 'run-latest-lidl' }
        }
      ] as T[];
    }
    if (sql.includes('select id::text as product_id, slug as product_slug from products')) {
      if (params[0] === 'missing-product') return [] as T[];
      const slug = params[0] === 'milk' ? 'milk' : 'coffee';
      return [{ product_id: `product-${slug}`, product_slug: slug }] as T[];
    }
    if (sql.includes('select watchlist_items.product_id::text')) {
      return this.watchlistRows.map((row) => ({
        product_id: row.product_id,
        product_slug: row.product_slug,
        target_price: row.target_price,
        alert_deal_score_at: row.alert_deal_score_at,
        favorite_stores_only: row.favorite_stores_only,
        allowed_price_types: row.allowed_price_types
      })) as T[];
    }
    if (sql.includes('insert into watchlist_items')) {
      const productId = params[1] as string;
      const productSlug = productId.replace(/^product-/, '');
      this.watchlistRows.push({
        id: `watchlist-${this.watchlistRows.length + 1}`,
        product_id: productId,
        product_slug: productSlug,
        target_price: params[2] as number | null,
        alert_deal_score_at: sql.includes('null') ? null : params[3] as number | null,
        favorite_stores_only: (sql.includes('null') ? params[3] : params[4]) as boolean,
        allowed_price_types: (sql.includes('null') ? params[4] : params[5]) as string[] | null
      });
      return [] as T[];
    }
    if (sql.includes('select watchlist_items.id::text as id')) {
      const match = this.watchlistRows.find((row) => row.product_slug === params[1] || row.product_id === params[1]);
      return (match ? [{ id: match.id }] : []) as T[];
    }
    if (sql.includes('update watchlist_items')) {
      const row = this.watchlistRows.find((candidate) => candidate.id === params[0] || candidate.product_slug === params[1] || candidate.product_id === params[1]);
      if (!row) return [] as T[];
      if (sql.includes('target_price = $2')) {
        row.target_price = params[1] as number;
        row.favorite_stores_only = params[2] as boolean;
        row.allowed_price_types = params[3] as string[];
      } else {
        row.target_price = (params[2] ?? row.target_price) as number | null;
        row.alert_deal_score_at = (params[3] ?? row.alert_deal_score_at) as number | null;
        row.favorite_stores_only = (params[4] ?? row.favorite_stores_only) as boolean;
        row.allowed_price_types = (params[5] ?? row.allowed_price_types) as string[] | null;
      }
      return [{ product_slug: row.product_slug }] as T[];
    }
    if (sql.includes('delete from watchlist_items')) {
      const index = this.watchlistRows.findIndex((row) => row.product_slug === params[1] || row.product_id === params[1]);
      if (index === -1) return [] as T[];
      const [row] = this.watchlistRows.splice(index, 1);
      return [{ product_slug: row!.product_slug }] as T[];
    }
    if (sql.includes('from favorite_stores')) {
      return [] as T[];
    }
    if (sql.includes('with store_locations') && sql.includes('distance_km')) {
      return [
        {
          store_id: 'store-coop-odenplan',
          store_slug: 'coop-odenplan',
          store_name: 'Coop Odenplan',
          chain_slug: 'coop',
          chain_name: 'Coop',
          address_line1: 'Odengatan 65',
          city: 'Stockholm',
          latitude: '59.342900',
          longitude: '18.049400',
          distance_km: '1.86'
        },
        {
          store_id: 'store-ica-baronen',
          store_slug: 'ica-baronen',
          store_name: 'ICA Nära Baronen',
          chain_slug: 'ica',
          chain_name: 'ICA',
          address_line1: 'Odengatan 40',
          city: 'Stockholm',
          latitude: '59.342900',
          longitude: '18.047000',
          distance_km: '1.94'
        }
      ] as T[];
    }
    if (sql.includes('from stores') && sql.includes('where stores.slug = $1')) {
      if (params[0] === 'missing-store') return [] as T[];
      return [{
        store_slug: 'willys-odenplan',
        store_name: 'Willys Odenplan',
        chain_slug: 'willys'
      }] as T[];
    }
    if (sql.includes('from latest_prices') && sql.includes('latest_prices.price_type') && !sql.includes('current_unit_price')) {
      return [
        {
          product_slug: 'coffee',
          product_name: 'Zoégas Coffee 450g',
          store_slug: 'willys-odenplan',
          store_name: 'Willys Odenplan',
          price: '49.90',
          price_type: 'shelf',
          confidence: '0.9400'
        },
        {
          product_slug: 'coffee',
          product_name: 'Zoégas Coffee 450g',
          store_slug: 'lidl-sveavagen',
          store_name: 'Lidl Sveavagen',
          price: '54.90',
          price_type: 'promotion',
          confidence: '0.8800'
        }
      ] as T[];
    }
    if (sql.includes('with current_prices as') && sql.includes('rolling_averages')) {
      return [
        {
          product_id: 'product-private-label-milk',
          product_slug: 'private-label-milk',
          product_name: 'Garant Milk 1L',
          category_path: ['dairy'],
          store_id: 'store-willys',
          store_slug: 'willys-odenplan',
          store_name: 'Willys Odenplan',
          chain_id: 'chain-willys',
          chain_slug: 'willys',
          chain_name: 'Willys',
          current_price: '12.90',
          currency: 'SEK',
          observed_at: '2026-05-21T10:00:00.000Z',
          rolling_average_price: '19.90',
          discount_percentage: '35.18'
        },
        {
          product_id: 'product-coffee',
          product_slug: 'coffee',
          product_name: 'Zoégas Coffee 450g',
          category_path: ['coffee'],
          store_id: 'store-willys',
          store_slug: 'willys-odenplan',
          store_name: 'Willys Odenplan',
          chain_id: 'chain-willys',
          chain_slug: 'willys',
          chain_name: 'Willys',
          current_price: '49.90',
          currency: 'SEK',
          observed_at: '2026-05-21T09:00:00.000Z',
          rolling_average_price: '64.90',
          discount_percentage: '23.11'
        }
      ] as T[];
    }
    if (sql.includes('current_unit_price') && sql.includes('current_chain_prices') && !sql.includes('base_prices')) {
      return [
        {
          product_id: 'product-coffee',
          product_slug: 'bryggkaffe-450g',
          product_name: 'Bryggkaffe mellanrost 450 g',
          category_path: ['coffee'],
          chain_slug: 'willys',
          current_unit_price: '110.89',
          current_observed_at: '2026-05-21T09:00:00.000Z'
        },
        {
          product_id: 'product-coffee',
          product_slug: 'bryggkaffe-450g',
          product_name: 'Bryggkaffe mellanrost 450 g',
          category_path: ['coffee'],
          chain_slug: 'willys',
          current_unit_price: '121.50',
          current_observed_at: '2026-05-21T07:00:00.000Z'
        },
        {
          product_id: 'product-coffee',
          product_slug: 'bryggkaffe-450g',
          product_name: 'Bryggkaffe mellanrost 450 g',
          category_path: ['coffee'],
          chain_slug: 'coop',
          current_unit_price: '133.11',
          current_observed_at: '2026-05-21T08:00:00.000Z'
        },
        {
          product_id: 'product-milk',
          product_slug: 'standardmjolk-1l',
          product_name: 'Standardmjolk 3% 1 l',
          category_path: ['dairy'],
          chain_slug: 'lidl',
          current_unit_price: '13.90',
          current_observed_at: '2026-05-21T09:00:00.000Z'
        },
        {
          product_id: 'product-private-label-milk',
          product_slug: 'garant-mjolk-1l',
          product_name: 'Garant Milk 1 l',
          category_path: ['dairy'],
          chain_slug: 'willys',
          current_unit_price: '12.90',
          current_observed_at: '2026-05-21T10:00:00.000Z'
        }
      ] as T[];
    }
    if (sql.includes('with current_prices as') && sql.includes('base_prices as')) {
      return [
        {
          product_id: 'product-coffee',
          product_slug: 'bryggkaffe-450g',
          product_name: 'Bryggkaffe mellanrost 450 g',
          brand: 'Zoegas',
          private_label_owner: null,
          category_path: ['coffee'],
          chain_slug: 'willys',
          current_unit_price: '110.89',
          current_observed_at: '2026-05-21T09:00:00.000Z',
          base_unit_price: '133.11',
          base_observed_at: '2026-05-01T09:00:00.000Z'
        },
        {
          product_id: 'product-milk',
          product_slug: 'standardmjolk-1l',
          product_name: 'Standardmjolk 3% 1 l',
          brand: 'Arla',
          private_label_owner: null,
          category_path: ['dairy'],
          chain_slug: 'lidl',
          current_unit_price: '13.90',
          current_observed_at: '2026-05-21T09:00:00.000Z',
          base_unit_price: '16.90',
          base_observed_at: '2026-05-01T09:00:00.000Z'
        },
        {
          product_id: 'product-private-label-milk',
          product_slug: 'garant-mjolk-1l',
          product_name: 'Garant Milk 1 l',
          brand: 'Garant',
          private_label_owner: 'Axfood',
          category_path: ['dairy'],
          chain_slug: 'willys',
          current_unit_price: '12.90',
          current_observed_at: '2026-05-21T10:00:00.000Z',
          base_unit_price: '19.90',
          base_observed_at: '2026-05-02T09:00:00.000Z'
        }
      ] as T[];
    }
    if (sql.includes('latest_prices.price') && sql.includes('products.comparable_unit')) {
      if (params[0] === 'missing-product') return [] as T[];
      return [
        {
          product_id: 'product-coffee',
          product_slug: 'bryggkaffe-450g',
          product_name: 'Bryggkaffe mellanrost 450 g',
          category_path: ['coffee'],
          comparable_unit: 'kg',
          price: '49.90',
          unit_price: '110.89',
          currency: 'SEK',
          observed_at: '2026-05-21T09:00:00.000Z',
          chain_slug: 'willys',
          chain_name: 'Willys',
          store_slug: 'willys-odenplan',
          store_name: 'Willys Odenplan'
        },
        {
          product_id: 'product-coffee',
          product_slug: 'bryggkaffe-450g',
          product_name: 'Bryggkaffe mellanrost 450 g',
          category_path: ['coffee'],
          comparable_unit: 'kg',
          price: '59.90',
          unit_price: '133.11',
          currency: 'SEK',
          observed_at: '2026-05-21T08:00:00.000Z',
          chain_slug: 'lidl',
          chain_name: 'Lidl',
          store_slug: 'lidl-sveavagen',
          store_name: 'Lidl Sveavagen'
        },
        {
          product_id: 'product-coffee',
          product_slug: 'bryggkaffe-450g',
          product_name: 'Bryggkaffe mellanrost 450 g',
          category_path: ['coffee'],
          comparable_unit: 'kg',
          price: '64.90',
          unit_price: '144.22',
          currency: 'SEK',
          observed_at: '2026-05-21T07:00:00.000Z',
          chain_slug: 'coop',
          chain_name: 'Coop',
          store_slug: 'coop-odenplan',
          store_name: 'Coop Odenplan'
        }
      ] as T[];
    }
    if (sql.includes('from products')) {
      if (params[0] === 'missing-product') return [] as T[];
      return [{
        id: 'product-coffee',
        slug: 'bryggkaffe-450g',
        canonical_name: 'Bryggkaffe mellanrost 450 g'
      }] as T[];
    }
    if (sql.includes("observations.price_type in ('promotion', 'member')")) {
      return [
        {
          observation_id: 'obs-flyer-coffee',
          source_run_id: 'run-weekly-leaflet',
          raw_record_id: 'raw-weekly-leaflet',
          price_type: 'promotion',
          price: '49.90',
          regular_price: '64.90',
          currency: 'SEK',
          promotion_text: 'Weekly leaflet',
          promotion_starts_on: '2026-05-19',
          promotion_ends_on: '2026-05-25',
          member_required: false,
          observed_at: '2026-05-19T06:30:00.000Z',
          valid_from: '2026-05-19T00:00:00.000Z',
          valid_until: '2026-05-25T21:59:59.000Z',
          confidence: '0.9200',
          provenance: { sourceUrl: 'https://example.test/willys/flyer' },
          product_id: 'product-coffee',
          product_slug: 'coffee',
          product_name: 'Zoégas Coffee 450g',
          category_path: ['coffee'],
          chain_id: 'chain-willys',
          chain_slug: 'willys',
          chain_name: 'Willys',
          store_id: 'store-willys',
          store_slug: 'willys-odenplan',
          store_name: 'Willys Odenplan',
          store_city: 'Stockholm'
        },
        {
          observation_id: 'obs-flyer-private-label-milk',
          source_run_id: 'run-weekly-leaflet',
          raw_record_id: 'raw-weekly-leaflet-milk',
          price_type: 'member',
          price: '12.90',
          regular_price: '19.90',
          currency: 'SEK',
          promotion_text: 'Member weekly leaflet',
          promotion_starts_on: '2026-05-19',
          promotion_ends_on: '2026-05-25',
          member_required: true,
          observed_at: '2026-05-19T06:30:00.000Z',
          valid_from: '2026-05-19T00:00:00.000Z',
          valid_until: '2026-05-25T21:59:59.000Z',
          confidence: '0.8800',
          provenance: { sourceUrl: 'https://example.test/willys/flyer' },
          product_id: 'product-private-label-milk',
          product_slug: 'private-label-milk',
          product_name: 'Garant Milk 1L',
          category_path: ['dairy'],
          chain_id: 'chain-willys',
          chain_slug: 'willys',
          chain_name: 'Willys',
          store_id: 'store-willys',
          store_slug: 'willys-odenplan',
          store_name: 'Willys Odenplan',
          store_city: 'Stockholm'
        }
      ] as T[];
    }
    if (sql.includes('screener_discount_history')) {
      const minDiscount = Number(params[0]);
      const category = params[1] as string | null;
      const limit = Number(params[2]);
      const rows = [
        {
          product_id: 'product-private-label-milk',
          product_slug: 'private-label-milk',
          product_name: 'Garant Milk 1L',
          brand: 'Garant',
          category_label: 'dairy',
          chain_slug: 'willys',
          chain_name: 'Willys',
          store_slug: 'willys-odenplan',
          store_name: 'Willys Odenplan',
          latest_price: '12.90',
          previous_price: '19.90',
          savings_amount: '7.00',
          discount_percent: '35.18',
          currency: 'SEK',
          latest_observed_at: '2026-05-21T10:00:00.000Z',
          observation_count: '4'
        },
        {
          product_id: 'product-coffee',
          product_slug: 'coffee',
          product_name: 'Zoégas Coffee 450g',
          brand: 'Zoégas',
          category_label: 'coffee',
          chain_slug: 'willys',
          chain_name: 'Willys',
          store_slug: 'willys-odenplan',
          store_name: 'Willys Odenplan',
          latest_price: '49.90',
          previous_price: '59.90',
          savings_amount: '10.00',
          discount_percent: '16.69',
          currency: 'SEK',
          latest_observed_at: '2026-05-21T09:00:00.000Z',
          observation_count: '3'
        }
      ];
      return rows
        .filter((row) => Number(row.discount_percent) >= minDiscount)
        .filter((row) => category === null || row.category_label === category)
        .slice(0, limit) as T[];
    }
    if (sql.includes('from observations')) {
      return [
        {
          id: 'obs-coffee-new',
          chain_id: 'chain-willys',
          store_id: 'store-willys',
          source_run_id: 'run-open-prices-2',
          raw_record_id: 'raw-coffee-new',
          retailer_product_ref: 'willys-coffee-450g',
          price_type: 'shelf',
          price: '49.90',
          regular_price: '59.90',
          unit_price: '110.89',
          currency: 'SEK',
          quantity: '450',
          quantity_unit: 'g',
          promotion_text: null,
          promotion_starts_on: null,
          promotion_ends_on: null,
          member_required: false,
          observed_at: '2026-05-19T09:00:00.000Z',
          valid_from: null,
          valid_until: null,
          confidence: '0.9400',
          provenance: { source: 'open_prices', rawSnapshotRef: 's3://raw/coffee-new.html' }
        },
        {
          id: 'obs-coffee-old',
          chain_id: 'chain-willys',
          store_id: 'store-willys',
          source_run_id: 'run-open-prices-1',
          raw_record_id: 'raw-coffee-old',
          retailer_product_ref: 'willys-coffee-450g',
          price_type: 'shelf',
          price: '59.90',
          regular_price: null,
          unit_price: '133.11',
          currency: 'SEK',
          quantity: '450',
          quantity_unit: 'g',
          promotion_text: null,
          promotion_starts_on: null,
          promotion_ends_on: null,
          member_required: false,
          observed_at: '2026-05-01T09:00:00.000Z',
          valid_from: null,
          valid_until: null,
          confidence: '0.9100',
          provenance: { source: 'open_prices', rawSnapshotRef: 's3://raw/coffee-old.html' }
        }
      ] as T[];
    }
    return [] as T[];
  }
}

class UnconfiguredPostgresExecutor {
  isConfigured(): boolean {
    return false;
  }

  async query<T>(): Promise<T[]> {
    throw new Error('Unexpected PostgreSQL query without DATABASE_URL.');
  }
}

type StockUpListTestRow = {
  row_id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  store_id: string | null;
  store_name: string;
  planning_weeks: number;
  weekly_need_units: number;
  package_units: number;
  comparable_unit: string;
  current_unit_price: number;
  historical_low_unit_price: number;
  typical_unit_price: number;
  confidence: 'high' | 'medium' | 'low';
  history_window_start: string;
  history_window_end: string;
  storage_limit_weeks: number | null;
  no_forecast_reason: string;
  review_trigger: string;
  updated_at: string;
};

describe('GroceryView API app', () => {
  let app: INestApplication;
  let priceHistoryExecutor: RecordingPriceHistoryExecutor;
  let previousAuthSecret: string | undefined;

  beforeEach(async () => {
    previousAuthSecret = process.env.AUTH_SECRET;
    priceHistoryExecutor = new RecordingPriceHistoryExecutor();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(PostgresQueryExecutorService)
      .useValue(priceHistoryExecutor)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    if (previousAuthSecret === undefined) {
      delete process.env.AUTH_SECRET;
    } else {
      process.env.AUTH_SECRET = previousAuthSecret;
    }
  });

  it('keeps committed OpenAPI YAML in sync with the generated Nest document', async () => {
    const generated = createOpenApiYaml(app);
    const committed = await readFile(resolve(process.cwd(), 'docs/openapi.yaml'), 'utf8');
    assert.equal(committed, generated);
  });


  it('handles CORS preflight for production and local development origins with credentials', async () => {
    const productionPreflight = await request(app.getHttpServer())
      .options('/health')
      .set('Origin', 'https://groceryview.se')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'authorization,content-type,x-groceryview-locale')
      .expect(204);

    assert.equal(productionPreflight.headers['access-control-allow-origin'], 'https://groceryview.se');
    assert.equal(productionPreflight.headers['access-control-allow-credentials'], 'true');
    assert.match(productionPreflight.headers['access-control-allow-methods'] ?? '', /GET/);
    assert.match(productionPreflight.headers['access-control-allow-headers'] ?? '', /authorization/i);
    assert.match(productionPreflight.headers['access-control-allow-headers'] ?? '', /content-type/i);
    assert.match(productionPreflight.headers['access-control-allow-headers'] ?? '', /x-groceryview-locale/i);

    const localResponse = await request(app.getHttpServer())
      .get('/health')
      .set('Origin', 'http://localhost:3000')
      .expect(200);

    assert.equal(localResponse.headers['access-control-allow-origin'], 'http://localhost:3000');
    assert.equal(localResponse.headers['access-control-allow-credentials'], 'true');
  });

  it('does not expose CORS trust headers to blocked origins', async () => {
    const blockedPreflight = await request(app.getHttpServer())
      .options('/health')
      .set('Origin', 'https://evil.example')
      .set('Access-Control-Request-Method', 'GET')
      .expect(404);

    assert.equal(blockedPreflight.headers['access-control-allow-origin'], undefined);
    assert.equal(blockedPreflight.headers['access-control-allow-credentials'], undefined);
  });

  it('serves health and OpenAPI docs', async () => {
    const health = await request(app.getHttpServer()).get('/health').expect(200);
    assert.equal(health.body.status, 'ok');
    assert.equal(health.body.database.ok, true);
    assert.equal(health.body.version, '0.1.0');

    const docs = await request(app.getHttpServer()).get('/api-json').expect(200);
    assert.equal(docs.body.info.title, 'GroceryView API');
    assert.ok(docs.body.paths['/categories']);
    assert.ok(docs.body.paths['/categories/{category}/market']);
    assert.ok(docs.body.paths['/users/demo/account/subscription-access']);
    assert.ok(docs.body.paths['/users/demo/account/subscription-entitlement']);
    assert.ok(docs.body.paths['/users/demo/budget/summary']);
    assert.ok(docs.body.paths['/users/demo/budget/categories']);
    assert.ok(docs.body.paths['/users/demo/ads/disclosure']);
    assert.ok(docs.body.paths['/users/demo/expiry-deals/radar']);
    assert.ok(docs.body.paths['/deals']);
    assert.ok(docs.body.paths['/deals/discounts']);
    assert.ok(docs.body.paths['/deals/flyer-offers']);
    assert.ok(docs.body.paths['/health']);
    assert.ok(docs.body.paths['/users/demo/households/current']);
    assert.ok(docs.body.paths['/indices']);
    assert.ok(docs.body.paths['/indices/chains']);
    assert.ok(docs.body.paths['/indices/categories']);
    assert.ok(docs.body.paths['/indices/brands']);
    assert.ok(docs.body.paths['/indices/{id}']);
    assert.ok(docs.body.paths['/market/overview']);
    assert.ok(docs.body.paths['/users/demo/loyalty/offers']);
    assert.ok(docs.body.paths['/users/demo/meal-plans/suggestions']);
    assert.ok(docs.body.paths['/nutrition/value']);
    assert.ok(docs.body.paths['/users/demo/pantry/replenishment']);
    assert.ok(docs.body.paths['/prices/freshness']);
    assert.ok(docs.body.paths['/screener']);
    assert.ok(docs.body.paths['/users/demo/privacy/export']);
    assert.ok(docs.body.paths['/users/demo/privacy/deletion-plan']);
    assert.ok(docs.body.paths['/users/demo/settings/account']);
    assert.ok(docs.body.paths['/users/demo/settings/data-export']);
    assert.ok(docs.body.paths['/api/settings']);
    assert.deepEqual(docs.body.paths['/api/settings'].get.security, [{ bearer: [] }]);
    assert.deepEqual(docs.body.paths['/api/settings'].patch.security, [{ bearer: [] }]);
    assert.ok(docs.body.paths['/api/settings/profile/password']);
    assert.deepEqual(docs.body.paths['/api/settings/profile/password'].patch.security, [{ bearer: [] }]);
    assert.ok(docs.body.paths['/products']);
    assert.equal(
      docs.body.paths['/products/{id}'].get.responses['200'].content['application/json'].schema.$ref,
      '#/components/schemas/ProductDetailDto'
    );
    assert.ok(docs.body.components.schemas.ProductDetailDto.properties.priceComparison);
    assert.deepEqual(docs.body.components.schemas.ProductDetailDto.required.includes('priceComparison'), true);
    assert.ok(docs.body.components.schemas.ProductPriceComparisonDto.properties.stores);
    assert.ok(docs.body.components.schemas.ProductPriceComparisonDto.properties.cheapestStore);
    assert.ok(docs.body.paths['/products/{productId}/cheapest-now']);
    assert.ok(docs.body.paths['/products/{id}/terminal']);
    assert.ok(docs.body.paths['/products/{id}/spread']);
    assert.ok(docs.body.paths['/products/{id}/store-savings']);
    assert.ok(docs.body.paths['/products/{id}/history-summary']);
    assert.ok(docs.body.paths['/products/{id}/history-confidence']);
    assert.ok(docs.body.paths['/products/{id}/deal-score']);
    assert.ok(docs.body.paths['/products/{id}/equivalents']);
    assert.ok(docs.body.paths['/products/{id}/history']);
    assert.ok(docs.body.paths['/products/{productId}/price-history']);
    assert.ok(docs.body.paths['/products/{productId}/history.csv']);
    assert.ok(docs.body.paths['/users/demo/receipts/review']);
    assert.ok(docs.body.paths['/retailers']);
    assert.ok(docs.body.paths['/stores']);
    assert.ok(docs.body.paths['/stores/nearest']);
    assert.ok(docs.body.paths['/users/demo/basket/items/{productId}']);
    assert.ok(docs.body.paths['/stores/{id}/category-coverage']);
    assert.ok(docs.body.paths['/stores/{id}/coverage']);
    assert.ok(docs.body.paths['/stores/{id}/deal-summary']);
    assert.ok(docs.body.paths['/stores/{id}/deals']);
    assert.ok(docs.body.paths['/stores/{id}/discounts']);
    assert.ok(docs.body.paths['/stores/{id}/flyer-offers']);
    assert.ok(docs.body.paths['/users/demo/favorite-stores']);
    assert.ok(docs.body.paths['/users/demo/favorite-stores/{storeId}']);
    assert.ok(docs.body.paths['/users/demo/watchlist/{productId}']);
    assert.ok(docs.body.paths['/users/demo/watchlist/{productId}'].patch);
    assert.ok(docs.body.paths['/users/demo/watchlist/price-alerts']);
    assert.ok(docs.body.paths['/users/demo/alerts/inbox']);
    assert.ok(docs.body.paths['/users/demo/basket/local-offers']);
    assert.ok(docs.body.paths['/users/demo/basket/recurring-digest']);
    assert.ok(docs.body.paths['/users/demo/basket/trip-cost']);
    assert.ok(docs.body.paths['/users/demo/basket/fulfillment-slots/{retailerId}/{storeId}']);
    assert.ok(docs.body.paths['/users/demo/basket/handoff/{retailerId}']);
    assert.ok(docs.body.paths['/users/demo/basket/transfer/{retailerId}']);
    assert.ok(docs.body.paths['/users/demo/basket/import-export']);
    assert.ok(docs.body.paths['/users/demo/basket/import-review']);
    assert.ok(docs.body.paths['/users/demo/basket/import-review/{reviewItemId}/decisions']);
    assert.ok(docs.body.paths['/users/demo/basket/stores/{storeId}/quote']);
    assert.ok(docs.body.paths['/users/{userId}/basket/stock-up-list']);
    assert.ok(docs.body.paths['/users/{userId}/basket/stock-up-list/rows']);
    assert.ok(docs.body.paths['/users/{userId}/basket/stock-up-list/rows/{rowId}']);
    assert.deepEqual(docs.body.paths['/users/{userId}/basket/stock-up-list'].get.security, [{ bearer: [] }]);
  });

  it('saves authenticated user settings preferences through PATCH /api/settings', async () => {
    process.env.AUTH_SECRET = 'test-auth-secret';
    const token = await createSessionToken({ userId: 'user-settings-1', expiresAt: '2099-01-01T00:00:00.000Z' }, 'test-auth-secret');

    await request(app.getHttpServer())
      .patch('/api/settings')
      .send({ currency: 'EUR', preferredStores: ['willys-odenplan', 'lidl-sveavagen'], notificationChannels: ['push', 'email'] })
      .expect(401);

    const response = await request(app.getHttpServer())
      .patch('/api/settings')
      .set('authorization', `Bearer ${token}`)
      .send({ currency: 'EUR', preferredStores: ['willys-odenplan', 'lidl-sveavagen'], notificationChannels: ['push', 'email'] })
      .expect(200);

    assert.deepEqual(response.body, {
      userId: 'user-settings-1',
      currency: 'EUR',
      preferredStores: ['willys-odenplan', 'lidl-sveavagen'],
      notificationChannels: ['push', 'email'],
      algorithm_choice: 'balanced'
    });
    assert.ok(priceHistoryExecutor.calls.some((call) => call.sql.includes('insert into user_preferences') && call.params[0] === 'user-settings-1'));
    assert.deepEqual(
      priceHistoryExecutor.calls
        .filter((call) => call.sql.includes('insert into user_preferences'))
        .map((call) => call.params),
      [['user-settings-1', 'EUR', ['push', 'email'], null, ['willys-odenplan', 'lidl-sveavagen']]]
    );

    await request(app.getHttpServer())
      .patch('/api/settings')
      .set('authorization', `Bearer ${token}`)
      .send({ notificationChannels: ['sms'] })
      .expect(400);

    await request(app.getHttpServer())
      .patch('/api/settings')
      .set('authorization', `Bearer ${token}`)
      .send({ preferredStores: ['one', 'two', 'three', 'four', 'five', 'six'] })
      .expect(400);
  });

  it('verifies and persists authenticated profile password changes', async () => {
    process.env.AUTH_SECRET = 'test-auth-secret';
    const token = await createSessionToken({ userId: 'user-password-1', expiresAt: '2099-01-01T00:00:00.000Z' }, 'test-auth-secret');
    priceHistoryExecutor.passwordCredentialRows.set('user-password-1', {
      password_hash: await hashPassword('current-password-1'),
      algorithm: 'scrypt',
      changed_at: '2026-05-25T08:00:00.000Z'
    });

    await request(app.getHttpServer())
      .patch('/api/settings/profile/password')
      .send({ currentPassword: 'current-password-1', newPassword: 'next-password-1' })
      .expect(401);

    await request(app.getHttpServer())
      .patch('/api/settings/profile/password')
      .set('authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrong-password', newPassword: 'next-password-1' })
      .expect(401);

    await request(app.getHttpServer())
      .patch('/api/settings/profile/password')
      .set('authorization', `Bearer ${token}`)
      .send({ currentPassword: 'current-password-1', newPassword: 'current-password-1' })
      .expect(400);

    const response = await request(app.getHttpServer())
      .patch('/api/settings/profile/password')
      .set('authorization', `Bearer ${token}`)
      .send({ currentPassword: 'current-password-1', newPassword: 'next-password-1' })
      .expect(200);

    assert.deepEqual(response.body, { userId: 'user-password-1', passwordChanged: true });
    const credential = priceHistoryExecutor.passwordCredentialRows.get('user-password-1');
    assert.ok(credential);
    assert.equal((await verifyPasswordHash('current-password-1', credential.password_hash)).valid, false);
    assert.equal((await verifyPasswordHash('next-password-1', credential.password_hash)).valid, true);
    assert.equal(priceHistoryExecutor.passwordChangeRows.length, 1);
    assert.equal(priceHistoryExecutor.passwordChangeRows[0]?.user_id, 'user-password-1');
  });

  it('reads authenticated user settings preferences through GET /api/settings', async () => {
    process.env.AUTH_SECRET = 'test-auth-secret';
    const token = await createSessionToken({ userId: 'user-settings-read-1', expiresAt: '2099-01-01T00:00:00.000Z' }, 'test-auth-secret');

    await request(app.getHttpServer()).get('/api/settings').expect(401);

    const defaultResponse = await request(app.getHttpServer())
      .get('/api/settings')
      .set('authorization', `Bearer ${token}`)
      .expect(200);

    assert.deepEqual(defaultResponse.body, {
      userId: 'user-settings-read-1',
      currency: 'SEK',
      preferredStores: [],
      notificationChannels: [],
      algorithm_choice: 'balanced'
    });

    priceHistoryExecutor.preferenceRows.set('user-settings-read-1', {
      preferred_currency: 'NOK',
      favorite_stores: ['willys-odenplan', 'lidl-sveavagen'],
      notification_channels: ['email', 'telegram'],
      algorithm_choice: 'watchlist_first'
    });

    const response = await request(app.getHttpServer())
      .get('/api/settings')
      .set('authorization', `Bearer ${token}`)
      .expect(200);

    assert.deepEqual(response.body, {
      userId: 'user-settings-read-1',
      currency: 'NOK',
      preferredStores: ['willys-odenplan', 'lidl-sveavagen'],
      notificationChannels: ['email', 'telegram'],
      algorithm_choice: 'watchlist_first'
    });
    assert.equal(priceHistoryExecutor.calls.some((call) => call.sql.includes('insert into user_preferences')), false);

    priceHistoryExecutor.configured = false;
    await request(app.getHttpServer())
      .get('/api/settings')
      .set('authorization', `Bearer ${token}`)
      .expect(503);
  });

  it('persists signed-in multi-week stock-up rows with observed historical price guardrails', async () => {
    process.env.AUTH_SECRET = 'test-auth-secret';
    const token = await createSessionToken({ userId: 'stock-user-1', expiresAt: '2099-01-01T00:00:00.000Z' }, 'test-auth-secret');
    const otherToken = await createSessionToken({ userId: 'stock-user-2', expiresAt: '2099-01-01T00:00:00.000Z' }, 'test-auth-secret');

    await request(app.getHttpServer()).get('/users/stock-user-1/basket/stock-up-list').expect(401);
    await request(app.getHttpServer())
      .get('/users/stock-user-1/basket/stock-up-list')
      .set('authorization', `Bearer ${otherToken}`)
      .expect(403);

    const created = await request(app.getHttpServer())
      .post('/users/stock-user-1/basket/stock-up-list/rows')
      .set('authorization', `Bearer ${token}`)
      .send({
        rowId: 'coffee-stock-up',
        productId: 'coffee',
        productName: 'Zoégas Coffee 450g',
        storeName: 'Willys Odenplan',
        planningWeeks: 4,
        weeklyNeedUnits: 1,
        packageUnits: 0.45,
        comparableUnit: 'kg',
        currentUnitPrice: 110.89,
        historicalLowUnitPrice: 99.9,
        typicalUnitPrice: 133.11,
        confidence: 'high',
        historyWindowStart: '2026-04-01T00:00:00.000Z',
        historyWindowEnd: '2026-05-21T00:00:00.000Z',
        noForecastReason: 'Historical low and typical prices are observed facts only; no future shelf price is predicted.',
        reviewTrigger: 'Re-check observed prices before restocking.'
      })
      .expect(201);

    assert.equal(created.body.userId, 'stock-user-1');
    assert.equal(created.body.itemCount, 1);
    assert.equal(created.body.rows[0].rowId, 'coffee-stock-up');
    assert.equal(created.body.rows[0].historicalLowUnitPrice, 99.9);
    assert.equal(created.body.rows[0].confidence, 'high');
    assert.equal(created.body.evidence.noForecast, true);
    assert.deepEqual(created.body.evidence.sourceTables, [
      'multi_week_stock_up_rows',
      'weekly_baskets',
      'basket_items',
      'products',
      'latest_prices',
      'observations',
      'app_users'
    ]);
    assert.ok(created.body.guardrails.some((guardrail: string) => /no future price forecast/i.test(guardrail)));

    const updated = await request(app.getHttpServer())
      .patch('/users/stock-user-1/basket/stock-up-list/rows/coffee-stock-up')
      .set('authorization', `Bearer ${token}`)
      .send({ planningWeeks: 6, confidence: 'medium', reviewTrigger: 'Review when the verified historical window changes.' })
      .expect(200);

    assert.equal(updated.body.rows[0].planningWeeks, 6);
    assert.equal(updated.body.rows[0].confidence, 'medium');
    assert.equal(updated.body.rows[0].currentUnitPrice, 110.89);
    assert.match(updated.body.rows[0].reviewTrigger, /verified historical window/);

    priceHistoryExecutor.configured = false;
    await request(app.getHttpServer())
      .get('/users/stock-user-1/basket/stock-up-list')
      .set('authorization', `Bearer ${token}`)
      .expect(503);
  });

  it('serves products, stores, prices, watchlists, baskets, and alerts', async () => {
    const market = await request(app.getHttpServer()).get('/market/overview').expect(200);
    assert.equal(market.body.city, 'Stockholm');
    assert.equal(market.body.demo, true);
    assert.equal(market.body.movers[0].productId, 'coffee');
    assert.equal(market.body.movers[0].oneMonthMovePercent, -16.7);
    assert.equal(market.body.topDeals[0].productId, 'coffee');

    const nutrition = await request(app.getHttpServer()).get('/nutrition/value?metric=protein').expect(200);
    assert.equal(nutrition.body.metric, 'protein');
    assert.equal(nutrition.body.currency, 'SEK');
    assert.equal(nutrition.body.demo, true);
    assert.equal(nutrition.body.leader.productId, 'chicken');
    assert.equal(nutrition.body.rows[0].valuePer10Sek, 22.89);
    assert.equal(nutrition.body.guardrails.length, 3);

    const subscriptionAccess = await request(app.getHttpServer())
      .get('/users/demo/account/subscription-access?now=2026-05-20T00:00:00.000Z')
      .expect(200);
    assert.equal(subscriptionAccess.body.userTier, 'free');
    assert.equal(subscriptionAccess.body.premiumFeaturesEnabled, false);
    assert.equal(subscriptionAccess.body.adsRemoved, false);
    assert.equal(subscriptionAccess.body.checkoutRequired, true);
    assert.deepEqual(subscriptionAccess.body.enforcementReasons, ['missing_subscription_entitlement']);
    assert.deepEqual(subscriptionAccess.body.accountActions, ['show_upgrade']);
    assert.equal(subscriptionAccess.body.summary, 'Free tier: no active subscription entitlement.');
    assert.equal(subscriptionAccess.body.demo, true);

    const subscriptionEntitlement = await request(app.getHttpServer()).get('/users/demo/account/subscription-entitlement').expect(200);
    assert.deepEqual(subscriptionEntitlement.body, { userId: 'demo', entitlement: null, demo: true });

    const settingsExport = await request(app.getHttpServer()).get('/users/demo/settings/data-export').expect(200);
    assert.equal(settingsExport.body.userId, 'demo');
    assert.equal(settingsExport.body.demo, true);
    assert.deepEqual(settingsExport.body.sections.map((section: { name: string }) => section.name), [
      'profile',
      'lists',
      'alerts',
      'preferences',
      'analytics_events',
      'favorite_stores',
      'watchlist',
      'receipts',
      'households',
      'friend_shared_deal_signals'
    ]);

    const settingsDeletion = await request(app.getHttpServer()).delete('/users/demo/settings/account').send({ confirmation: 'DELETE ACCOUNT' }).expect(200);
    assert.equal(settingsDeletion.body.userId, 'demo');
    assert.equal(settingsDeletion.body.deleted, false);
    assert.equal(settingsDeletion.body.destructiveAction, false);
    assert.equal(settingsDeletion.body.requiresConfirmation, 'DELETE ACCOUNT');
    assert.equal(settingsDeletion.body.demo, true);

    const mealPlan = await request(app.getHttpServer())
      .get('/users/demo/meal-plans/suggestions?maxMealCost=120&servings=4')
      .expect(200);
    assert.equal(mealPlan.body.userId, 'demo');
    assert.equal(mealPlan.body.currency, 'SEK');
    assert.equal(mealPlan.body.maxMealCost, 120);
    assert.equal(mealPlan.body.servings, 4);
    assert.equal(mealPlan.body.dealCount, 4);
    assert.deepEqual(mealPlan.body.ingredientProductIds, ['chicken', 'pasta', 'tomatoes']);
    assert.equal(mealPlan.body.suggestions[0].title, 'Chicken thighs pasta bowl');
    assert.equal(mealPlan.body.suggestions[0].estimatedCostPerServing, 26.18);
    assert.match(mealPlan.body.guardrails[0], /never update a basket/i);
    assert.equal(mealPlan.body.demo, true);

    const constrainedMealPlan = await request(app.getHttpServer())
      .get('/users/demo/meal-plans/suggestions?maxMealCost=20')
      .expect(200);
    assert.deepEqual(constrainedMealPlan.body.suggestions, []);
    assert.deepEqual(constrainedMealPlan.body.ingredientProductIds, []);

    const freshness = await request(app.getHttpServer())
      .get('/prices/freshness?asOf=2026-06-03T00:00:00.000Z')
      .expect(200);
    assert.equal(freshness.body.asOf, '2026-06-03T00:00:00.000Z');
    assert.equal(freshness.body.demo, true);
    assert.deepEqual(freshness.body.summary, { fresh: 0, aging: 0, stale: 4 });
    assert.deepEqual(freshness.body.backfillProductIds, ['butter', 'coffee', 'milk', 'private-label-milk']);

    const indices = await request(app.getHttpServer()).get('/indices').expect(200);
    assert.equal(indices.body[0].id, 'stockholm-grocery-index');
    assert.equal(indices.body[0].demo, true);

    const index = await request(app.getHttpServer()).get('/indices/stockholm-grocery-index').expect(200);
    assert.equal(index.body.label, 'Stockholm Grocery Index');
    assert.equal(index.body.demo, true);

    const chainIndices = await request(app.getHttpServer()).get('/indices/chains').expect(200);
    assert.equal(chainIndices.body.generatedFrom, 4);
    assert.equal(chainIndices.body.chains[0].chainId, 'willys');
    assert.equal(chainIndices.body.demo, undefined);
    assert.match(chainIndices.body.guardrails[0], /persisted latest_prices/i);
    assert.equal(priceHistoryExecutor.calls.some((call) => /from latest_prices/i.test(call.sql) && /join products/i.test(call.sql)), true);
    assert.equal(priceHistoryExecutor.calls.some((call) => /distinct on \(latest_prices\.product_id, latest_prices\.chain_id\)/i.test(call.sql)), true);

    const categoryIndices = await request(app.getHttpServer()).get('/indices/categories').expect(200);
    assert.deepEqual(categoryIndices.body.indices.map((row: { category: string }) => row.category), ['dairy', 'coffee']);
    assert.equal(categoryIndices.body.indices[0].value, 72.83);
    assert.equal(categoryIndices.body.demo, undefined);
    assert.match(categoryIndices.body.guardrails[0], /earliest persisted observations/i);
    assert.equal(priceHistoryExecutor.calls.some((call) => /base_prices as/i.test(call.sql) && /from observations/i.test(call.sql)), true);

    const brandIndices = await request(app.getHttpServer()).get('/indices/brands').expect(200);
    assert.deepEqual(brandIndices.body.indices.map((row: { brandTier: string }) => row.brandTier), ['standard_private_label', 'national']);
    assert.equal(brandIndices.body.privateLabelSavingsPercent, 7.19);
    assert.equal(brandIndices.body.demo, undefined);

    const products = await request(app.getHttpServer()).get('/products?q=coffee').expect(200);
    assert.equal(products.body[0].id, 'coffee');
    assert.equal(products.body[0].currentPrices[0].priceType, 'shelf');
    assert.equal(products.body[0].currentPrices[0].sourceType, 'demo_seed');
    assert.ok(products.body[0].currentPrices[0].provenance);

    const product = await request(app.getHttpServer()).get('/products/milk').expect(200);
    assert.deepEqual(product.body.priceComparison.stores.map((store: { storeId: string }) => store.storeId), ['lidl-sveavagen', 'willys-odenplan']);
    assert.equal(product.body.priceComparison.cheapestStore.storeId, 'lidl-sveavagen');

    const retailers = await request(app.getHttpServer()).get('/retailers').expect(200);
    assert.deepEqual(retailers.body.map((retailer: { id: string; name: string; logo: string; websiteUrl: string }) => [
      retailer.id,
      retailer.name,
      retailer.logo,
      retailer.websiteUrl
    ]), [
      ['city-gross', 'City Gross', '/retailers/city-gross.svg', 'https://www.citygross.se/'],
      ['coop', 'Coop', '/retailers/coop.svg', 'https://www.coop.se/'],
      ['hemkop', 'Hemköp', '/retailers/hemkop.svg', 'https://www.hemkop.se/'],
      ['ica', 'ICA', '/retailers/ica.svg', 'https://www.ica.se/'],
      ['lidl', 'Lidl', '/retailers/lidl.svg', 'https://www.lidl.se/'],
      ['netto', 'Netto', '/retailers/netto.svg', 'https://www.coop.se/'],
      ['willys', 'Willys', '/retailers/willys.svg', 'https://www.willys.se/']
    ]);

    const categories = await request(app.getHttpServer()).get('/categories').expect(200);
    assert.deepEqual(categories.body, [
      { id: 'coffee', name: 'Coffee', slug: 'coffee', parentId: null, itemCount: 1 },
      { id: 'dairy', name: 'Dairy', slug: 'dairy', parentId: null, itemCount: 3 }
    ]);

    const invalidCategories = await request(app.getHttpServer()).get('/categories?unexpected=true').expect(400);
    assert.match(invalidCategories.body.message, /unexpected query parameter/i);

    await request(app.getHttpServer()).get('/products/coffee').expect(200);
    await request(app.getHttpServer()).get('/stores/willys-odenplan').expect(200);

    const nearestStores = await request(app.getHttpServer())
      .get('/stores/nearest?lat=59.3293&lng=18.0686&radius=5&chain=coop')
      .expect(200);
    assert.deepEqual(nearestStores.body.stores.map((store: { slug: string; distanceKm: number }) => [store.slug, store.distanceKm]), [
      ['coop-odenplan', 1.86],
      ['ica-baronen', 1.94]
    ]);
    assert.equal(priceHistoryExecutor.calls.some((call) => call.params.join('|') === '59.3293|18.0686|5|coop'), true);

    const storeDeals = await request(app.getHttpServer()).get('/stores/willys-odenplan/deals').expect(200);
    assert.deepEqual(
      storeDeals.body.map((deal: { productId: string; storeId: string; dealScore: number; demo: boolean }) => ({
        productId: deal.productId,
        storeId: deal.storeId,
        dealScore: deal.dealScore,
        demo: deal.demo
      })),
      [
        { productId: 'coffee', storeId: 'willys-odenplan', dealScore: 82, demo: true },
        { productId: 'private-label-milk', storeId: 'willys-odenplan', dealScore: 73, demo: true },
        { productId: 'milk', storeId: 'willys-odenplan', dealScore: 73, demo: true },
        { productId: 'butter', storeId: 'willys-odenplan', dealScore: 40, demo: true }
      ]
    );

    const rollingDeals = await request(app.getHttpServer()).get('/deals?category=dairy').expect(200);
    assert.equal(rollingDeals.body.sortedBy, 'discount_percentage_desc');
    assert.equal(rollingDeals.body.windowDays, 30);
    assert.deepEqual(rollingDeals.body.filters, { category: 'dairy' });
    assert.deepEqual(
      rollingDeals.body.deals.map((deal: { productId: string; discountPercentage: number; currentPrice: number; rollingAveragePrice: number }) => [
        deal.productId,
        deal.discountPercentage,
        deal.currentPrice,
        deal.rollingAveragePrice
      ]),
      [
        ['product-private-label-milk', 35.18, 12.9, 19.9],
        ['product-coffee', 23.11, 49.9, 64.9]
      ]
    );
    assert.match(priceHistoryExecutor.calls.at(-1)?.sql ?? '', /interval '30 days'/i);
    assert.deepEqual(priceHistoryExecutor.calls.at(-1)?.params[1], 'dairy');

    const flyerOffers = await request(app.getHttpServer())
      .get('/deals/flyer-offers?chain=willys&asOf=2026-05-20T12:00:00.000Z')
      .expect(200);
    assert.equal(flyerOffers.body.offerCount, 2);
    assert.deepEqual(flyerOffers.body.stores.map((store: { storeId: string; offerCount: number }) => [store.storeId, store.offerCount]), [
      ['willys-odenplan', 2]
    ]);
    assert.deepEqual(
      flyerOffers.body.offers.map((offer: { offerId: string; productId: string; savings: number; sourceType: string }) => [
        offer.offerId,
        offer.productId,
        offer.savings,
        offer.sourceType
      ]),
      [
        ['obs-flyer-private-label-milk', 'private-label-milk', 7, 'weekly_flyer'],
        ['obs-flyer-coffee', 'coffee', 15, 'weekly_flyer']
      ]
    );
    assert.equal(flyerOffers.body.offers[0].sourceRunId, 'run-weekly-leaflet');

    const storeFlyerOffers = await request(app.getHttpServer())
      .get('/stores/willys-odenplan/flyer-offers?asOf=2026-05-20T12:00:00.000Z')
      .expect(200);
    assert.equal(storeFlyerOffers.body.storeId, 'willys-odenplan');
    assert.equal(storeFlyerOffers.body.bestOffer.productId, 'private-label-milk');
    assert.equal(storeFlyerOffers.body.totalOneEachSavings, 22);
    assert.equal(storeFlyerOffers.body.demo, undefined);
    assert.equal(priceHistoryExecutor.calls.some((call) => /from stores/i.test(call.sql) && /join chains/i.test(call.sql)), true);

    const discounts = await request(app.getHttpServer())
      .get('/deals/discounts?chain=willys&asOf=2026-05-20T12:00:00.000Z')
      .expect(200);
    assert.deepEqual(discounts.body.offers.map((offer: { offerId: string }) => offer.offerId), [
      'obs-flyer-private-label-milk',
      'obs-flyer-coffee'
    ]);
    assert.equal(discounts.body.offers[0].sourceType, 'weekly_flyer');
    assert.equal(discounts.body.demo, undefined);


    const screener = await request(app.getHttpServer())
      .get('/screener?min_discount=20&category=dairy')
      .expect(200);
    assert.equal(screener.body.minDiscountPercent, 20);
    assert.equal(screener.body.category, 'dairy');
    assert.equal(screener.body.source, 'price_history');
    assert.deepEqual(screener.body.items.map((item: { productSlug: string }) => item.productSlug), ['private-label-milk']);
    assert.equal(screener.body.items[0].discountPercent, 35.18);
    assert.match(screener.body.guardrails[0], /price_history/i);
    const screenerCall = priceHistoryExecutor.calls.find((call) => call.sql.includes('screener_discount_history'));
    assert.ok(screenerCall, 'screener API should query price_history discount history');
    assert.match(screenerCall.sql, /with price_history as/i);
    assert.match(screenerCall.sql, /from observations/i);
    assert.match(screenerCall.sql, /discount_percent >= \$1/i);
    assert.deepEqual(screenerCall.params, [20, 'dairy', 25]);

    const storeDiscounts = await request(app.getHttpServer())
      .get('/stores/willys-odenplan/discounts?asOf=2026-05-20T12:00:00.000Z')
      .expect(200);
    assert.equal(storeDiscounts.body.storeId, 'willys-odenplan');
    assert.equal(storeDiscounts.body.offerCount, 2);
    assert.equal(storeDiscounts.body.demo, undefined);

    const prices = await request(app.getHttpServer()).get('/products/coffee/prices').expect(200);
    assert.equal(prices.body[0].currency, 'SEK');
    assert.equal(prices.body[0].confidence, 'high');
    assert.deepEqual(
      prices.body.map((price: { observationId: string; storeId: string; price: number; priceType: string; sourceType: string }) => ({
        observationId: price.observationId,
        storeId: price.storeId,
        price: price.price,
        priceType: price.priceType,
        sourceType: price.sourceType
      })),
      [
        {
          observationId: 'obs-latest-coffee-willys',
          storeId: 'willys-odenplan',
          price: 49.9,
          priceType: 'shelf',
          sourceType: 'retailer_api'
        },
        {
          observationId: 'obs-latest-coffee-lidl',
          storeId: 'lidl-sveavagen',
          price: 54.9,
          priceType: 'promotion',
          sourceType: 'retailer_page'
        }
      ]
    );
    assert.equal(prices.body[0].demo, undefined);
    assert.match(priceHistoryExecutor.calls.at(-1)?.sql ?? '', /from products/i);
    assert.match(priceHistoryExecutor.calls.at(-1)?.sql ?? '', /latest_prices/i);

    const priceHistory = await request(app.getHttpServer())
      .get('/products/bryggkaffe-450g/price-history?priceType=shelf&chain=willys&store=willys-odenplan&sourceRun=run-open-prices-1&minConfidence=0.9&limit=5')
      .expect(200);
    assert.equal(priceHistory.body.productId, 'product-coffee');
    assert.equal(priceHistory.body.productSlug, 'bryggkaffe-450g');
    assert.equal(priceHistory.body.demo, undefined);
    assert.deepEqual(priceHistory.body.filters, {
      priceType: 'shelf',
      chain: 'willys',
      store: 'willys-odenplan',
      sourceRun: 'run-open-prices-1',
      minConfidence: 0.9,
      limit: 5
    });
    assert.deepEqual(priceHistory.body.points.map((point: { observationId: string }) => point.observationId), [
      'obs-coffee-old',
      'obs-coffee-new'
    ]);
    assert.equal(priceHistory.body.summary.latestPrice, 49.9);
    assert.equal(priceHistory.body.summary.changeFromPrevious, -10);
    assert.deepEqual(priceHistoryExecutor.calls.at(-1)?.params, ['product-coffee', 'shelf', 'willys', 'willys-odenplan', 'run-open-prices-1', null, null, 0.9, 5]);
    assert.match(priceHistoryExecutor.calls.at(-1)?.sql ?? '', /from observations/i);
    assert.match(priceHistoryExecutor.calls.at(-1)?.sql ?? '', /chains\.slug = \$3/);
    assert.match(priceHistoryExecutor.calls.at(-1)?.sql ?? '', /stores\.slug = \$4/);
    assert.match(priceHistoryExecutor.calls.at(-1)?.sql ?? '', /source_run_id::text = \$5/);
    assert.match(priceHistoryExecutor.calls.at(-1)?.sql ?? '', /observations\.confidence >= \$8::numeric/);

    const priceHistoryCsv = await request(app.getHttpServer())
      .get('/products/bryggkaffe-450g/history.csv?priceType=shelf&chain=willys&limit=5')
      .expect(200);
    assert.match(priceHistoryCsv.headers['content-type'], /^text\/csv/);
    assert.equal(priceHistoryCsv.headers['content-disposition'], 'attachment; filename="bryggkaffe-450g-history.csv"');
    assert.equal(
      priceHistoryCsv.text,
      [
        'date,chain,price,unit',
        '2026-05-01T09:00:00.000Z,chain-willys,59.9,133.11',
        '2026-05-19T09:00:00.000Z,chain-willys,49.9,110.89',
        ''
      ].join('\n')
    );
    assert.deepEqual(priceHistoryExecutor.calls.at(-1)?.params, ['product-coffee', 'shelf', 'willys', null, null, null, null, null, 5]);
    assert.match(priceHistoryExecutor.calls.at(-1)?.sql ?? '', /from observations/i);

    await request(app.getHttpServer())
      .get('/products/bryggkaffe-450g/price-history?from=2026-06-01T00:00:00.000Z&to=2026-05-01T00:00:00.000Z')
      .expect(400);
    await request(app.getHttpServer())
      .get('/products/bryggkaffe-450g/price-history?chain=willys%20city')
      .expect(400);
    await request(app.getHttpServer())
      .get('/products/bryggkaffe-450g/price-history?sourceRun=run/willys')
      .expect(400);
    await request(app.getHttpServer())
      .get('/products/bryggkaffe-450g/price-history?minConfidence=1.1')
      .expect(400);

    const cheapestNow = await request(app.getHttpServer()).get('/products/coffee/cheapest-now').expect(200);
    assert.equal(cheapestNow.body.cheapest.chain, 'willys');
    assert.equal(cheapestNow.body.cheapest.packagePrice, 49.9);
    assert.deepEqual(cheapestNow.body.chainPrices.map((row: { chain: string }) => row.chain), ['willys', 'lidl', 'coop']);
    assert.equal(cheapestNow.body.demo, undefined);
    assert.equal(cheapestNow.body.observedPriceCount, 3);
    assert.match(priceHistoryExecutor.calls.at(-1)?.sql ?? '', /latest_prices/i);
    assert.match(priceHistoryExecutor.calls.at(-1)?.sql ?? '', /latest_prices\.price > 0/i);
    assert.match(priceHistoryExecutor.calls.at(-1)?.sql ?? '', /latest_prices\.unit_price > 0/i);

    const terminal = await request(app.getHttpServer()).get('/products/coffee/terminal').expect(200);
    assert.equal(terminal.body.productId, 'coffee');
    assert.equal(terminal.body.ticker, 'ZOEGAS-COFFEE-450G');
    assert.equal(terminal.body.quote.bestPrice, 49.9);
    assert.deepEqual(terminal.body.distributions.map((distribution: { label: string }) => distribution.label), [
      'Whole Stockholm',
      'Odenplan local area'
    ]);
    assert.equal(terminal.body.chart.series[0].id, 'willys-odenplan:shelf');
    assert.equal(terminal.body.historySummary.isNewLow, true);
    assert.equal(terminal.body.evidenceGuardrails.length, 3);

    const spread = await request(app.getHttpServer()).get('/products/coffee/spread').expect(200);
    assert.equal(spread.body.productId, 'coffee');
    assert.equal(spread.body.currency, 'SEK');
    assert.equal(spread.body.sampleSize, 3);
    assert.equal(spread.body.bestStoreId, 'willys-odenplan');
    assert.equal(spread.body.highestStoreId, 'coop-odenplan');
    assert.equal(spread.body.spread, 15);
    assert.equal(spread.body.spreadPercent, 30.1);
    assert.deepEqual(spread.body.rows.map((row: { storeId: string; rank: number; priceLabel: string }) => ({
      storeId: row.storeId,
      rank: row.rank,
      priceLabel: row.priceLabel
    })), [
      { storeId: 'willys-odenplan', rank: 1, priceLabel: 'best' },
      { storeId: 'lidl-sveavagen', rank: 2, priceLabel: 'above_best' },
      { storeId: 'coop-odenplan', rank: 3, priceLabel: 'above_best' }
    ]);
    assert.match(spread.body.customerRead, /ranges 15.00 SEK/);
    assert.equal(spread.body.guardrails.length, 3);

    const storeSavings = await request(app.getHttpServer()).get('/products/coffee/store-savings').expect(200);
    assert.equal(storeSavings.body.productId, 'coffee');
    assert.equal(storeSavings.body.currency, 'SEK');
    assert.equal(storeSavings.body.sampleSize, 3);
    assert.equal(storeSavings.body.bestStoreId, 'willys-odenplan');
    assert.equal(storeSavings.body.highestStoreId, 'coop-odenplan');
    assert.equal(storeSavings.body.maxSavings, 15);
    assert.equal(storeSavings.body.maxSavingsPercent, 23.1);
    assert.deepEqual(
      storeSavings.body.rows.map((row: { storeId: string; rank: number; savingsVsHighest: number; priceLabel: string }) => ({
        storeId: row.storeId,
        rank: row.rank,
        savingsVsHighest: row.savingsVsHighest,
        priceLabel: row.priceLabel
      })),
      [
        { storeId: 'willys-odenplan', rank: 1, savingsVsHighest: 15, priceLabel: 'best_savings' },
        { storeId: 'lidl-sveavagen', rank: 2, savingsVsHighest: 5, priceLabel: 'saves_vs_highest' },
        { storeId: 'coop-odenplan', rank: 3, savingsVsHighest: 0, priceLabel: 'highest_price' }
      ]
    );
    assert.match(storeSavings.body.guardrails[0], /verified quotes/i);
    assert.equal(storeSavings.body.demo, true);

    const historySummary = await request(app.getHttpServer()).get('/products/coffee/history-summary').expect(200);
    assert.equal(historySummary.body.productId, 'coffee');
    assert.equal(historySummary.body.ticker, 'ZOEGAS-COFFEE-450G');
    assert.equal(historySummary.body.trend, 'new_low');
    assert.deepEqual(historySummary.body.summary, {
      latestPrice: 49.9,
      previousPrice: 59.9,
      changeFromPrevious: -10,
      lowestPrice: 49.9,
      highestPrice: 69.9,
      isNewLow: true,
      observedCount: 3,
      latestObservedAt: '2026-05-19T00:00:00.000Z'
    });
    assert.match(historySummary.body.guardrails[0], /recorded product history/i);
    assert.equal(historySummary.body.demo, true);

    const historyConfidence = await request(app.getHttpServer()).get('/products/coffee/history-confidence').expect(200);
    assert.equal(historyConfidence.body.productId, 'coffee');
    assert.equal(historyConfidence.body.ticker, 'ZOEGAS-COFFEE-450G');
    assert.deepEqual(historyConfidence.body.disclosure, {
      rangeDays: 90,
      firstObservedAt: '2026-04-01T00:00:00.000Z',
      lastObservedAt: '2026-05-19T00:00:00.000Z',
      observationCount: 3,
      sourceTypesIncluded: ['shelf'],
      sourceTypesMissing: [],
      availabilityGapCount: 0,
      hasConfirmedOutOfStock: false,
      hasEstimatedPoints: false,
      hasMemberOnlyExcluded: false,
      confidenceState: 'limited_history',
      headlineCopy: 'Limited history',
      detailCopy: 'We have observed this item for 49 days, so older lows may be missing.',
      canClaimLowestInWindow: false,
      legalCopyMode: 'observed_low_only'
    });
    assert.match(historyConfidence.body.guardrails[0], /lowest-price claim/i);
    assert.equal(historyConfidence.body.demo, true);

    const dealScore = await request(app.getHttpServer()).get('/products/coffee/deal-score?distanceKm=12.5').expect(200);
    assert.equal(dealScore.body.productId, 'coffee');
    assert.equal(dealScore.body.score, 82);
    assert.deepEqual(dealScore.body.band, { label: 'Good deal', verdict: 'Buy' });
    assert.equal(dealScore.body.verdict, 'Buy');
    assert.equal(dealScore.body.discountVsMedianPercent, 16.7);
    assert.equal(dealScore.body.historicalPercentile, 12);
    assert.equal(dealScore.body.confidence, 0.9);
    assert.match(dealScore.body.reasons[0], /Willys Odenplan/);
    assert.equal(dealScore.body.demo, true);

    const equivalents = await request(app.getHttpServer()).get('/products/milk/equivalents').expect(200);
    assert.deepEqual(
      equivalents.body.map((equivalent: { productId: string; bestStoreId: string; dealScore: number; demo: boolean }) => ({
        productId: equivalent.productId,
        bestStoreId: equivalent.bestStoreId,
        dealScore: equivalent.dealScore,
        demo: equivalent.demo
      })),
      [
        { productId: 'private-label-milk', bestStoreId: 'willys-odenplan', dealScore: 73, demo: true },
        { productId: 'butter', bestStoreId: 'coop-odenplan', dealScore: 40, demo: true }
      ]
    );

    const history = await request(app.getHttpServer()).get('/products/coffee/history').expect(200);
    assert.deepEqual(
      history.body.map((point: { productId: string; date: string; price: number; verified: boolean; demo: boolean }) => ({
        productId: point.productId,
        date: point.date,
        price: point.price,
        verified: point.verified,
        demo: point.demo
      })),
      [
        { productId: 'coffee', date: '2026-04-01', price: 69.9, verified: true, demo: true },
        { productId: 'coffee', date: '2026-05-01', price: 59.9, verified: true, demo: true },
        { productId: 'coffee', date: '2026-05-19', price: 49.9, verified: true, demo: true }
      ]
    );

    await request(app.getHttpServer())
      .post('/users/demo/watchlist')
      .send({ productId: 'coffee', targetPrice: 50, alertDealScoreAt: 80, allowedPriceTypes: ['shelf'] })
      .expect(201);
    await request(app.getHttpServer())
      .post('/users/demo/watchlist')
      .send({ productId: 'milk', alertDealScoreAt: 80, allowedPriceTypes: ['shelf'] })
      .expect(201);
    const watchlist = await request(app.getHttpServer()).get('/users/demo/watchlist').expect(200);
    assert.equal(watchlist.body.items[0].productId, 'coffee');
    assert.deepEqual(watchlist.body.items[0].allowedPriceTypes, ['shelf']);
    const priceAlerts = await request(app.getHttpServer()).get('/users/demo/watchlist/price-alerts').expect(200);
    assert.equal(priceAlerts.body.userId, 'demo');
    assert.equal(priceAlerts.body.trackedItemCount, 1);
    assert.equal(priceAlerts.body.alertCount, 1);
    assert.equal(priceAlerts.body.alerts[0].productId, 'coffee');
    assert.equal(priceAlerts.body.alerts[0].type, 'target_price');
    assert.equal(priceAlerts.body.demo, undefined);
    assert.equal(priceHistoryExecutor.calls.some((call) => /from latest_prices/i.test(call.sql)), true);
    await request(app.getHttpServer()).delete('/users/demo/watchlist/milk').expect(200);
    const createdPriceAlert = await request(app.getHttpServer())
      .post('/users/demo/watchlist/price-alerts')
      .send({ productId: 'coffee', targetPrice: 48, favoriteStoresOnly: false, allowedPriceTypes: ['shelf'] })
      .expect(201);
    assert.equal(createdPriceAlert.body.trackedItemCount, 1);
    assert.equal(createdPriceAlert.body.alertCount, 0);
    assert.equal(createdPriceAlert.body.demo, undefined);
    const watchlistUpdate = await request(app.getHttpServer())
      .patch('/users/demo/watchlist/coffee')
      .send({ targetPrice: 48, alertDealScoreAt: 85, favoriteStoresOnly: true, allowedPriceTypes: ['shelf', 'promotion'] })
      .expect(200);
    assert.equal(watchlistUpdate.body.item.productId, 'coffee');
    assert.equal(watchlistUpdate.body.item.targetPrice, 48);
    assert.equal(watchlistUpdate.body.item.alertDealScoreAt, 85);
    assert.equal(watchlistUpdate.body.item.favoriteStoresOnly, true);
    assert.deepEqual(watchlistUpdate.body.item.allowedPriceTypes, ['shelf', 'promotion']);
    assert.equal(watchlistUpdate.body.demo, undefined);
    await request(app.getHttpServer()).post('/users/demo/watchlist').send({ productId: 'milk', targetPrice: 14 }).expect(201);
    const watchlistRemoval = await request(app.getHttpServer()).delete('/users/demo/watchlist/milk').expect(200);
    assert.equal(watchlistRemoval.body.productId, 'milk');
    assert.equal(watchlistRemoval.body.removed, true);
    assert.deepEqual(
      watchlistRemoval.body.watchlist.items.map((item: { productId: string }) => item.productId),
      ['coffee']
    );
    assert.equal(watchlistRemoval.body.demo, undefined);

    await request(app.getHttpServer())
      .post('/users/demo/basket/items')
      .send({ productId: 'coffee', quantity: 2 })
      .expect(201);
    const basket = await request(app.getHttpServer()).get('/users/demo/basket').expect(200);
    assert.equal(basket.body.items[0].quantity, 2);

    await request(app.getHttpServer()).post('/users/demo/basket/items').send({ productId: 'milk', quantity: 1 }).expect(201);
    const updatedBasket = await request(app.getHttpServer())
      .patch('/users/demo/basket/items/milk')
      .send({ quantity: 2 })
      .expect(200);
    assert.deepEqual(
      updatedBasket.body.items.map((item: { productId: string; quantity: number }) => [item.productId, item.quantity]),
      [
        ['coffee', 2],
        ['milk', 2]
      ]
    );

    const basketAfterRemoval = await request(app.getHttpServer()).delete('/users/demo/basket/items/milk').expect(200);
    assert.deepEqual(basketAfterRemoval.body.items, [{ productId: 'coffee', quantity: 2 }]);

    const budget = await request(app.getHttpServer()).get('/users/demo/budget/summary').expect(200);
    assert.equal(budget.body.weeklyBudget, 0);
    assert.equal(budget.body.monthlyBudget, 0);
    assert.equal(budget.body.estimatedBasketTotal, 99.8);
    assert.equal(budget.body.weeklyActualSpend, 0);
    assert.equal(budget.body.monthlyActualSpend, 0);
    assert.equal(budget.body.weeklyRemainingAfterEstimate, -99.8);
    assert.equal(budget.body.weeklyRemainingActual, 0);
    assert.equal(budget.body.monthlyRemainingActual, 0);
    assert.equal(budget.body.weeklyStatus, 'under');
    assert.equal(budget.body.monthlyStatus, 'under');
    assert.equal(budget.body.demo, true);

    const categoryBudget = await request(app.getHttpServer()).get('/users/demo/budget/categories').expect(200);
    assert.equal(categoryBudget.body.userId, 'demo');
    assert.deepEqual(categoryBudget.body.categories, []);
    assert.deepEqual(categoryBudget.body.unbudgetedCategories, [
      { category: 'coffee', estimatedSpend: 99.8, productIds: ['coffee'] }
    ]);
    assert.equal(categoryBudget.body.demo, true);

    await request(app.getHttpServer()).get('/users/demo/households/current').expect(404);

    const householdPayload = {
      householdId: 'demo-household',
      name: 'Demo Household',
      weeklyBudget: 500,
      approvalLimit: 70,
      reviewer: 'demo',
      members: [
        { userId: 'demo', displayName: 'Demo Shopper' },
        { userId: 'partner', displayName: 'Partner Shopper' }
      ],
      basketItems: [
        { productId: 'milk', quantity: 2, addedBy: 'demo' },
        { productId: 'coffee', quantity: 1, addedBy: 'partner' }
      ],
      watchlistItems: [{ productId: 'coffee', addedBy: 'demo', targetPrice: 50 }],
      sharedFavoriteStoreIds: ['willys-odenplan', 'lidl-sveavagen']
    };
    const householdWrite = await request(app.getHttpServer())
      .put('/users/demo/households/current')
      .send(householdPayload)
      .expect(200);
    assert.equal(householdWrite.body.userId, 'demo');
    assert.equal(householdWrite.body.household.id, 'demo-household');
    assert.equal(householdWrite.body.summary.estimatedTotal, 77.7);
    assert.equal(householdWrite.body.summary.remainingBudget, 422.3);
    assert.deepEqual(householdWrite.body.summary.sharedFavoriteStoreIds, ['lidl-sveavagen', 'willys-odenplan']);
    assert.deepEqual(householdWrite.body.approvalPolicy, {
      approvalLimit: 70,
      reviewer: 'demo',
      requiresOwnerApproval: true
    });
    assert.equal(householdWrite.body.demo, true);

    const householdRead = await request(app.getHttpServer()).get('/users/demo/households/current').expect(200);
    assert.equal(householdRead.body.household.id, 'demo-household');
    assert.equal(householdRead.body.household.members.length, 2);
    assert.equal(householdRead.body.demo, true);

    const pantry = await request(app.getHttpServer())
      .get('/users/demo/pantry/replenishment?asOf=2026-05-20T08:00:00.000Z')
      .expect(200);
    assert.equal(pantry.body.householdId, 'demo');
    assert.deepEqual(
      pantry.body.statuses.map((item: { productId: string; status: string; remainingQuantity: number }) => ({
        productId: item.productId,
        status: item.status,
        remainingQuantity: item.remainingQuantity
      })),
      [
        { productId: 'coffee', status: 'low_stock', remainingQuantity: 0.5 },
        { productId: 'milk', status: 'expiring_soon', remainingQuantity: 1 },
        { productId: 'butter', status: 'in_stock', remainingQuantity: 1 }
      ]
    );
    assert.deepEqual(pantry.body.expiringSoonProductIds, ['milk']);
    assert.deepEqual(
      pantry.body.replenishment.map((item: { productId: string; alreadyInBasket: boolean; bestDeal?: { storeId: string; price: number } }) => ({
        productId: item.productId,
        alreadyInBasket: item.alreadyInBasket,
        bestDeal: item.bestDeal && { storeId: item.bestDeal.storeId, price: item.bestDeal.price }
      })),
      [{ productId: 'coffee', alreadyInBasket: true, bestDeal: { storeId: 'willys-odenplan', price: 49.9 } }]
    );
    assert.equal(pantry.body.demo, true);

    const loyalty = await request(app.getHttpServer()).get('/users/demo/loyalty/offers').expect(200);
    assert.equal(loyalty.body.userId, 'demo');
    assert.equal(loyalty.body.totalEligibleSavings, 26);
    assert.equal(loyalty.body.requiresActionCount, 1);
    assert.equal(loyalty.body.membershipRequiredCount, 1);
    assert.deepEqual(
      loyalty.body.offers.map((offer: { productId: string; chain: string; savings: number; status: string; actionRequired: boolean }) => ({
        productId: offer.productId,
        chain: offer.chain,
        savings: offer.savings,
        status: offer.status,
        actionRequired: offer.actionRequired
      })),
      [
        { productId: 'coffee', chain: 'ica', savings: 7, status: 'eligible', actionRequired: false },
        { productId: 'milk', chain: 'coop', savings: 12, status: 'needs_coupon', actionRequired: true },
        { productId: 'private-label-milk', chain: 'willys', savings: 7, status: 'eligible', actionRequired: false }
      ]
    );
    assert.match(loyalty.body.guardrails[0], /member-only savings never overwrite verified public shelf evidence/i);
    assert.equal(loyalty.body.demo, true);

    const disclosure = await request(app.getHttpServer()).get('/users/demo/ads/disclosure').expect(200);
    assert.equal(disclosure.body.userId, 'demo');
    assert.equal(disclosure.body.userTier, 'free');
    assert.equal(disclosure.body.placementPlan.slots.length, 2);
    assert.equal(disclosure.body.premiumAdsRemoved, false);
    assert.equal(disclosure.body.affectsDealScore, false);
    assert.equal(disclosure.body.allowedCount, 2);
    assert.equal(disclosure.body.blockedCount, 2);
    assert.deepEqual(disclosure.body.excludedSurfaces, ['deal_score', 'checkout_decision', 'basket_optimizer']);
    assert.match(disclosure.body.guardrails[0], /Sponsored placements cannot change Deal Score/i);
    assert.equal(disclosure.body.demo, true);

    const expiryRadar = await request(app.getHttpServer())
      .get('/users/demo/expiry-deals/radar?now=2026-05-20T10:00:00.000Z&category=vegetables&maxDistanceKm=2')
      .expect(200);
    assert.equal(expiryRadar.body.userId, 'demo');
    assert.deepEqual(expiryRadar.body.categoryFilter, ['vegetables']);
    assert.equal(expiryRadar.body.maxDistanceKm, 2);
    assert.equal(expiryRadar.body.reportCount, 3);
    assert.deepEqual(expiryRadar.body.stores.map((store: { storeId: string }) => store.storeId), ['coop-odenplan']);
    assert.deepEqual(
      expiryRadar.body.stores[0].items.map((item: { id: string; urgency: string; verification: string; savings: number; radarScore: number }) => ({
        id: item.id,
        urgency: item.urgency,
        verification: item.verification,
        savings: item.savings,
        radarScore: item.radarScore
      })),
      [{ id: 'expiry-tomatoes-coop', urgency: 'expires_soon', verification: 'needs_confirmation', savings: 15, radarScore: 68 }]
    );
    assert.deepEqual(expiryRadar.body.alerts, []);
    assert.match(expiryRadar.body.guardrails[0], /separate from public shelf-price history/i);
    assert.equal(expiryRadar.body.demo, true);

    const receiptReview = await request(app.getHttpServer()).get('/users/demo/receipts/review').expect(200);
    assert.equal(receiptReview.body.userId, 'demo');
    assert.equal(receiptReview.body.lineCount, 3);
    assert.equal(receiptReview.body.matchedCount, 2);
    assert.equal(receiptReview.body.needsReviewCount, 2);
    assert.equal(receiptReview.body.review.budget.afterReceiptSpend, 762);
    assert.equal(receiptReview.body.review.budget.remaining, 38);
    assert.equal(receiptReview.body.review.comparedWithLocalMedianDelta, 3);
    assert.deepEqual(receiptReview.body.review.goodBuys.map((item: { productId: string }) => item.productId), ['coffee']);
    assert.deepEqual(
      receiptReview.body.review.overspend.map((item: { productId: string; deltaVsMedian: number }) => [
        item.productId,
        item.deltaVsMedian
      ]),
      [['cheese', 18]]
    );
    assert.match(receiptReview.body.guardrails[0], /Low confidence.*cannot update catalog or Deal Score/i);
    assert.equal(receiptReview.body.demo, true);

    const comparison = await request(app.getHttpServer()).get('/users/demo/basket/comparison').expect(200);
    assert.deepEqual(comparison.body.strategies.map((strategy: { id: string }) => strategy.id), [
      'cheapest_across_selected',
      'all_at_one_store',
      'favorite_only',
      'private_label_substitution'
    ]);
    assert.deepEqual(comparison.body.strategies[0].missingProductIds, ['coffee']);
    assert.match(comparison.body.strategies[0].warnings[0], /missing verified prices/);

    const localOffers = await request(app.getHttpServer())
      .get('/users/demo/basket/local-offers?asOf=2026-05-20T12:00:00.000Z')
      .expect(200);
    assert.equal(localOffers.body.userId, 'demo');
    assert.equal(localOffers.body.demo, true);
    assert.equal(localOffers.body.basketItemCount, 1);
    assert.ok(localOffers.body.storeIds.length > 0);
    assert.equal(localOffers.body.bestStore.storeId, 'willys-odenplan');
    assert.equal(localOffers.body.bestStore.matchedProductIds[0], 'coffee');
    assert.equal(localOffers.body.guardrails.length, 3);

    const handoff = await request(app.getHttpServer())
      .get('/users/demo/basket/handoff/willys')
      .expect(200);
    assert.equal(handoff.body.userId, 'demo');
    assert.equal(handoff.body.demo, true);
    assert.equal(handoff.body.retailerId, 'willys');
    assert.equal(handoff.body.primaryAction.actionType, 'copy_list');
    assert.match(handoff.body.unsupportedReasons[1], /cannot claim purchase completion/i);

    const transfer = await request(app.getHttpServer())
      .get('/users/demo/basket/transfer/willys')
      .expect(200);
    assert.equal(transfer.body.userId, 'demo');
    assert.equal(transfer.body.demo, true);
    assert.equal(transfer.body.status, 'blocked');
    assert.equal(transfer.body.canAttemptTransfer, false);
    assert.match(transfer.body.blockedReasons[0], /not verified as supported/);

    const slots = await request(app.getHttpServer())
      .get('/users/demo/basket/fulfillment-slots/willys/willys-odenplan')
      .expect(200);
    assert.equal(slots.body.userId, 'demo');
    assert.equal(slots.body.demo, true);
    assert.equal(slots.body.status, 'evidence_available');
    assert.equal(slots.body.availableSlotCount, 1);
    assert.match(slots.body.guardrails[0], /not retailer reservations/i);

    const tripCost = await request(app.getHttpServer())
      .get('/users/demo/basket/trip-cost?travelMode=car&valueOfTimePerHour=120&carCostPerKm=3.5&splitTripPenalty=15')
      .expect(200);
    assert.equal(tripCost.body.userId, 'demo');
    assert.equal(tripCost.body.demo, true);
    assert.equal(tripCost.body.bestOption.strategyId, 'all_at_one_store');
    assert.equal(tripCost.body.bestOption.effectiveTotal, 112.13);
    assert.match(tripCost.body.guardrails[0], /separately from verified shelf totals/i);

    const recurringDigest = await request(app.getHttpServer())
      .get('/users/demo/basket/recurring-digest?templateId=weekly-basics&templateName=Weekly%20basics&cadence=weekly&asOf=2026-05-22T08:00:00.000Z')
      .expect(200);
    assert.equal(recurringDigest.body.templateId, 'weekly-basics');
    assert.equal(recurringDigest.body.demo, true);
    assert.equal(recurringDigest.body.lineCount, 1);
    assert.equal(recurringDigest.body.lines[0].changeType, 'price_down');
    assert.match(recurringDigest.body.headline, /Weekly basics is .* lower/);

    const storeQuote = await request(app.getHttpServer()).get('/users/demo/basket/stores/willys-odenplan/quote').expect(200);
    assert.equal(storeQuote.body.storeId, 'willys-odenplan');
    assert.equal(storeQuote.body.storeName, 'Willys Odenplan');
    assert.equal(storeQuote.body.total, 99.8);
    assert.equal(storeQuote.body.priceGapVsCheapestComplete, 0);
    assert.deepEqual(storeQuote.body.missingProductIds, []);
    assert.equal(storeQuote.body.demo, true);

    const importExport = await request(app.getHttpServer())
      .post('/users/demo/basket/import-export')
      .send({
        source: { sourceKind: 'bookmarklet', retailerId: 'willys', origin: 'https://www.willys.se', capturedAt: '2026-05-22T09:35:00.000Z', consentGranted: true },
        capturedLines: [
          { rawName: 'Zoégas Coffee 450g', productId: 'coffee', quantity: 1, productUrl: 'https://www.willys.se/produkt/coffee' },
          { rawName: 'Arla Milk 1L', quantity: 2 },
          { rawName: 'Retailer-only bakery bun', quantity: 3 }
        ]
      })
      .expect(201);
    assert.equal(importExport.body.userId, 'demo');
    assert.equal(importExport.body.demo, true);
    assert.equal(importExport.body.status, 'needs_review');
    assert.equal(importExport.body.importedItemCount, 2);
    assert.equal(importExport.body.reviewItemCount, 1);
    assert.deepEqual(importExport.body.acceptedItems.map((item: { productId: string; quantity: number }) => [item.productId, item.quantity]), [['coffee', 1], ['milk', 2]]);
    assert.match(importExport.body.guardrails[0], /explicit shopper consent/i);

    const importReview = await request(app.getHttpServer())
      .get('/users/demo/basket/import-review')
      .expect(200);
    assert.equal(importReview.body.userId, 'demo');
    assert.equal(importReview.body.demo, true);
    assert.equal(importReview.body.openItemCount, 1);
    assert.equal(importReview.body.items[0].rawName, 'Retailer-only bakery bun');
    assert.match(importReview.body.guardrails[0], /account-bound/i);

    const importReviewDecision = await request(app.getHttpServer())
      .post(`/users/demo/basket/import-review/${encodeURIComponent(importReview.body.items[0].reviewItemId)}/decisions`)
      .send({ decision: 'dismiss' })
      .expect(201);
    assert.equal(importReviewDecision.body.demo, true);
    assert.equal(importReviewDecision.body.status, 'dismissed');

    const categoryMarket = await request(app.getHttpServer()).get('/categories/coffee/market').expect(200);
    assert.equal(categoryMarket.body.category, 'coffee');
    assert.equal(categoryMarket.body.city, 'Stockholm');
    assert.equal(categoryMarket.body.productCount, 1);
    assert.deepEqual(categoryMarket.body.topDeal, { productId: 'coffee', currentPrice: 49.9, dealScore: 82 });
    assert.equal(categoryMarket.body.rows[0].productId, 'coffee');
    assert.equal(categoryMarket.body.rows[0].currentPrice, 49.9);
    assert.equal(categoryMarket.body.rows[0].verifiedHistoryPoints, 3);
    assert.match(categoryMarket.body.rows[0].customerRead, /49\.90 SEK at Willys Odenplan/);
    assert.equal(categoryMarket.body.guardrails.length, 3);
    assert.equal(categoryMarket.body.demo, true);

    await request(app.getHttpServer()).get('/users/demo/alerts').expect(200);
    const inbox = await request(app.getHttpServer()).get('/users/demo/alerts/inbox').expect(200);
    assert.equal(inbox.body.userId, 'demo');
    assert.equal(inbox.body.demo, true);
    assert.equal(inbox.body.quietHoursWindow, '21:00-07:00');
    assert.equal(inbox.body.heldCount, 1);
    assert.equal(inbox.body.suppressedCount, 1);
    assert.deepEqual(
      inbox.body.queue
        .filter((item: { status: string }) => item.status !== 'delivered')
        .map((item: { id: string; status: string; channel: string }) => ({
          id: item.id,
          status: item.status,
          channel: item.channel
        })),
      [
        { id: 'receipt-review-quiet-hours', status: 'held', channel: 'push' },
        { id: 'butter-provider-suppression', status: 'suppressed', channel: 'push' }
      ]
    );

    const initialFavorites = await request(app.getHttpServer()).get('/users/demo/favorite-stores').expect(200);
    assert.deepEqual(initialFavorites.body, []);

    const addedFavorite = await request(app.getHttpServer())
      .post('/users/demo/favorite-stores')
      .send({ storeId: 'willys-odenplan' })
      .expect(201);
    assert.deepEqual(
      addedFavorite.body.map((store: { id: string; demo: boolean }) => ({ id: store.id, demo: store.demo })),
      [{ id: 'willys-odenplan', demo: true }]
    );

    await request(app.getHttpServer())
      .post('/users/demo/favorite-stores')
      .send({ storeId: 'lidl-sveavagen' })
      .expect(201);

    const removedFavorite = await request(app.getHttpServer())
      .delete('/users/demo/favorite-stores/lidl-sveavagen')
      .expect(200);
    assert.deepEqual(
      removedFavorite.body.map((store: { id: string; demo: boolean }) => ({ id: store.id, demo: store.demo })),
      [{ id: 'willys-odenplan', demo: true }]
    );

    const privacyExport = await request(app.getHttpServer()).get('/users/demo/privacy/export').expect(200);
    assert.equal(privacyExport.body.userId, 'demo');
    assert.equal(privacyExport.body.generatedAt, '2026-05-20T12:00:00.000Z');
    assert.deepEqual(privacyExport.body.sections.find((section: { name: string }) => section.name === 'favorite_stores')?.records, [
      { storeId: 'willys-odenplan' }
    ]);
    assert.deepEqual(privacyExport.body.sections.find((section: { name: string }) => section.name === 'watchlist')?.records, []);
    assert.equal(privacyExport.body.demo, true);

    const deletionPlan = await request(app.getHttpServer()).post('/users/demo/privacy/deletion-plan').expect(200);
    assert.equal(deletionPlan.body.userId, 'demo');
    assert.equal(deletionPlan.body.destructiveAction, false);
    assert.equal(deletionPlan.body.requiresReauthentication, true);
    assert.ok(deletionPlan.body.deleteFromTables.includes('receipt_uploads'));
    assert.deepEqual(deletionPlan.body.anonymizeTables, ['community_price_reports']);
    assert.equal(deletionPlan.body.demo, true);
  });

  it('rejects invalid request DTOs through the global ValidationPipe', async () => {
    await request(app.getHttpServer())
      .post('/users/demo/basket/items')
      .send({ productId: 'coffee', quantity: 0 })
      .expect(400);
  });

  it('returns 404 for missing product terminal data', async () => {
    await request(app.getHttpServer()).get('/products/missing-product/terminal').expect(404);
    await request(app.getHttpServer()).get('/products/missing-product/spread').expect(404);
    await request(app.getHttpServer()).get('/products/missing-product/store-savings').expect(404);
    await request(app.getHttpServer()).get('/products/missing-product/history-summary').expect(404);
    await request(app.getHttpServer()).get('/products/missing-product/history-confidence').expect(404);
    await request(app.getHttpServer()).get('/products/missing-product/deal-score').expect(404);
    await request(app.getHttpServer()).get('/products/missing-product/equivalents').expect(404);
    await request(app.getHttpServer()).get('/products/missing-product/history').expect(404);
    await request(app.getHttpServer()).get('/products/missing-product/prices').expect(404);
    await request(app.getHttpServer()).get('/products/missing-product/cheapest-now').expect(404);
    await request(app.getHttpServer()).get('/products/missing-product/price-history').expect(404);
    await request(app.getHttpServer()).patch('/users/demo/watchlist/missing-product').send({ targetPrice: 48 }).expect(404);
    await request(app.getHttpServer()).delete('/users/demo/watchlist/missing-product').expect(404);
  });

  it('returns 404 for missing store deals', async () => {
    await request(app.getHttpServer()).get('/stores/missing-store/deals').expect(404);
    await request(app.getHttpServer()).get('/stores/missing-store/flyer-offers').expect(404);
    await request(app.getHttpServer()).get('/users/demo/basket/stores/missing-store/quote').expect(404);
    await request(app.getHttpServer()).post('/users/demo/favorite-stores').send({ storeId: 'missing-store' }).expect(404);
    await request(app.getHttpServer()).delete('/users/demo/favorite-stores/missing-store').expect(404);
    await request(app.getHttpServer()).patch('/users/demo/basket/items/missing-product').send({ quantity: 2 }).expect(404);
    await request(app.getHttpServer()).delete('/users/demo/basket/items/missing-product').expect(404);
  });

  it('rejects invalid nutrition metrics', async () => {
    await request(app.getHttpServer()).get('/nutrition/value?metric=sugar').expect(400);
  });

  it('rejects invalid meal plan suggestion inputs', async () => {
    await request(app.getHttpServer()).get('/users/demo/meal-plans/suggestions?servings=0').expect(400);
    await request(app.getHttpServer()).get('/users/demo/meal-plans/suggestions?maxMealCost=abc').expect(400);
  });

  it('rejects invalid expiry markdown radar inputs', async () => {
    await request(app.getHttpServer()).get('/users/demo/expiry-deals/radar?maxDistanceKm=0').expect(400);
  });

  it('rejects invalid household plan inputs', async () => {
    await request(app.getHttpServer())
      .put('/users/demo/households/current')
      .send({
        householdId: 'demo-household',
        name: 'Demo Household',
        weeklyBudget: 500,
        approvalLimit: 70,
        reviewer: 'demo',
        members: [{ userId: 'demo', displayName: 'Demo Shopper' }],
        basketItems: [{ productId: 'missing-product', quantity: 1, addedBy: 'demo' }]
      })
      .expect(400);
  });

  it('returns 404 for missing indices', async () => {
    await request(app.getHttpServer()).get('/indices/missing-index').expect(404);
  });

  it('returns 404 for missing category market reports', async () => {
    await request(app.getHttpServer()).get('/categories/missing-category/market').expect(404);
  });
});

describe('GroceryView API real-only deal and alert endpoints', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(PostgresQueryExecutorService)
      .useValue(new UnconfiguredPostgresExecutor())
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('fails closed instead of serving demo flyer offers or price alerts without PostgreSQL', async () => {
    await request(app.getHttpServer()).get('/deals').expect(503);
    await request(app.getHttpServer()).get('/deals/discounts').expect(503);
    await request(app.getHttpServer()).get('/deals/flyer-offers').expect(503);
    await request(app.getHttpServer()).get('/stores/willys-odenplan/discounts').expect(503);
    await request(app.getHttpServer()).get('/stores/willys-odenplan/flyer-offers').expect(503);
    await request(app.getHttpServer()).get('/stores/nearest?lat=59.3293&lng=18.0686&radius=5').expect(503);
    await request(app.getHttpServer()).get('/screener?min_discount=10').expect(503);
    await request(app.getHttpServer()).get('/users/demo/watchlist/price-alerts').expect(503);
    await request(app.getHttpServer())
      .post('/users/demo/watchlist/price-alerts')
      .send({ productId: 'coffee', targetPrice: 50 })
      .expect(503);
  });
});
