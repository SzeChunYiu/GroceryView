import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { queryTrendingItemsReport, type TrendingItemsReport } from '@groceryview/db';
import { PostgresQueryExecutorService } from '../database/postgres-query-executor.service.js';

@Injectable()
export class TrendingService {
  constructor(private readonly postgres: PostgresQueryExecutorService) {}

  async trendingItems(options: { limit: number }): Promise<TrendingItemsReport> {
    if (!this.postgres.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required for real trending item data.');
    }

    return queryTrendingItemsReport(this.postgres, { limit: options.limit });
  }
}
