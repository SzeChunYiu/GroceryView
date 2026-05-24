import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PostgresQueryExecutorService } from '../database/postgres-query-executor.service.js';
import { screenerRoutes } from '../routes/screener.js';

export type ScreenerDiscountQuery = {
  minDiscountPercent: number;
  category?: string;
  limit?: number;
};

type ScreenerDiscountSqlRow = {
  product_id: string;
  product_slug: string;
  product_name: string;
  brand: string | null;
  category_label: string | null;
  chain_slug: string;
  chain_name: string;
  store_slug: string | null;
  store_name: string | null;
  latest_price: string | number;
  previous_price: string | number;
  savings_amount: string | number;
  discount_percent: string | number;
  currency: string;
  latest_observed_at: string | Date;
  observation_count: string | number;
};

export type ScreenerDiscountItem = {
  productId: string;
  productSlug: string;
  productName: string;
  brand?: string;
  category: string;
  chainSlug: string;
  chainName: string;
  storeSlug?: string;
  storeName?: string;
  latestPrice: number;
  previousPrice: number;
  savingsAmount: number;
  discountPercent: number;
  currency: string;
  latestObservedAt: string;
  observationCount: number;
};

export type ScreenerDiscountReport = {
  source: typeof screenerRoutes.sourceCte;
  minDiscountPercent: number;
  category: string | null;
  itemCount: number;
  items: ScreenerDiscountItem[];
  guardrails: string[];
};

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

function optionalString(value: string | null): string | undefined {
  return value && value.trim().length > 0 ? value : undefined;
}

function mapScreenerDiscountRow(row: ScreenerDiscountSqlRow): ScreenerDiscountItem {
  const brand = optionalString(row.brand);
  const storeSlug = optionalString(row.store_slug);
  const storeName = optionalString(row.store_name);
  return {
    productId: row.product_id,
    productSlug: row.product_slug,
    productName: row.product_name,
    ...(brand ? { brand } : {}),
    category: row.category_label ?? 'uncategorized',
    chainSlug: row.chain_slug,
    chainName: row.chain_name,
    ...(storeSlug ? { storeSlug } : {}),
    ...(storeName ? { storeName } : {}),
    latestPrice: Number(row.latest_price),
    previousPrice: Number(row.previous_price),
    savingsAmount: Number(row.savings_amount),
    discountPercent: Number(row.discount_percent),
    currency: row.currency,
    latestObservedAt: iso(row.latest_observed_at),
    observationCount: Number(row.observation_count)
  };
}

@Injectable()
export class ScreenerService {
  constructor(private readonly postgres: PostgresQueryExecutorService) {}

  isConfigured(): boolean {
    return this.postgres.isConfigured();
  }

  async discountRows(query: ScreenerDiscountQuery): Promise<ScreenerDiscountReport> {
    if (!this.postgres.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required for real screener discount data.');
    }

    const limit = Math.min(Math.max(query.limit ?? screenerRoutes.defaultLimit, 1), screenerRoutes.maxLimit);
    const rows = await this.postgres.query<ScreenerDiscountSqlRow>(
      `/* screener_discount_history */
       with price_history as (
         select observations.product_id::text as product_id,
                products.slug as product_slug,
                products.canonical_name as product_name,
                products.brand,
                coalesce(products.category_path[1], 'uncategorized') as category_label,
                chains.slug as chain_slug,
                chains.name as chain_name,
                stores.slug as store_slug,
                stores.name as store_name,
                observations.price as latest_price,
                lag(observations.price) over (
                  partition by observations.product_id, observations.chain_id, observations.store_id, observations.price_type
                  order by observations.observed_at, observations.id
                ) as previous_price,
                observations.currency,
                observations.observed_at as latest_observed_at,
                count(*) over (partition by observations.product_id) as observation_count
         from observations
         join products on products.id = observations.product_id
         join chains on chains.id = observations.chain_id
         left join stores on stores.id = observations.store_id
         where observations.domain = 'grocery'
           and observations.price > 0
           and coalesce(observations.is_available, true) = true
       ),
       discounted as (
         select product_id,
                product_slug,
                product_name,
                brand,
                category_label,
                chain_slug,
                chain_name,
                store_slug,
                store_name,
                latest_price,
                previous_price,
                round((previous_price - latest_price)::numeric, 2) as savings_amount,
                round((((previous_price - latest_price) / nullif(previous_price, 0)) * 100)::numeric, 2) as discount_percent,
                currency,
                latest_observed_at,
                observation_count
         from price_history
         where previous_price is not null
           and latest_price < previous_price
       )
       select product_id,
              product_slug,
              product_name,
              brand,
              category_label,
              chain_slug,
              chain_name,
              store_slug,
              store_name,
              latest_price,
              previous_price,
              savings_amount,
              discount_percent,
              currency,
              latest_observed_at,
              observation_count
       from discounted
       where discounted.discount_percent >= $1
         and ($2::text is null or lower(discounted.category_label) = lower($2::text))
       order by discounted.discount_percent desc, discounted.savings_amount desc, discounted.latest_observed_at desc, discounted.product_name
       limit $3`,
      [query.minDiscountPercent, query.category ?? null, limit]
    );

    const items = rows.map(mapScreenerDiscountRow);
    return {
      source: screenerRoutes.sourceCte,
      minDiscountPercent: query.minDiscountPercent,
      category: query.category ?? null,
      itemCount: items.length,
      items,
      guardrails: [
        'Discount percent is computed from price_history consecutive observed prices; no synthetic regular price is invented.',
        'Only grocery observations with positive available prices are eligible.',
        'Rows below min_discount are filtered out before ranking.'
      ]
    };
  }
}
