import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { buildFavoritesListQuery, mapFavoriteItemRow, type FavoriteItem, type FavoriteItemRow, type FavoritesSortMode } from '@groceryview/db';
import { groceryApi } from '../demo-data.js';
import { PostgresQueryExecutorService } from '../database/postgres-query-executor.service.js';

export type FavoritesListReport = {
  userId: string;
  sort: FavoritesSortMode;
  items: FavoriteItem[];
  guardrails: string[];
  demo?: boolean;
};

function normalizeSort(value: unknown): FavoritesSortMode {
  return value === 'price' ? 'price' : 'name';
}

function demoFavoriteItems(userId: string): FavoriteItem[] {
  return groceryApi.getWatchlist(userId).items.flatMap((item) => {
    const product = groceryApi.getProduct(item.productId);
    const cheapest = product?.currentPrices[0];
    if (!product) return [];
    return [{
      productId: product.id,
      productSlug: product.id,
      productName: product.name,
      brand: null,
      imageUrl: null,
      cheapestPrice: cheapest?.price ?? null,
      currency: cheapest ? 'SEK' : null,
      cheapestStoreId: cheapest?.storeId ?? null,
      cheapestStoreSlug: cheapest?.storeId ?? null,
      cheapestStoreName: cheapest?.storeName ?? null,
      observedAt: cheapest ? '2026-05-19T09:00:00.000Z' : null,
      addedAt: 'demo'
    }];
  });
}

function sortFavoriteItems(items: FavoriteItem[], sort: FavoritesSortMode) {
  return [...items].sort((left, right) => {
    if (sort === 'price') {
      const leftPrice = left.cheapestPrice ?? Number.POSITIVE_INFINITY;
      const rightPrice = right.cheapestPrice ?? Number.POSITIVE_INFINITY;
      return leftPrice - rightPrice || left.productName.localeCompare(right.productName, 'sv');
    }
    return left.productName.localeCompare(right.productName, 'sv') || (left.cheapestPrice ?? Number.POSITIVE_INFINITY) - (right.cheapestPrice ?? Number.POSITIVE_INFINITY);
  });
}

@Injectable()
export class FavoritesService {
  constructor(private readonly postgres: PostgresQueryExecutorService) {}

  async list(userId: string, rawSort: unknown): Promise<FavoritesListReport> {
    const sort = normalizeSort(rawSort);
    const guardrails = [
      'Favorites are account-bound watchlist_items and are never read from anonymous local storage.',
      'Cheapest prices come from current latest_prices rows where is_available remains true.',
      'Missing prices stay null instead of being estimated from historical or unmatched rows.'
    ];

    if (!this.postgres.isConfigured()) {
      if (userId !== 'demo') {
        throw new ServiceUnavailableException('DATABASE_URL is required for account favorites outside the demo user.');
      }
      return { userId, sort, items: sortFavoriteItems(demoFavoriteItems(userId), sort), guardrails, demo: true };
    }

    const query = buildFavoritesListQuery(userId, { sort });
    const rows = await this.postgres.query<FavoriteItemRow>(query.sql, query.values);
    return { userId, sort, items: rows.map(mapFavoriteItemRow), guardrails };
  }
}
