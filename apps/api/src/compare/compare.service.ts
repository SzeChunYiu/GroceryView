import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  buildComparePriceSnapshotsQuery,
  mapComparePriceSnapshotRow,
  type ComparePriceSnapshot,
  type ComparePriceSnapshotRow
} from '@groceryview/db';
import { PostgresQueryExecutorService } from '../database/postgres-query-executor.service.js';

export type ComparePriceSnapshotsReport = {
  itemIds: string[];
  stores: Record<string, Record<string, ComparePriceSnapshot>>;
  missingItemIds: string[];
};

@Injectable()
export class CompareService {
  constructor(private readonly postgres: PostgresQueryExecutorService) {}

  async priceSnapshots(itemIds: string[]): Promise<ComparePriceSnapshotsReport> {
    if (!this.postgres.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required for store-level price comparison.');
    }

    const query = buildComparePriceSnapshotsQuery(itemIds);
    const rows = await this.postgres.query<ComparePriceSnapshotRow>(query.sql, query.values);
    const snapshots = rows.map(mapComparePriceSnapshotRow);
    const stores: ComparePriceSnapshotsReport['stores'] = {};
    const foundItemIds = new Set<string>();

    for (const snapshot of snapshots) {
      foundItemIds.add(snapshot.requestedItemId);
      stores[snapshot.storeId] ??= {};
      stores[snapshot.storeId]![snapshot.requestedItemId] = snapshot;
    }

    return {
      itemIds,
      stores,
      missingItemIds: itemIds.filter((itemId) => !foundItemIds.has(itemId))
    };
  }
}
