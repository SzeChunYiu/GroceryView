import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  buildProductLatestPrices,
  type ProductLatestPrice,
  type ProductLatestPriceInput,
  type ProductPriceHistoryPriceType
} from '@groceryview/api';
import { PostgresQueryExecutorService } from '../database/postgres-query-executor.service.js';
import { localizedProductNameSql, type ProductNameLocale } from '../product-name-locale.js';

type LatestPriceSqlRow = {
  product_id: string;
  product_slug: string;
  product_name: string;
  observation_id: string | null;
  store_slug: string | null;
  store_name: string | null;
  chain_slug: string | null;
  chain_name: string | null;
  price: string | number | null;
  unit_price: string | number | null;
  currency: string | null;
  price_type: ProductPriceHistoryPriceType | null;
  confidence: string | number | null;
  observed_at: string | Date | null;
  provenance: Record<string, unknown> | string | null;
};

function iso(value: string | Date | null): string | undefined {
  if (value === null) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

function optionalNumber(value: string | number | null): number | undefined {
  return value === null ? undefined : Number(value);
}

function provenanceRecord(value: Record<string, unknown> | string | null): Record<string, unknown> {
  if (!value) return {};
  return typeof value === 'string' ? JSON.parse(value) as Record<string, unknown> : value;
}

function mapRow(row: LatestPriceSqlRow): ProductLatestPriceInput {
  return {
    productId: row.product_id,
    productSlug: row.product_slug,
    productName: row.product_name,
    ...(row.observation_id ? { observationId: row.observation_id } : {}),
    ...(row.store_slug ? { storeSlug: row.store_slug } : {}),
    ...(row.store_name ? { storeName: row.store_name } : {}),
    ...(row.chain_slug ? { chainSlug: row.chain_slug } : {}),
    ...(row.chain_name ? { chainName: row.chain_name } : {}),
    ...(optionalNumber(row.price) === undefined ? {} : { price: optionalNumber(row.price) }),
    ...(optionalNumber(row.unit_price) === undefined ? {} : { unitPrice: optionalNumber(row.unit_price) }),
    ...(row.currency ? { currency: row.currency } : {}),
    ...(row.price_type ? { priceType: row.price_type } : {}),
    ...(optionalNumber(row.confidence) === undefined ? {} : { confidence: optionalNumber(row.confidence) }),
    ...(iso(row.observed_at) ? { observedAt: iso(row.observed_at) } : {}),
    provenance: provenanceRecord(row.provenance)
  };
}

@Injectable()
export class LatestPricesService {
  constructor(private readonly postgres: PostgresQueryExecutorService) {}

  async getProductLatestPrices(productIdentifier: string, productNameLocale?: ProductNameLocale): Promise<ProductLatestPrice[] | null> {
    if (!this.postgres.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required for real latest-price data.');
    }

    const productName = localizedProductNameSql('$2');
    const rows = await this.postgres.query<LatestPriceSqlRow>(
      `select products.id::text as product_id,
              products.slug as product_slug,
              ${productName} as product_name,
              latest_prices.observation_id::text,
              stores.slug as store_slug,
              stores.name as store_name,
              chains.slug as chain_slug,
              chains.name as chain_name,
              latest_prices.price,
              latest_prices.unit_price,
              latest_prices.currency,
              latest_prices.price_type,
              latest_prices.confidence,
              latest_prices.observed_at,
              latest_prices.provenance
       from products
       left join latest_prices on latest_prices.product_id = products.id
       left join chains on chains.id = latest_prices.chain_id
       left join stores on stores.id = latest_prices.store_id
       where products.slug = $1 or products.id::text = $1
       order by latest_prices.price nulls last, stores.name nulls last, latest_prices.price_type nulls last`,
      [productIdentifier, productNameLocale ?? null]
    );

    if (rows.length === 0) return null;
    return buildProductLatestPrices(rows.map(mapRow));
  }
}
