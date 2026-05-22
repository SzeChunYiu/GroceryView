import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  buildEmptyProductPriceHistoryReport,
  buildProductPriceHistoryReport,
  type ProductPriceHistoryObservationInput,
  type ProductPriceHistoryPriceType,
  type ProductPriceHistoryReport
} from '@groceryview/api';
import { PostgresQueryExecutorService } from '../database/postgres-query-executor.service.js';

export type ProductPriceHistoryFilter = {
  priceType?: ProductPriceHistoryPriceType;
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
  store_id: string | null;
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

@Injectable()
export class PriceHistoryService {
  constructor(private readonly postgres: PostgresQueryExecutorService) {}

  async getProductPriceHistory(productIdentifier: string, filter: ProductPriceHistoryFilter): Promise<ProductPriceHistoryReport | null> {
    if (!this.postgres.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required for real price-history data.');
    }

    const productRows = await this.postgres.query<ProductRow>(
      `select id, slug, canonical_name
       from products
       where slug = $1 or id::text = $1
       limit 1`,
      [productIdentifier]
    );
    const product = productRows[0];
    if (!product) return null;

    const rows = await this.postgres.query<PriceHistoryRow>(
      `select id,
              chain_id,
              store_id,
              source_run_id,
              raw_record_id,
              retailer_product_ref,
              price_type,
              price,
              regular_price,
              unit_price,
              currency,
              quantity,
              quantity_unit,
              promotion_text,
              promotion_starts_on,
              promotion_ends_on,
              member_required,
              observed_at,
              valid_from,
              valid_until,
              confidence,
              provenance
       from observations
       where product_id = $1
         and ($2::text is null or price_type = $2)
         and ($3::timestamptz is null or observed_at >= $3::timestamptz)
         and ($4::timestamptz is null or observed_at <= $4::timestamptz)
       order by observed_at desc, chain_id, store_id, price_type, id
       limit $5`,
      [
        product.id,
        filter.priceType ?? null,
        filter.observedFrom ?? null,
        filter.observedTo ?? null,
        filter.limit ?? 500
      ]
    );

    if (rows.length === 0) {
      return buildEmptyProductPriceHistoryReport({
        productId: product.id,
        productSlug: product.slug,
        productName: product.canonical_name
      });
    }

    return buildProductPriceHistoryReport(rows.map((row): ProductPriceHistoryObservationInput => ({
      observationId: row.id,
      productId: product.id,
      productSlug: product.slug,
      productName: product.canonical_name,
      chainId: row.chain_id,
      ...(row.store_id ? { storeId: row.store_id } : {}),
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
    }))) ?? buildEmptyProductPriceHistoryReport({
      productId: product.id,
      productSlug: product.slug,
      productName: product.canonical_name
    });
  }
}
