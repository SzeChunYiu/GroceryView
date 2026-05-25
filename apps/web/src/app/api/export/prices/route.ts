import {
  createPgQueryExecutor,
  createPostgresPriceReader,
  type PriceObservationHistoryRecord
} from '@groceryview/db';
import { NextResponse } from 'next/server';
import { entitlementFromHeaders, hasActivePremiumEntitlement, premiumRequiredResponse } from '@/lib/entitlements';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PgPoolLike = {
  query(text: string, values: unknown[]): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
};

type PgModuleLike = {
  Pool: new (config: { connectionString: string; max: number }) => PgPoolLike;
};

const productIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const formulaInjectionPrefixPattern = /^[\t\r\n ]*[=+\-@]/;
const csvHeaders = [
  'observation_id',
  'product_id',
  'chain_id',
  'store_id',
  'price_type',
  'price',
  'regular_price',
  'unit_price',
  'currency',
  'quantity',
  'quantity_unit',
  'promotion_text',
  'promotion_starts_on',
  'promotion_ends_on',
  'member_required',
  'is_available',
  'observed_at',
  'valid_from',
  'valid_until',
  'confidence',
  'retailer_product_ref',
  'source_run_id',
  'raw_record_id',
  'provenance_json'
] as const;

let cachedDatabaseUrl: string | null = null;
let cachedPool: PgPoolLike | null = null;

function isValidProductId(productId: string | null): productId is string {
  return typeof productId === 'string' && productIdPattern.test(productId);
}

async function importPgModule(): Promise<PgModuleLike> {
  const loadModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<unknown>;
  const pgModule = await loadModule('pg') as Partial<PgModuleLike>;
  if (!pgModule.Pool) throw new Error('pg Pool export is not available.');
  return { Pool: pgModule.Pool };
}

async function executorForDatabaseUrl(databaseUrl: string) {
  if (!cachedPool || cachedDatabaseUrl !== databaseUrl) {
    if (cachedPool) await cachedPool.end();
    const pg = await importPgModule();
    cachedPool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
    cachedDatabaseUrl = databaseUrl;
  }
  return createPgQueryExecutor(cachedPool);
}

function csvCell(value: unknown) {
  if (value === undefined || value === null) return '';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  const safeText = formulaInjectionPrefixPattern.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safeText) ? `"${safeText.replace(/"/g, '""')}"` : safeText;
}

function rowForObservation(row: PriceObservationHistoryRecord) {
  return [
    row.observationId,
    row.productId,
    row.chainId,
    row.storeId,
    row.priceType,
    row.price,
    row.regularPrice,
    row.unitPrice,
    row.currency,
    row.quantity,
    row.quantityUnit,
    row.promotionText,
    row.promotionStartsOn,
    row.promotionEndsOn,
    row.memberRequired,
    row.isAvailable,
    row.observedAt,
    row.validFrom,
    row.validUntil,
    row.confidence,
    row.retailerProductRef,
    row.sourceRunId,
    row.rawRecordId,
    row.provenance
  ];
}

function priceHistoryCsv(rows: PriceObservationHistoryRecord[]) {
  return [
    csvHeaders.join(','),
    ...rows.map((row) => rowForObservation(row).map(csvCell).join(','))
  ].join('\n');
}

export async function GET(request: Request) {
  const entitlement = entitlementFromHeaders(request.headers);
  if (!hasActivePremiumEntitlement(entitlement)) {
    return NextResponse.json(premiumRequiredResponse('export_api', entitlement), { status: 402 });
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('product_id');

  if (!isValidProductId(productId)) {
    return NextResponse.json({ error: 'product_id must be a UUID' }, { status: 400 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ error: 'export_database_unconfigured' }, { status: 503 });
  }

  try {
    const executor = await executorForDatabaseUrl(databaseUrl);
    const reader = createPostgresPriceReader(executor);
    const rows = await reader.listPriceObservationHistory({ productId, limit: 1000 });
    const csv = priceHistoryCsv(rows);

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="price-history-${productId}.csv"`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Price history CSV export query failed', error instanceof Error ? { name: error.name } : { name: 'unknown' });
    return NextResponse.json({ error: 'export_query_failed' }, { status: 500 });
  }
}
