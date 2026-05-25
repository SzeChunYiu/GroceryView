import { createHash } from 'node:crypto';
import type { FuelGradeId, FuelPriceSourceKind } from './okq8-fuel.js';

export type ObIsFuelPriceObservation = {
  domain: 'fuel';
  productId: FuelGradeId;
  gradeLabel: string;
  pricePerLitre: number;
  unit: 'l';
  currency: 'ISK';
  chainId: 'ob-is';
  sourceKind: FuelPriceSourceKind;
  operatorName: 'ÓB';
  sourceUrl: string;
  observedAt: string;
  effectiveFrom: string;
  provenance: {
    source: 'ob_is_fuel_prices';
    parserVersion: typeof OB_IS_FUEL_PRICE_PARSER_VERSION;
    contentDigest: string;
    originalPriceText: string;
    originalStationName?: string;
  };
};

export const OB_IS_FUEL_PRICES_URL = 'https://olis.ob.is/eldsneytisverd';
export const OB_IS_FUEL_PRICE_PARSER_VERSION = 'ob-is-fuel-prices-v1';

const fuelHeaders: Array<{ needles: string[]; productId: FuelGradeId; label: string }> = [
  { needles: ['bensín', 'bensin', 'petrol'], productId: 'fuel-95-e10', label: 'ÓB Bensín' },
  { needles: ['dísel', 'diesel'], productId: 'fuel-diesel', label: 'ÓB Dísel' }
];

function contentHashFor(body: string) {
  return `sha256:${createHash('sha256').update(body).digest('hex')}`;
}

function textFromHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseIcelandicPrice(value: string) {
  const match = value.replace(/\./g, '').match(/(\d+(?:,\d+)?)/);
  return match ? Number(match[1]!.replace(',', '.')) : undefined;
}

function headerProductId(header: string) {
  const normalized = header.toLocaleLowerCase('is-IS');
  if (normalized.includes('lituð') || normalized.includes('colored')) return undefined;
  return fuelHeaders.find((candidate) => candidate.needles.some((needle) => normalized.includes(needle))) ?? undefined;
}

export function parseObIsFuelPricePage(input: {
  body: string;
  capturedAt: string;
  sourceUrl?: string;
}): ObIsFuelPriceObservation[] {
  const sourceUrl = input.sourceUrl ?? OB_IS_FUEL_PRICES_URL;
  const digest = contentHashFor(input.body);
  const tableRows = [...input.body.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)]
    .map((row) => [...row[0].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => textFromHtml(cell[1] ?? '')))
    .filter((cells) => cells.length >= 2);
  const headerRow = tableRows.find((cells) => cells.some((cell) => headerProductId(cell)));
  if (!headerRow) return [];

  const gradeColumns = headerRow
    .map((header, index) => ({ index, spec: headerProductId(header) }))
    .filter((entry): entry is { index: number; spec: NonNullable<ReturnType<typeof headerProductId>> } => entry.spec !== undefined);
  const bestByGrade = new Map<FuelGradeId, ObIsFuelPriceObservation>();

  for (const cells of tableRows.slice(tableRows.indexOf(headerRow) + 1)) {
    const stationName = cells[0]?.trim();
    for (const { index, spec } of gradeColumns) {
      const originalPriceText = cells[index] ?? '';
      const price = parseIcelandicPrice(originalPriceText);
      if (price === undefined) continue;
      const current = bestByGrade.get(spec.productId);
      if (current && current.pricePerLitre <= price) continue;
      bestByGrade.set(spec.productId, {
        domain: 'fuel',
        productId: spec.productId,
        gradeLabel: spec.label,
        pricePerLitre: price,
        unit: 'l',
        currency: 'ISK',
        chainId: 'ob-is',
        sourceKind: 'operator_public_price_page',
        operatorName: 'ÓB',
        sourceUrl,
        observedAt: input.capturedAt,
        effectiveFrom: input.capturedAt.slice(0, 10),
        provenance: {
          source: 'ob_is_fuel_prices',
          parserVersion: OB_IS_FUEL_PRICE_PARSER_VERSION,
          contentDigest: digest,
          originalPriceText,
          originalStationName: stationName || undefined
        }
      });
    }
  }

  return [...bestByGrade.values()];
}

export async function fetchObIsFuelPrices(options: {
  fetchImpl?: typeof fetch;
  capturedAt?: string;
  sourceUrl?: string;
} = {}): Promise<ObIsFuelPriceObservation[]> {
  const sourceUrl = options.sourceUrl ?? OB_IS_FUEL_PRICES_URL;
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(sourceUrl);
  if (!response.ok) {
    throw new Error(`OB IS fuel source blocked with HTTP ${response.status}`);
  }

  return parseObIsFuelPricePage({
    body: await response.text(),
    capturedAt: options.capturedAt ?? new Date().toISOString(),
    sourceUrl
  });
}
