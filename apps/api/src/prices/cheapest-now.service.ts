import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  buildProductCheapestNowReport,
  type ProductCheapestNow,
  type ProductCheapestNowPriceRow
} from '@groceryview/api';
import { PostgresQueryExecutorService } from '../database/postgres-query-executor.service.js';

type CheapestNowSqlRow = {
  product_id: string;
  product_slug: string;
  product_name: string;
  category_path: string[];
  comparable_unit: string;
  price: string | number | null;
  unit_price: string | number | null;
  currency: string | null;
  observed_at: string | Date | null;
  chain_slug: string | null;
  chain_name: string | null;
  store_slug: string | null;
  store_name: string | null;
};

function iso(value: string | Date | null): string | undefined {
  if (value === null) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

function numberValue(value: string | number | null): number | undefined {
  return value === null ? undefined : Number(value);
}

function mapRow(row: CheapestNowSqlRow): ProductCheapestNowPriceRow {
  return {
    productId: row.product_id,
    productSlug: row.product_slug,
    productName: row.product_name,
    categoryPath: row.category_path ?? [],
    comparableUnit: row.comparable_unit,
    ...(numberValue(row.price) === undefined ? {} : { price: numberValue(row.price) }),
    ...(numberValue(row.unit_price) === undefined ? {} : { unitPrice: numberValue(row.unit_price) }),
    ...(row.currency ? { currency: row.currency } : {}),
    ...(iso(row.observed_at) ? { observedAt: iso(row.observed_at) } : {}),
    ...(row.chain_slug ? { chainSlug: row.chain_slug } : {}),
    ...(row.chain_name ? { chainName: row.chain_name } : {}),
    ...(row.store_slug ? { storeSlug: row.store_slug } : {}),
    ...(row.store_name ? { storeName: row.store_name } : {})
  };
}

@Injectable()
export class CheapestNowService {
  constructor(private readonly postgres: PostgresQueryExecutorService) {}

  async getProductCheapestNow(productIdentifier: string): Promise<ProductCheapestNow | null> {
    if (!this.postgres.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required for real cheapest-now data.');
    }

    const rows = await this.postgres.query<CheapestNowSqlRow>(
      `select products.id::text as product_id,
              products.slug as product_slug,
              products.canonical_name as product_name,
              products.category_path,
              products.comparable_unit,
              latest_prices.price,
              latest_prices.unit_price,
              latest_prices.currency,
              latest_prices.observed_at,
              chains.slug as chain_slug,
              chains.name as chain_name,
              stores.slug as store_slug,
              stores.name as store_name
       from products
       left join latest_prices on latest_prices.product_id = products.id
        and latest_prices.price_type in ('shelf', 'online', 'member', 'promotion')
        and latest_prices.price > 0
        and latest_prices.unit_price > 0
       left join chains on chains.id = latest_prices.chain_id
       left join stores on stores.id = latest_prices.store_id
       where products.slug = $1 or products.id::text = $1
       order by latest_prices.price nulls last, chains.slug nulls last, stores.name nulls last`,
      [productIdentifier]
    );

    return buildProductCheapestNowReport(rows.map(mapRow));
  }
}
