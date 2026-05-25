import { createHash } from 'node:crypto';
import type { FuelGradeId, FuelPriceSourceKind } from './okq8-fuel.js';

export type SkeljungurIsFuelPriceObservation = {
  domain: 'fuel';
  productId: FuelGradeId;
  gradeLabel: string;
  pricePerLitre: number;
  unit: 'l';
  currency: 'ISK';
  chainId: 'skeljungur-is';
  sourceKind: FuelPriceSourceKind;
  operatorName: 'Skeljungur';
  sourceUrl: string;
  observedAt: string;
  effectiveFrom: string;
  provenance: {
    source: 'skeljungur_is_fuel_prices';
    parserVersion: typeof SKELJUNGUR_IS_FUEL_PRICE_PARSER_VERSION;
    contentDigest: string;
    originalItemName: string;
    originalPriceText: string;
    sourceExecutionTime?: string;
  };
};

export type SkeljungurIsPriceListData = {
  executiontime?: string;
  items?: Array<{
    ItemName?: string;
    Price?: string | number;
  }>;
  error?: string;
};

export const SKELJUNGUR_IS_FUEL_PRICES_URL = 'https://www.skeljungur.is/listaverd-eldsneytis';
export const SKELJUNGUR_IS_FUEL_PRICES_API_URL = 'https://www.skeljungur.is/api/pricelistdata';
export const SKELJUNGUR_IS_FUEL_PRICE_PARSER_VERSION = 'skeljungur-is-fuel-prices-v1';

const fuelItems: Array<{
  needles: string[];
  productId: FuelGradeId;
  label: string;
}> = [
  { needles: ['bensín 95', 'bensin 95', '95 okt'], productId: 'fuel-95-e10', label: 'Skeljungur Bensín 95 okt' },
  { needles: ['bensín 98', 'bensin 98', '98 okt'], productId: 'fuel-98', label: 'Skeljungur Bensín 98 okt' },
  { needles: ['diesel', 'dísel'], productId: 'fuel-diesel', label: 'Skeljungur Gasolía-Diesel' }
];

function contentHashFor(body: string) {
  return `sha256:${createHash('sha256').update(body).digest('hex')}`;
}

function normalizeIcelandicText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('is-IS')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseIcelandicPrice(value: string | number) {
  const raw = String(value).trim();
  const normalized = /^\d{1,3}(?:\.\d{3})+,\d+$/.test(raw) ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(',', '.');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Invalid Skeljungur IS fuel price: ${value}`);
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}

function itemSpecFor(name: string) {
  const normalized = normalizeIcelandicText(name);
  if (normalized.includes('lifdiesel') || normalized.includes('skipagasolia')) return undefined;
  return fuelItems.find((candidate) => candidate.needles.some((needle) => normalized.includes(normalizeIcelandicText(needle))));
}

function assertSkeljungurSourceUrl(sourceUrl: string) {
  const host = new URL(sourceUrl).hostname;
  if (host !== 'www.skeljungur.is' && host !== 'skeljungur.is') {
    throw new Error('Skeljungur IS fuel connector only accepts skeljungur.is source URLs');
  }
}

function parsePayload(body: string | SkeljungurIsPriceListData) {
  if (typeof body !== 'string') return { payload: body, rawBody: JSON.stringify(body) };
  return { payload: JSON.parse(body) as SkeljungurIsPriceListData, rawBody: body };
}

export function parseSkeljungurIsFuelPriceData(input: {
  body: string | SkeljungurIsPriceListData;
  capturedAt: string;
  sourceUrl?: string;
  effectiveDate?: string;
}): SkeljungurIsFuelPriceObservation[] {
  const sourceUrl = input.sourceUrl ?? SKELJUNGUR_IS_FUEL_PRICES_API_URL;
  assertSkeljungurSourceUrl(sourceUrl);
  const { payload, rawBody } = parsePayload(input.body);
  if (payload.error) throw new Error(`Skeljungur IS fuel source returned error: ${payload.error}`);
  if (!Array.isArray(payload.items)) return [];

  const digest = contentHashFor(rawBody);
  const effectiveFrom = input.effectiveDate ?? input.capturedAt.slice(0, 10);
  const rows = new Map<FuelGradeId, SkeljungurIsFuelPriceObservation>();

  for (const item of payload.items) {
    if (!item.ItemName || item.Price === undefined) continue;
    const spec = itemSpecFor(item.ItemName);
    if (!spec) continue;
    rows.set(spec.productId, {
      domain: 'fuel',
      productId: spec.productId,
      gradeLabel: spec.label,
      pricePerLitre: parseIcelandicPrice(item.Price),
      unit: 'l',
      currency: 'ISK',
      chainId: 'skeljungur-is',
      sourceKind: 'operator_public_price_page',
      operatorName: 'Skeljungur',
      sourceUrl,
      observedAt: input.capturedAt,
      effectiveFrom,
      provenance: {
        source: 'skeljungur_is_fuel_prices',
        parserVersion: SKELJUNGUR_IS_FUEL_PRICE_PARSER_VERSION,
        contentDigest: digest,
        originalItemName: item.ItemName,
        originalPriceText: String(item.Price),
        sourceExecutionTime: payload.executiontime
      }
    });
  }

  return [...rows.values()];
}

function sourceUrlWithDate(sourceUrl: string, effectiveDate: string) {
  const url = new URL(sourceUrl);
  url.searchParams.set('date', effectiveDate);
  return url.toString();
}

export async function fetchSkeljungurIsFuelPrices(options: {
  fetchImpl?: typeof fetch;
  capturedAt?: string;
  effectiveDate?: string;
  sourceUrl?: string;
} = {}): Promise<SkeljungurIsFuelPriceObservation[]> {
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const effectiveDate = options.effectiveDate ?? capturedAt.slice(0, 10);
  const sourceUrl = sourceUrlWithDate(options.sourceUrl ?? SKELJUNGUR_IS_FUEL_PRICES_API_URL, effectiveDate);
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'application/json',
      'user-agent': 'GroceryView/0.1 skeljungur-is-connector (fixture-friendly)'
    }
  });
  if (!response.ok) {
    throw new Error(`Skeljungur IS fuel source blocked with HTTP ${response.status}`);
  }

  return parseSkeljungurIsFuelPriceData({
    body: await response.text(),
    capturedAt,
    sourceUrl,
    effectiveDate
  });
}
