import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  buildRealBrandPriceIndices,
  buildRealCategoryPriceIndices,
  buildRealChainPriceIndices,
  type BrandPriceIndexSummary,
  type CategoryPriceIndexSummary,
  type RealChainPriceIndexSummary,
  type RealPriceIndexRow
} from '@groceryview/api';
import { PostgresQueryExecutorService } from '../database/postgres-query-executor.service.js';

type ChainIndexSqlRow = {
  product_id: string;
  product_slug: string;
  product_name: string;
  category_path: string[] | null;
  chain_slug: string | null;
  current_unit_price: string | number | null;
  current_observed_at: string | Date | null;
};

type BasketIndexSqlRow = ChainIndexSqlRow & {
  brand: string | null;
  private_label_owner: string | null;
  base_unit_price: string | number | null;
  base_observed_at: string | Date | null;
};

function iso(value: string | Date | null): string | undefined {
  if (value === null) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

function numberValue(value: string | number | null): number | undefined {
  return value === null ? undefined : Number(value);
}

function mapChainRow(row: ChainIndexSqlRow): RealPriceIndexRow {
  return {
    productId: row.product_id,
    productSlug: row.product_slug,
    productName: row.product_name,
    categoryPath: row.category_path ?? [],
    ...(row.chain_slug ? { chainSlug: row.chain_slug } : {}),
    ...(numberValue(row.current_unit_price) === undefined ? {} : { currentUnitPrice: numberValue(row.current_unit_price) }),
    ...(iso(row.current_observed_at) ? { currentObservedAt: iso(row.current_observed_at) } : {})
  };
}

function mapBasketRow(row: BasketIndexSqlRow): RealPriceIndexRow {
  return {
    ...mapChainRow(row),
    ...(row.brand ? { brand: row.brand } : {}),
    ...(row.private_label_owner ? { privateLabelOwner: row.private_label_owner } : {}),
    ...(numberValue(row.base_unit_price) === undefined ? {} : { baseUnitPrice: numberValue(row.base_unit_price) }),
    ...(iso(row.base_observed_at) ? { baseObservedAt: iso(row.base_observed_at) } : {})
  };
}

@Injectable()
export class IndicesService {
  constructor(private readonly postgres: PostgresQueryExecutorService) {}

  async getChainPriceIndices(): Promise<RealChainPriceIndexSummary> {
    if (!this.postgres.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required for real chain price indices.');
    }

    const rows = await this.postgres.query<ChainIndexSqlRow>(
      `select products.id::text as product_id,
              products.slug as product_slug,
              products.canonical_name as product_name,
              products.category_path,
              chains.slug as chain_slug,
              latest_prices.unit_price as current_unit_price,
              latest_prices.observed_at as current_observed_at
       from latest_prices
       join products on products.id = latest_prices.product_id
       join chains on chains.id = latest_prices.chain_id
       where latest_prices.price_type in ('shelf', 'online', 'member', 'promotion')
         and latest_prices.unit_price > 0
       order by chains.slug, products.category_path, products.slug, latest_prices.unit_price`
    );

    return buildRealChainPriceIndices(rows.map(mapChainRow));
  }

  async getCategoryPriceIndices(): Promise<CategoryPriceIndexSummary> {
    if (!this.postgres.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required for real category price indices.');
    }

    const rows = await this.getBasketIndexRows();
    return buildRealCategoryPriceIndices(rows.map(mapBasketRow));
  }

  async getBrandPriceIndices(): Promise<BrandPriceIndexSummary> {
    if (!this.postgres.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required for real brand price indices.');
    }

    const rows = await this.getBasketIndexRows();
    return buildRealBrandPriceIndices(rows.map(mapBasketRow));
  }

  private async getBasketIndexRows(): Promise<BasketIndexSqlRow[]> {
    return this.postgres.query<BasketIndexSqlRow>(
      `with current_prices as (
         select distinct on (latest_prices.product_id)
                latest_prices.product_id,
                latest_prices.chain_id,
                latest_prices.unit_price,
                latest_prices.observed_at
         from latest_prices
         where latest_prices.price_type in ('shelf', 'online', 'member', 'promotion')
           and latest_prices.unit_price > 0
         order by latest_prices.product_id, latest_prices.unit_price asc, latest_prices.observed_at desc
       ),
       base_prices as (
         select distinct on (observations.product_id)
                observations.product_id,
                observations.unit_price,
                observations.observed_at
         from observations
         where observations.price_type in ('shelf', 'online', 'member', 'promotion')
           and observations.unit_price > 0
         order by observations.product_id, observations.observed_at asc
       )
       select products.id::text as product_id,
              products.slug as product_slug,
              products.canonical_name as product_name,
              products.brand,
              products.private_label_owner,
              products.category_path,
              chains.slug as chain_slug,
              current_prices.unit_price as current_unit_price,
              current_prices.observed_at as current_observed_at,
              base_prices.unit_price as base_unit_price,
              base_prices.observed_at as base_observed_at
       from current_prices
       join base_prices on base_prices.product_id = current_prices.product_id
       join products on products.id = current_prices.product_id
       join chains on chains.id = current_prices.chain_id
       order by products.category_path, products.slug`
    );
  }
}
