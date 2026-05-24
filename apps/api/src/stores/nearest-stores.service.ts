import { Injectable } from '@nestjs/common';
import { getNearestStores, type NearestStore, type NearestStoreQueryInput } from '@groceryview/geo';
import { PostgresQueryExecutorService } from '../database/postgres-query-executor.service.js';

@Injectable()
export class NearestStoresService {
  constructor(private readonly postgres: PostgresQueryExecutorService) {}

  isConfigured(): boolean {
    return this.postgres.isConfigured();
  }

  async nearest(input: NearestStoreQueryInput): Promise<NearestStore[]> {
    return getNearestStores(input.latitude, input.longitude, input.radiusKm, input.chain, this.postgres);
  }
}
