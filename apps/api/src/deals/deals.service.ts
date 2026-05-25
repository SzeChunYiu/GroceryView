import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  buildFlyerOfferReport,
  type FlyerOfferObservationInput,
  type FlyerOfferReport,
  type StoreFlyerOfferReport
} from '@groceryview/api';
import {
  queryRollingAverageDealReport,
  type RollingAverageDealReport
} from '@groceryview/db';
import { PostgresQueryExecutorService } from '../database/postgres-query-executor.service.js';

type FlyerOfferSqlRow = {
  observation_id: string;
  source_run_id: string | null;
  raw_record_id: string | null;
  price_type: 'promotion' | 'member';
  price: string | number;
  regular_price: string | number;
  currency: 'SEK';
  promotion_text: string | null;
  promotion_starts_on: string | Date | null;
  promotion_ends_on: string | Date | null;
  member_required: boolean;
  observed_at: string | Date;
  valid_from: string | Date | null;
  valid_until: string | Date | null;
  confidence: string | number;
  provenance: Record<string, unknown> | string | null;
  product_id: string;
  product_slug: string;
  product_name: string;
  category_path: string[];
  chain_id: string;
  chain_slug: string;
  chain_name: string;
  store_id: string;
  store_slug: string;
  store_name: string;
  store_city: string | null;
};

type StoreFlyerSqlRow = {
  store_slug: string;
  store_name: string;
  chain_slug: string;
};

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

function optionalIso(value: string | Date | null): string | undefined {
  return value === null ? undefined : iso(value);
}

function provenanceRecord(value: Record<string, unknown> | string | null): Record<string, unknown> {
  if (!value) return {};
  return typeof value === 'string' ? JSON.parse(value) as Record<string, unknown> : value;
}

function mapRow(row: FlyerOfferSqlRow): FlyerOfferObservationInput {
  return {
    observationId: row.observation_id,
    ...(row.source_run_id ? { sourceRunId: row.source_run_id } : {}),
    ...(row.raw_record_id ? { rawRecordId: row.raw_record_id } : {}),
    priceType: row.price_type,
    price: Number(row.price),
    regularPrice: Number(row.regular_price),
    currency: row.currency,
    ...(row.promotion_text ? { promotionText: row.promotion_text } : {}),
    ...(optionalIso(row.promotion_starts_on) ? { promotionStartsOn: optionalIso(row.promotion_starts_on) } : {}),
    ...(optionalIso(row.promotion_ends_on) ? { promotionEndsOn: optionalIso(row.promotion_ends_on) } : {}),
    memberRequired: row.member_required,
    observedAt: iso(row.observed_at),
    ...(optionalIso(row.valid_from) ? { validFrom: optionalIso(row.valid_from) } : {}),
    ...(optionalIso(row.valid_until) ? { validUntil: optionalIso(row.valid_until) } : {}),
    confidence: Number(row.confidence),
    provenance: provenanceRecord(row.provenance),
    productId: row.product_id,
    productSlug: row.product_slug,
    productName: row.product_name,
    categoryPath: row.category_path ?? [],
    chainId: row.chain_id,
    chainSlug: row.chain_slug,
    chainName: row.chain_name,
    storeId: row.store_id,
    storeSlug: row.store_slug,
    storeName: row.store_name,
    ...(row.store_city ? { storeCity: row.store_city } : {})
  };
}

@Injectable()
export class DealsService {
  constructor(private readonly postgres: PostgresQueryExecutorService) {}

  isConfigured(): boolean {
    return this.postgres.isConfigured();
  }

  async flyerOffers(query: {
    asOf?: string;
    storeId?: string;
    chain?: string;
    category?: string;
    productId?: string;
  }): Promise<FlyerOfferReport> {
    if (!this.postgres.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required for real flyer-offer data.');
    }
    const asOf = query.asOf ?? new Date().toISOString();
    const rows = await this.postgres.query<FlyerOfferSqlRow>(
      `select observations.id::text as observation_id,
              observations.source_run_id::text,
              observations.raw_record_id::text,
              observations.price_type,
              observations.price,
              observations.regular_price,
              observations.currency,
              observations.promotion_text,
              observations.promotion_starts_on,
              observations.promotion_ends_on,
              observations.member_required,
              observations.observed_at,
              observations.valid_from,
              observations.valid_until,
              observations.confidence,
              observations.provenance,
              products.id::text as product_id,
              products.slug as product_slug,
              products.canonical_name as product_name,
              products.category_path,
              chains.id::text as chain_id,
              chains.slug as chain_slug,
              chains.name as chain_name,
              stores.id::text as store_id,
              stores.slug as store_slug,
              stores.name as store_name,
              stores.city as store_city
       from observations
       join products on products.id = observations.product_id
       join chains on chains.id = observations.chain_id
       join stores on stores.id = observations.store_id
       where observations.price_type in ('promotion', 'member')
         and observations.regular_price is not null
         and observations.price < observations.regular_price
         and ($1::timestamptz >= coalesce(observations.valid_from, observations.promotion_starts_on::timestamptz, observations.observed_at))
         and ($1::timestamptz <= coalesce(observations.valid_until, (observations.promotion_ends_on::timestamptz + interval '1 day' - interval '1 millisecond'), observations.observed_at))
         and ($2::text is null or stores.slug = $2)
         and ($3::text is null or chains.slug = $3)
         and ($4::text is null or exists (select 1 from unnest(products.category_path) category where lower(category) = lower($4::text)))
         and ($5::text is null or products.slug = $5 or products.id::text = $5)
       order by observations.observed_at desc, stores.name, products.canonical_name`,
      [
        asOf,
        query.storeId ?? null,
        query.chain ?? null,
        query.category ?? null,
        query.productId ?? null
      ]
    );
    return buildFlyerOfferReport({
      asOf,
      filters: {
        ...(query.storeId ? { storeId: query.storeId } : {}),
        ...(query.chain ? { chain: query.chain } : {}),
        ...(query.category ? { category: query.category } : {}),
        ...(query.productId ? { productId: query.productId } : {})
      },
      observations: rows.map(mapRow)
    });
  }

  async rollingAverageDeals(query: { category?: string } = {}): Promise<RollingAverageDealReport> {
    if (!this.postgres.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required for real deal data.');
    }

    return queryRollingAverageDealReport(this.postgres, query);
  }

  async storeFlyerOffers(storeId: string, query: { asOf?: string }): Promise<StoreFlyerOfferReport | null> {
    if (!this.postgres.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required for real flyer-offer data.');
    }
    const stores = await this.postgres.query<StoreFlyerSqlRow>(
      `select stores.slug as store_slug,
              stores.name as store_name,
              chains.slug as chain_slug
       from stores
       join chains on chains.id = stores.chain_id
       where stores.slug = $1`,
      [storeId]
    );
    const store = stores[0];
    if (!store) return null;

    const report = await this.flyerOffers({ asOf: query.asOf, storeId });
    return {
      storeId: store.store_slug,
      storeName: store.store_name,
      chain: store.chain_slug,
      asOf: report.asOf,
      offerCount: report.offerCount,
      categoryCount: new Set(report.offers.map((offer) => offer.category)).size,
      totalOneEachSavings: report.offers.reduce(
        (sum, offer) => Math.round((sum + offer.savings + Number.EPSILON) * 100) / 100,
        0
      ),
      bestOffer: report.offers[0] ?? null,
      offers: report.offers,
      guardrails: report.guardrails
    };
  }
}
