import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import {
  buildFacetedProductSearch,
  buildRealBasketComparison,
  type FacetedProductSearchFilters,
  type RealBasketCompareItem,
  type RealCatalogPriceType,
  type RealCatalogSearchPriceRow
} from '@groceryview/api';
import { PostgresQueryExecutorService } from '../database/postgres-query-executor.service.js';

type CatalogPriceSqlRow = {
  product_id: string;
  slug: string;
  canonical_name: string;
  brand: string | null;
  category_path: string[];
  package_size: string | number | null;
  package_unit: string | null;
  comparable_unit: string;
  image_url: string | null;
  observation_id: string | null;
  price: string | number | null;
  unit_price: string | number | null;
  currency: string | null;
  price_type: RealCatalogPriceType | null;
  confidence: string | number | null;
  observed_at: string | Date | null;
  chain_id: string | null;
  chain_slug: string | null;
  chain_name: string | null;
  store_id: string | null;
  store_slug: string | null;
  store_name: string | null;
};

type BasketItemSqlRow = {
  product_id: string;
  quantity: string | number;
};

const allowedPriceTypes = new Set<RealCatalogPriceType>(['shelf', 'online', 'member', 'promotion', 'receipt', 'community', 'estimated']);

function csv(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function numberQuery(value: string | undefined, label: string): number | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new BadRequestException(`${label} must be a number.`);
  return parsed;
}

function limitQuery(value: string | undefined): number {
  if (value === undefined || value.trim() === '') return 50;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new BadRequestException('limit must be a positive integer.');
  return Math.min(parsed, 100);
}

function priceTypes(value: string | undefined): RealCatalogPriceType[] {
  const parsed = csv(value) as RealCatalogPriceType[];
  for (const priceType of parsed) {
    if (!allowedPriceTypes.has(priceType)) throw new BadRequestException(`Unsupported priceType: ${priceType}.`);
  }
  return parsed;
}

function iso(value: string | Date | null): string | undefined {
  if (value === null) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

function mapCatalogRow(row: CatalogPriceSqlRow): RealCatalogSearchPriceRow {
  return {
    productId: row.product_id,
    slug: row.slug,
    canonicalName: row.canonical_name,
    ...(row.brand ? { brand: row.brand } : {}),
    categoryPath: row.category_path ?? [],
    ...(row.package_size === null ? {} : { packageSize: Number(row.package_size) }),
    ...(row.package_unit ? { packageUnit: row.package_unit } : {}),
    comparableUnit: row.comparable_unit,
    ...(row.image_url ? { imageUrl: row.image_url } : {}),
    ...(row.observation_id ? { observationId: row.observation_id } : {}),
    ...(row.price === null ? {} : { price: Number(row.price) }),
    ...(row.unit_price === null ? {} : { unitPrice: Number(row.unit_price) }),
    ...(row.currency ? { currency: row.currency.trim() } : {}),
    ...(row.price_type ? { priceType: row.price_type } : {}),
    ...(row.confidence === null ? {} : { confidence: Number(row.confidence) }),
    ...(iso(row.observed_at) ? { observedAt: iso(row.observed_at) } : {}),
    ...(row.chain_id ? { chainId: row.chain_id } : {}),
    ...(row.chain_slug ? { chainSlug: row.chain_slug } : {}),
    ...(row.chain_name ? { chainName: row.chain_name } : {}),
    ...(row.store_id ? { storeId: row.store_id } : {}),
    ...(row.store_slug ? { storeSlug: row.store_slug } : {}),
    ...(row.store_name ? { storeName: row.store_name } : {})
  };
}

@Injectable()
export class RealCatalogService {
  constructor(private readonly database: PostgresQueryExecutorService) {}

  async facetedSearch(query: {
    q?: string;
    category?: string;
    brand?: string;
    chain?: string;
    store?: string;
    priceType?: string;
    minPrice?: string;
    maxPrice?: string;
    limit?: string;
  }) {
    const filters: FacetedProductSearchFilters = {
      query: query.q?.trim() ?? '',
      categories: csv(query.category),
      brands: csv(query.brand),
      chains: csv(query.chain),
      stores: csv(query.store),
      priceTypes: priceTypes(query.priceType),
      minPrice: numberQuery(query.minPrice, 'minPrice'),
      maxPrice: numberQuery(query.maxPrice, 'maxPrice'),
      limit: limitQuery(query.limit)
    };
    if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) {
      throw new BadRequestException('minPrice must be less than or equal to maxPrice.');
    }
    this.requireDatabase();
    const categories = filters.categories ?? [];
    const brands = filters.brands ?? [];
    const chains = filters.chains ?? [];
    const stores = filters.stores ?? [];
    const priceTypeFilters = filters.priceTypes ?? [];
    const rows = await this.database.query<CatalogPriceSqlRow>(this.searchSql(), [
      filters.query,
      categories.length > 0 ? categories.map((value) => value.toLowerCase()) : null,
      brands.length > 0 ? brands.map((value) => value.toLowerCase()) : null,
      chains.length > 0 ? chains : null,
      stores.length > 0 ? stores : null,
      priceTypeFilters.length > 0 ? priceTypeFilters : null,
      filters.minPrice ?? null,
      filters.maxPrice ?? null,
      filters.limit
    ]);
    return buildFacetedProductSearch({ rows: rows.map(mapCatalogRow), filters });
  }

  async compareBasket(input: {
    userId?: string;
    items: RealBasketCompareItem[];
    storeSlugs?: string[];
    basketSource?: 'request_body' | 'weekly_baskets';
  }) {
    if (input.items.length === 0) throw new BadRequestException('items must include at least one product.');
    for (const item of input.items) {
      if (!item.productId?.trim()) throw new BadRequestException('items.productId is required.');
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) throw new BadRequestException('items.quantity must be positive.');
    }
    this.requireDatabase();

    const productRefs = [...new Set(input.items.map((item) => item.productId))];
    const storeSlugs = [...new Set((input.storeSlugs ?? []).map((storeSlug) => storeSlug.trim()).filter(Boolean))];
    const rows = await this.database.query<CatalogPriceSqlRow>(this.basketPriceSql(), [
      productRefs,
      storeSlugs.length > 0 ? storeSlugs : null
    ]);
    const mappedRows = rows.map(mapCatalogRow);
    const canonicalProductIds = new Map<string, string>();
    for (const row of mappedRows) {
      canonicalProductIds.set(row.productId, row.productId);
      canonicalProductIds.set(row.slug, row.productId);
    }
    return buildRealBasketComparison({
      userId: input.userId,
      items: input.items.map((item) => ({ ...item, productId: canonicalProductIds.get(item.productId) ?? item.productId })),
      selectedStoreSlugs: storeSlugs,
      latestPrices: mappedRows,
      basketSource: input.basketSource
    });
  }

  async compareSavedBasket(userId: string, storeSlugs?: string[]) {
    this.requireDatabase();
    const basketRows = await this.database.query<BasketItemSqlRow>(
      `with latest_basket as (
         select id
         from weekly_baskets
         where user_id = $1
         order by week_start desc, id desc
         limit 1
       )
       select bi.product_id, bi.quantity
       from latest_basket lb
       join basket_items bi on bi.basket_id = lb.id
       order by bi.id`,
      [userId]
    );
    if (basketRows.length === 0) throw new NotFoundException('Saved basket not found.');
    return this.compareBasket({
      userId,
      storeSlugs,
      basketSource: 'weekly_baskets',
      items: basketRows.map((row) => ({ productId: row.product_id, quantity: Number(row.quantity) }))
    });
  }

  private searchSql(): string {
    return `with matched_products as (
        select products.id
        from products
        cross join (select nullif(trim($1::text), '') as term) as search
        where (
            search.term is null
            or products.barcode = search.term
            or products.canonical_name ilike '%' || search.term || '%'
            or products.slug ilike '%' || search.term || '%'
            or exists (
              select 1
              from aliases
              where aliases.product_id = products.id
                and aliases.normalized_alias ilike '%' || lower(search.term) || '%'
            )
          )
          and ($2::text[] is null or exists (select 1 from unnest(products.category_path) category where lower(category) = any($2::text[])))
          and ($3::text[] is null or lower(coalesce(products.brand, '')) = any($3::text[]))
          and (
            ($4::text[] is null and $5::text[] is null and $6::text[] is null and $7::numeric is null and $8::numeric is null)
            or exists (
              select 1
              from latest_prices filter_prices
              left join chains filter_chains on filter_chains.id = filter_prices.chain_id
              left join stores filter_stores on filter_stores.id = filter_prices.store_id
              where filter_prices.product_id = products.id
                and ($4::text[] is null or filter_chains.slug = any($4::text[]))
                and ($5::text[] is null or filter_stores.slug = any($5::text[]))
                and ($6::text[] is null or filter_prices.price_type = any($6::text[]))
                and ($7::numeric is null or filter_prices.price >= $7::numeric)
                and ($8::numeric is null or filter_prices.price <= $8::numeric)
            )
          )
        order by products.canonical_name, products.slug
        limit $9
      )
      select products.id::text as product_id,
             products.slug,
             products.canonical_name,
             products.brand,
             products.category_path,
             products.package_size,
             products.package_unit,
             products.comparable_unit,
             products.image_url,
             latest_prices.observation_id::text,
             latest_prices.price,
             latest_prices.unit_price,
             latest_prices.currency,
             latest_prices.price_type,
             latest_prices.confidence,
             latest_prices.observed_at,
             chains.id::text as chain_id,
             chains.slug as chain_slug,
             chains.name as chain_name,
             stores.id::text as store_id,
             stores.slug as store_slug,
             stores.name as store_name
      from matched_products
      join products on products.id = matched_products.id
      left join latest_prices on latest_prices.product_id = products.id
      left join chains on chains.id = latest_prices.chain_id
      left join stores on stores.id = latest_prices.store_id
      where ($4::text[] is null or chains.slug = any($4::text[]))
        and ($5::text[] is null or stores.slug = any($5::text[]))
        and ($6::text[] is null or latest_prices.price_type = any($6::text[]))
        and ($7::numeric is null or latest_prices.price >= $7::numeric)
        and ($8::numeric is null or latest_prices.price <= $8::numeric)
      order by products.canonical_name, latest_prices.price nulls last, stores.name nulls last`;
  }

  private requireDatabase(): void {
    if (!this.database.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required for real catalog search and basket comparison data.');
    }
  }

  private basketPriceSql(): string {
    return `select products.id::text as product_id,
             products.slug,
             products.canonical_name,
             products.brand,
             products.category_path,
             products.package_size,
             products.package_unit,
             products.comparable_unit,
             products.image_url,
             latest_prices.observation_id::text,
             latest_prices.price,
             latest_prices.unit_price,
             latest_prices.currency,
             latest_prices.price_type,
             latest_prices.confidence,
             latest_prices.observed_at,
             chains.id::text as chain_id,
             chains.slug as chain_slug,
             chains.name as chain_name,
             stores.id::text as store_id,
             stores.slug as store_slug,
             stores.name as store_name
      from products
      left join latest_prices on latest_prices.product_id = products.id
      left join chains on chains.id = latest_prices.chain_id
      left join stores on stores.id = latest_prices.store_id
      where (products.id::text = any($1::text[]) or products.slug = any($1::text[]))
        and latest_prices.price_type in ('shelf', 'online', 'member', 'promotion')
        and ($2::text[] is null or stores.slug = any($2::text[]))
      order by products.canonical_name, latest_prices.price nulls last, stores.name nulls last`;
  }
}
