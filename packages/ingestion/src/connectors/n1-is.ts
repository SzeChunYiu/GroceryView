import { createHash } from 'node:crypto';
import { parseIcelandicPrice as parseIcelandicPriceValue } from './icelandic-price.js';
import type { FuelGradeId, FuelPriceSourceKind } from './okq8-fuel.js';

export type N1IsFuelPriceObservation = {
  domain: 'fuel';
  productId: FuelGradeId;
  gradeLabel: string;
  pricePerLitre: number;
  unit: 'l';
  currency: 'ISK';
  chainId: 'n1-is';
  sourceKind: FuelPriceSourceKind;
  operatorName: 'N1';
  sourceUrl: string;
  observedAt: string;
  effectiveFrom: string;
  provenance: {
    source: 'n1_is_fuel_prices';
    parserVersion: typeof N1_IS_FUEL_PRICE_PARSER_VERSION;
    contentDigest: string;
    originalPriceText: string;
    originalStationName?: string;
  };
};

export const N1_IS_FUEL_PRICES_URL = 'https://www.n1.is/verd/eldsneytisverd/';
export const N1_IS_FUEL_PRICE_PARSER_VERSION = 'n1-is-fuel-prices-v1';

const fuelHeaders: Array<{ needles: string[]; productId: FuelGradeId; label: string }> = [
  { needles: ['bensín', 'bensin', '95'], productId: 'fuel-95-e10', label: 'N1 Bensín' },
  { needles: ['dísel', 'diesel'], productId: 'fuel-diesel', label: 'N1 Dísel' }
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
  return parseIcelandicPriceValue(value);
}

function headerProductId(header: string) {
  const normalized = header.toLocaleLowerCase('is-IS');
  if (normalized.includes('lituð') || normalized.includes('colored')) return undefined;
  return fuelHeaders.find((candidate) => candidate.needles.some((needle) => normalized.includes(needle))) ?? undefined;
}

export function parseN1IsFuelPricePage(input: {
  body: string;
  capturedAt: string;
  sourceUrl?: string;
}): N1IsFuelPriceObservation[] {
  const sourceUrl = input.sourceUrl ?? N1_IS_FUEL_PRICES_URL;
  if (!sourceUrl.includes('n1.is')) throw new Error('N1 IS fuel connector only accepts n1.is source URLs');
  if (/captcha|access denied|innskráning/i.test(input.body)) throw new Error('N1 IS fuel source blocked/login page');
  const digest = contentHashFor(input.body);
  const tableRows = [...input.body.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)]
    .map((row) => [...row[0].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => textFromHtml(cell[1] ?? '')))
    .filter((cells) => cells.length >= 2);
  const headerRow = tableRows.find((cells) => cells.some((cell) => headerProductId(cell)));
  if (!headerRow) return [];

  const gradeColumns = headerRow
    .map((header, index) => ({ index, spec: headerProductId(header) }))
    .filter((entry): entry is { index: number; spec: NonNullable<ReturnType<typeof headerProductId>> } => entry.spec !== undefined);
  const bestByGrade = new Map<FuelGradeId, N1IsFuelPriceObservation>();

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
        chainId: 'n1-is',
        sourceKind: 'operator_public_price_page',
        operatorName: 'N1',
        sourceUrl,
        observedAt: input.capturedAt,
        effectiveFrom: input.capturedAt.slice(0, 10),
        provenance: {
          source: 'n1_is_fuel_prices',
          parserVersion: N1_IS_FUEL_PRICE_PARSER_VERSION,
          contentDigest: digest,
          originalPriceText,
          originalStationName: stationName || undefined
        }
      });
    }
  }

  return [...bestByGrade.values()];
}

export async function fetchN1IsFuelPrices(options: {
  fetchImpl?: typeof fetch;
  capturedAt?: string;
  sourceUrl?: string;
} = {}): Promise<N1IsFuelPriceObservation[]> {
  const sourceUrl = options.sourceUrl ?? N1_IS_FUEL_PRICES_URL;
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 n1-is-connector (fixture-friendly)'
    }
  });
  if (!response.ok) {
    throw new Error(`N1 IS fuel source blocked with HTTP ${response.status}`);
  }

  return parseN1IsFuelPricePage({
    body: await response.text(),
    capturedAt: options.capturedAt ?? new Date().toISOString(),
    sourceUrl
  });
}
