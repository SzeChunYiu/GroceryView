import { Injectable } from '@nestjs/common';
import { buildWatchlistAlerts, type WatchlistItem, type WatchlistPriceType, type WatchlistProductSnapshot } from '@groceryview/core';
import { PostgresQueryExecutorService } from '../database/postgres-query-executor.service.js';
import { assertVerifiedUserCanCreateUserContent } from '../routes/auth.js';

type WatchlistRow = {
  product_id: string;
  product_slug: string;
  target_price: string | number | null;
  alert_deal_score_at: string | number | null;
  favorite_stores_only: boolean;
  allowed_price_types: string[] | null;
};

type LatestPriceRow = {
  product_slug: string;
  product_name: string;
  store_slug: string;
  store_name: string;
  price: string | number;
  price_type: WatchlistPriceType;
  confidence: string | number;
};

type ProductRow = {
  product_id: string;
  product_slug: string;
};

type FavoriteStoreRow = {
  store_slug: string;
};

const defaultAllowedPriceTypes: WatchlistPriceType[] = ['shelf'];

function itemFromRow(row: WatchlistRow): WatchlistItem {
  return {
    productId: row.product_slug,
    ...(row.target_price === null ? {} : { targetPrice: Number(row.target_price) }),
    ...(row.alert_deal_score_at === null ? {} : { alertDealScoreAt: Number(row.alert_deal_score_at) }),
    favoriteStoresOnly: row.favorite_stores_only,
    allowedPriceTypes: (row.allowed_price_types ?? defaultAllowedPriceTypes) as WatchlistPriceType[]
  };
}

@Injectable()
export class WatchlistsService {
  constructor(private readonly postgres: PostgresQueryExecutorService) {}

  isConfigured(): boolean {
    return this.postgres.isConfigured();
  }

  async list(userId: string) {
    const items = await this.watchlistItems(userId);
    return {
      items,
      alerts: await this.alertsFor(userId, items)
    };
  }

  async create(userId: string, item: WatchlistItem) {
    await this.assertVerifiedForMutation(userId, 'lists');
    const product = await this.resolveProduct(item.productId);
    await this.postgres.query(
      `insert into watchlist_items(user_id, product_id, target_price, alert_deal_score_at, favorite_stores_only, allowed_price_types)
       values ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        product.product_id,
        item.targetPrice ?? null,
        item.alertDealScoreAt ?? null,
        item.favoriteStoresOnly,
        item.allowedPriceTypes ?? defaultAllowedPriceTypes
      ]
    );
    return { ...item, productId: product.product_slug };
  }

  async priceAlerts(userId: string) {
    const items = await this.watchlistItems(userId);
    const alerts = await this.alertsFor(userId, items);
    const targetAlerts = alerts.filter((alert) => alert.type === 'target_price');
    const targetPriceItemCount = items.filter((item) => item.targetPrice !== undefined).length;
    return {
      userId,
      trackedItemCount: targetPriceItemCount,
      alertCount: targetAlerts.length,
      alerts: targetAlerts,
      guardrails: [
        'Watchlist target-price alerts are calculated from persisted latest_prices rows for saved watchlist items.',
        'Favorite-store alerts only fire when the current best eligible row belongs to a saved favorite store.',
        'Allowed price types filter eligible shelf, member, promotion, and estimated rows before threshold evaluation.'
      ]
    };
  }

  async createPriceAlert(userId: string, alert: {
    productId: string;
    targetPrice: number;
    favoriteStoresOnly?: boolean;
    allowedPriceTypes?: WatchlistPriceType[];
  }) {
    await this.assertVerifiedForMutation(userId, 'alerts');
    const product = await this.resolveProduct(alert.productId);
    const existing = await this.postgres.query<{ id: string }>(
      `select watchlist_items.id::text as id
       from watchlist_items
       join products on products.id::text = watchlist_items.product_id or products.slug = watchlist_items.product_id
       where watchlist_items.user_id = $1
         and (products.slug = $2 or products.id::text = $2)
       order by watchlist_items.id
       limit 1`,
      [userId, alert.productId]
    );
    if (existing[0]) {
      await this.postgres.query(
        `update watchlist_items
         set target_price = $2,
             favorite_stores_only = $3,
             allowed_price_types = $4
         where id::text = $1`,
        [
          existing[0].id,
          alert.targetPrice,
          alert.favoriteStoresOnly ?? true,
          alert.allowedPriceTypes ?? defaultAllowedPriceTypes
        ]
      );
    } else {
      await this.postgres.query(
        `insert into watchlist_items(user_id, product_id, target_price, alert_deal_score_at, favorite_stores_only, allowed_price_types)
         values ($1, $2, $3, null, $4, $5)`,
        [
          userId,
          product.product_id,
          alert.targetPrice,
          alert.favoriteStoresOnly ?? true,
          alert.allowedPriceTypes ?? defaultAllowedPriceTypes
        ]
      );
    }
    return this.priceAlerts(userId);
  }

  async update(userId: string, productId: string, patch: Partial<WatchlistItem>) {
    await this.resolveProduct(productId);
    const rows = await this.postgres.query<{ product_slug: string }>(
      `update watchlist_items
       set target_price = coalesce($3::numeric, target_price),
           alert_deal_score_at = coalesce($4::integer, alert_deal_score_at),
           favorite_stores_only = coalesce($5::boolean, favorite_stores_only),
           allowed_price_types = coalesce($6::text[], allowed_price_types)
       from products
       where (products.id::text = watchlist_items.product_id or products.slug = watchlist_items.product_id)
         and watchlist_items.user_id = $1
         and (products.slug = $2 or products.id::text = $2)
       returning products.slug as product_slug`,
      [
        userId,
        productId,
        patch.targetPrice ?? null,
        patch.alertDealScoreAt ?? null,
        patch.favoriteStoresOnly ?? null,
        patch.allowedPriceTypes ?? null
      ]
    );
    if (!rows[0]) throw new Error(`Watchlist item not found: ${productId}`);
    return this.list(userId);
  }

  async remove(userId: string, productId: string) {
    await this.resolveProduct(productId);
    const rows = await this.postgres.query<{ product_slug: string }>(
      `delete from watchlist_items
       using products
       where (products.id::text = watchlist_items.product_id or products.slug = watchlist_items.product_id)
         and watchlist_items.user_id = $1
         and (products.slug = $2 or products.id::text = $2)
       returning products.slug as product_slug`,
      [userId, productId]
    );
    if (!rows[0]) throw new Error(`Watchlist item not found: ${productId}`);
    return { removed: true, watchlist: await this.list(userId) };
  }

  private async assertVerifiedForMutation(userId: string, contentType: 'alerts' | 'lists'): Promise<void> {
    if (userId === 'demo') return;
    await assertVerifiedUserCanCreateUserContent({ executor: this.postgres, userId, contentType });
  }

  private async resolveProduct(productId: string): Promise<ProductRow> {
    const rows = await this.postgres.query<ProductRow>(
      'select id::text as product_id, slug as product_slug from products where id::text = $1 or slug = $1 limit 1',
      [productId]
    );
    const product = rows[0];
    if (!product) throw new Error(`Unknown productId: ${productId}`);
    return product;
  }

  private async watchlistItems(userId: string): Promise<WatchlistItem[]> {
    const rows = await this.postgres.query<WatchlistRow>(
      `select watchlist_items.product_id::text,
              products.slug as product_slug,
              watchlist_items.target_price,
              watchlist_items.alert_deal_score_at,
              watchlist_items.favorite_stores_only,
              watchlist_items.allowed_price_types
       from watchlist_items
       join products on products.id::text = watchlist_items.product_id or products.slug = watchlist_items.product_id
       where watchlist_items.user_id = $1
       order by watchlist_items.id`,
      [userId]
    );
    return rows.map(itemFromRow);
  }

  private async favoriteStoreSlugs(userId: string): Promise<string[]> {
    const rows = await this.postgres.query<FavoriteStoreRow>(
      `select coalesce(stores.slug, favorite_stores.store_id) as store_slug
       from favorite_stores
       left join stores on stores.id::text = favorite_stores.store_id or stores.slug = favorite_stores.store_id
       where favorite_stores.user_id = $1
       order by store_slug`,
      [userId]
    );
    return rows.map((row) => row.store_slug);
  }

  private async productsFor(items: readonly WatchlistItem[]): Promise<WatchlistProductSnapshot[]> {
    const productIds = [...new Set(items.map((item) => item.productId))];
    if (productIds.length === 0) return [];
    const rows = await this.postgres.query<LatestPriceRow>(
      `select products.slug as product_slug,
              products.canonical_name as product_name,
              stores.slug as store_slug,
              stores.name as store_name,
              latest_prices.price,
              latest_prices.price_type,
              latest_prices.confidence
       from latest_prices
       join products on products.id = latest_prices.product_id
       left join stores on stores.id = latest_prices.store_id
       where products.slug = any($1::text[])
          or products.id::text = any($1::text[])
       order by products.slug, latest_prices.price asc, stores.name nulls last, latest_prices.observed_at desc`,
      [productIds]
    );
    const rowsByProduct = new Map<string, LatestPriceRow[]>();
    for (const row of rows) rowsByProduct.set(row.product_slug, [...(rowsByProduct.get(row.product_slug) ?? []), row]);
    return productIds.flatMap((productId) => {
      const productRows = rowsByProduct.get(productId) ?? [];
      const best = productRows[0];
      if (!best) return [];
      return [{
        productId,
        productName: best.product_name,
        bestPrice: Number(best.price),
        bestStoreId: best.store_slug,
        bestPriceType: best.price_type,
        prices: productRows.map((row) => ({
          storeId: row.store_slug,
          storeName: row.store_name,
          price: Number(row.price),
          priceType: row.price_type
        })),
        dealScore: Math.round(Math.max(0, Math.min(1, Number(best.confidence))) * 100),
        isNew52WeekLow: false
      }];
    });
  }

  private async alertsFor(userId: string, items: readonly WatchlistItem[]) {
    const [products, favoriteStoreIds] = await Promise.all([
      this.productsFor(items),
      this.favoriteStoreSlugs(userId)
    ]);
    return buildWatchlistAlerts({ watchlist: [...items], products, favoriteStoreIds });
  }
}
