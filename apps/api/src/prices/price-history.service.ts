import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  buildEmptyProductPriceHistoryReport,
  buildProductPriceHistoryReport,
  type ProductPriceHistoryEvidenceTable,
  type ProductPriceHistoryObservationInput,
  type ProductPriceHistoryPriceType,
  type ProductPriceHistoryReport
} from '@groceryview/api';
import { PostgresQueryExecutorService } from '../database/postgres-query-executor.service.js';
import { localizedProductNameSql, type ProductNameLocale } from '../product-name-locale.js';

export type ProductPriceHistoryFilter = {
  priceType?: ProductPriceHistoryPriceType;
  chain?: string;
  store?: string;
  sourceRun?: string;
  minConfidence?: number;
  observedFrom?: string;
  observedTo?: string;
  limit?: number;
};

type ProductRow = {
  id: string;
  slug: string;
  canonical_name: string;
};

type PriceHistoryRow = {
  id: string;
  chain_id: string;
  chain_slug: string | null;
  chain_name: string | null;
  store_id: string | null;
  store_slug: string | null;
  store_name: string | null;
  source_run_id: string | null;
  raw_record_id: string | null;
  retailer_product_ref: string | null;
  price_type: ProductPriceHistoryPriceType;
  price: string | number;
  regular_price: string | number | null;
  unit_price: string | number;
  currency: 'SEK';
  quantity: string | number | null;
  quantity_unit: string | null;
  promotion_text: string | null;
  promotion_starts_on: string | Date | null;
  promotion_ends_on: string | Date | null;
  member_required: boolean;
  observed_at: string | Date;
  valid_from: string | Date | null;
  valid_until: string | Date | null;
  confidence: string | number;
  provenance: Record<string, unknown> | string | null;
};

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

function optionalIso(value: string | Date | null): string | undefined {
  return value === null ? undefined : iso(value);
}

function optionalNumber(value: string | number | null): number | undefined {
  return value === null ? undefined : Number(value);
}

function provenanceRecord(value: Record<string, unknown> | string | null): Record<string, unknown> {
  if (!value) return {};
  return typeof value === 'string' ? JSON.parse(value) as Record<string, unknown> : value;
}

const productPriceHistorySourceTables = ['products', 'observations', 'chains', 'stores'] as const satisfies readonly ProductPriceHistoryEvidenceTable[];

@Injectable()
export class PriceHistoryService {
  constructor(private readonly postgres: PostgresQueryExecutorService) {}

  async getProductPriceHistory(
    productIdentifier: string,
    filter: ProductPriceHistoryFilter,
    productNameLocale?: ProductNameLocale
  ): Promise<ProductPriceHistoryReport | null> {
    if (!this.postgres.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required for real price-history data.');
    }

    const productName = localizedProductNameSql('$2');
    const productRows = await this.postgres.query<ProductRow>(
      `select id, slug, ${productName} as canonical_name
       from products
       where slug = $1 or id::text = $1
       limit 1`,
      [productIdentifier, productNameLocale ?? null]
    );
    const product = productRows[0];
    if (!product) return null;

    const rows = await this.postgres.query<PriceHistoryRow>(
      `select observations.id::text as id,
              observations.chain_id::text as chain_id,
              chains.slug as chain_slug,
              chains.name as chain_name,
              observations.store_id::text as store_id,
              stores.slug as store_slug,
              stores.name as store_name,
              observations.source_run_id::text as source_run_id,
              observations.raw_record_id::text as raw_record_id,
              observations.retailer_product_ref,
              observations.price_type,
              observations.price,
              observations.regular_price,
              observations.unit_price,
              observations.currency,
              observations.quantity,
              observations.quantity_unit,
              observations.promotion_text,
              observations.promotion_starts_on,
              observations.promotion_ends_on,
              observations.member_required,
              observations.observed_at,
              observations.valid_from,
              observations.valid_until,
              observations.confidence,
              observations.provenance
       from observations
       left join chains on chains.id = observations.chain_id
       left join stores on stores.id = observations.store_id
       where observations.product_id = $1
         and ($2::text is null or observations.price_type = $2)
         and ($3::text is null or chains.slug = $3 or observations.chain_id::text = $3)
         and ($4::text is null or stores.slug = $4 or observations.store_id::text = $4)
         and ($5::text is null or observations.source_run_id::text = $5)
         and ($6::timestamptz is null or observations.observed_at >= $6::timestamptz)
         and ($7::timestamptz is null or observations.observed_at <= $7::timestamptz)
         and ($8::numeric is null or observations.confidence >= $8::numeric)
       order by observations.observed_at desc, chains.slug, stores.name, observations.price_type, observations.id
       limit $9`,
      [
        product.id,
        filter.priceType ?? null,
        filter.chain ?? null,
        filter.store ?? null,
        filter.sourceRun ?? null,
        filter.observedFrom ?? null,
        filter.observedTo ?? null,
        filter.minConfidence ?? null,
        filter.limit ?? 500
      ]
    );

    if (rows.length === 0) {
      return buildEmptyProductPriceHistoryReport({
        productId: product.id,
        productSlug: product.slug,
        productName: product.canonical_name
      }, filter, { sourceTables: productPriceHistorySourceTables });
    }

    return buildProductPriceHistoryReport(rows.map((row): ProductPriceHistoryObservationInput => ({
      observationId: row.id,
      productId: product.id,
      productSlug: product.slug,
      productName: product.canonical_name,
      chainId: row.chain_id,
      ...(row.chain_slug ? { chainSlug: row.chain_slug } : {}),
      ...(row.chain_name ? { chainName: row.chain_name } : {}),
      ...(row.store_id ? { storeId: row.store_id } : {}),
      ...(row.store_slug ? { storeSlug: row.store_slug } : {}),
      ...(row.store_name ? { storeName: row.store_name } : {}),
      ...(row.source_run_id ? { sourceRunId: row.source_run_id } : {}),
      ...(row.raw_record_id ? { rawRecordId: row.raw_record_id } : {}),
      ...(row.retailer_product_ref ? { retailerProductRef: row.retailer_product_ref } : {}),
      priceType: row.price_type,
      price: Number(row.price),
      ...(optionalNumber(row.regular_price) === undefined ? {} : { regularPrice: optionalNumber(row.regular_price) }),
      unitPrice: Number(row.unit_price),
      currency: row.currency,
      ...(optionalNumber(row.quantity) === undefined ? {} : { quantity: optionalNumber(row.quantity) }),
      ...(row.quantity_unit ? { quantityUnit: row.quantity_unit } : {}),
      ...(row.promotion_text ? { promotionText: row.promotion_text } : {}),
      ...(optionalIso(row.promotion_starts_on) ? { promotionStartsOn: optionalIso(row.promotion_starts_on) } : {}),
      ...(optionalIso(row.promotion_ends_on) ? { promotionEndsOn: optionalIso(row.promotion_ends_on) } : {}),
      memberRequired: row.member_required,
      observedAt: iso(row.observed_at),
      ...(optionalIso(row.valid_from) ? { validFrom: optionalIso(row.valid_from) } : {}),
      ...(optionalIso(row.valid_until) ? { validUntil: optionalIso(row.valid_until) } : {}),
      confidence: Number(row.confidence),
      provenance: provenanceRecord(row.provenance)
    })), filter) ?? buildEmptyProductPriceHistoryReport({
      productId: product.id,
      productSlug: product.slug,
      productName: product.canonical_name
    }, filter, { sourceTables: productPriceHistorySourceTables });
  }
}
