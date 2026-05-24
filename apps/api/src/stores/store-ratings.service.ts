import { Injectable } from '@nestjs/common';
import { PostgresQueryExecutorService } from '../database/postgres-query-executor.service.js';

export type StoreRatingSummary = {
  storeId: string;
  averageRating: number | null;
  ratingCount: number;
  myRating: number | null;
};

type StoreRatingAggregateRow = {
  average_rating: string | number | null;
  rating_count: string | number;
};

type StoreUserRatingRow = {
  rating: number;
};

@Injectable()
export class StoreRatingsService {
  constructor(private readonly postgres: PostgresQueryExecutorService) {}

  isConfigured(): boolean {
    return this.postgres.isConfigured();
  }

  async summary(storeId: string, userId?: string): Promise<StoreRatingSummary> {
    const aggregateRows = await this.postgres.query<StoreRatingAggregateRow>(
      `select round(avg(rating)::numeric, 2) as average_rating,
              count(*)::int as rating_count
         from store_ratings
        where store_id = $1`,
      [storeId]
    );
    const aggregate = aggregateRows[0] ?? { average_rating: null, rating_count: 0 };
    const myRating = userId ? await this.userRating(storeId, userId) : null;

    return {
      storeId,
      averageRating: aggregate.average_rating === null ? null : Number(aggregate.average_rating),
      ratingCount: Number(aggregate.rating_count),
      myRating
    };
  }

  async rate(storeId: string, userId: string, rating: number): Promise<StoreRatingSummary> {
    await this.postgres.query(
      `insert into store_ratings(store_id, user_id, rating)
       values ($1, $2, $3)
       on conflict (store_id, user_id)
       do update set rating = excluded.rating,
                     updated_at = now()`,
      [storeId, userId, rating]
    );

    return this.summary(storeId, userId);
  }

  private async userRating(storeId: string, userId: string): Promise<number | null> {
    const rows = await this.postgres.query<StoreUserRatingRow>(
      `select rating
         from store_ratings
        where store_id = $1
          and user_id = $2
        limit 1`,
      [storeId, userId]
    );

    return rows[0]?.rating ?? null;
  }
}
