import { createHash } from 'node:crypto';
import type { FuelGradeId, FuelPriceSourceKind } from './okq8-fuel.js';

export type AtlantsoliaIsFuelPriceObservation = {
  domain: 'fuel';
  productId: FuelGradeId;
  gradeLabel: string;
  pricePerLitre: number;
  unit: 'l';
  currency: 'ISK';
  chainId: 'atlantsolia-is';
  sourceKind: FuelPriceSourceKind;
  operatorName: 'Atlantsolía';
  channel: 'store';
  store_id: string;
  is_member_price: boolean;
  membershipProgram?: 'Atlantsolía app/dælulykill';
  memberDiscountIskPerLitre?: 11;
  is_subscription_price: false;
  is_coupon_price: false;
  is_clearance: false;
  sourceUrl: string;
  observedAt: string;
  effectiveFrom: string;
  provenance: {
    source: 'atlantsolia_is_fuel_prices';
    parserVersion: typeof ATLANTSOLIA_IS_FUEL_PRICE_PARSER_VERSION;
    contentDigest: string;
    originalPriceText: string;
    originalStationName?: string;
    originalStationHref?: string;
  };
};

export const ATLANTSOLIA_IS_FUEL_PRICES_URL = 'https://www.atlantsolia.is/stodvar/';
export const ATLANTSOLIA_IS_FUEL_PRICE_PARSER_VERSION = 'atlantsolia-is-fuel-prices-v1';
export const ATLANTSOLIA_IS_MEMBER_DISCOUNT_ISK_PER_LITRE = 11;

const fuelHeaders: Array<{ needles: string[]; productId: FuelGradeId; label: string }> = [
  { needles: ['95 okt', 'bensín', 'bensin', '95'], productId: 'fuel-95-e10', label: 'Atlantsolía 95 Okt.' },
  { needles: ['dísel', 'diesel'], productId: 'fuel-diesel', label: 'Atlantsolía Dísel' }
];
const noMemberDiscountStations = new Set(['kaplakriki', 'sprengisandur', 'oskjuhlid', 'selfoss', 'akureyri-baldursnes']);

function contentHashFor(body: string) {
  return `sha256:${createHash('sha256').update(body).digest('hex')}`;
}

function textFromHtml(value: string) {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function parseIcelandicPrice(value: string) {
  const match = value.replace(/\./g, '').match(/(\d+(?:,\d+)?)/);
  return match ? Number(match[1]!.replace(',', '.')) : undefined;
}

function headerProductId(header: string) {
  const normalized = header.toLocaleLowerCase('is-IS');
  if (normalized.includes('rafmagn') || normalized.includes('kwh')) return undefined;
  return fuelHeaders.find((candidate) => candidate.needles.some((needle) => normalized.includes(needle))) ?? undefined;
}

function stationIdFromCell(cellHtml: string, stationName: string) {
  const href = cellHtml.match(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/i)?.[1];
  const slugFromHref = href?.match(/\/stodvar\/([^/]+)\/?/i)?.[1];
  if (slugFromHref) return slugFromHref;
  return stationName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('is-IS')
    .replace(/ð/g, 'd')
    .replace(/þ/g, 'th')
    .replace(/æ/g, 'ae')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function stationHrefFromCell(cellHtml: string, sourceUrl: string) {
  const href = cellHtml.match(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/i)?.[1];
  return href ? new URL(decodeHtml(href), sourceUrl).toString() : undefined;
}

function buildFuelRow(input: {
  capturedAt: string;
  digest: string;
  sourceUrl: string;
  spec: NonNullable<ReturnType<typeof headerProductId>>;
  price: number;
  originalPriceText: string;
  stationName: string;
  storeId: string;
  stationHref?: string;
  isMemberPrice: boolean;
}): AtlantsoliaIsFuelPriceObservation {
  return {
    domain: 'fuel',
    productId: input.spec.productId,
    gradeLabel: input.spec.label,
    pricePerLitre: input.isMemberPrice
      ? Math.round((input.price - ATLANTSOLIA_IS_MEMBER_DISCOUNT_ISK_PER_LITRE + Number.EPSILON) * 100) / 100
      : input.price,
    unit: 'l',
    currency: 'ISK',
    chainId: 'atlantsolia-is',
    sourceKind: 'operator_public_price_page',
    operatorName: 'Atlantsolía',
    channel: 'store',
    store_id: `atlantsolia-is-${input.storeId}`,
    is_member_price: input.isMemberPrice,
    ...(input.isMemberPrice
      ? {
          membershipProgram: 'Atlantsolía app/dælulykill' as const,
          memberDiscountIskPerLitre: ATLANTSOLIA_IS_MEMBER_DISCOUNT_ISK_PER_LITRE as const
        }
      : {}),
    is_subscription_price: false,
    is_coupon_price: false,
    is_clearance: false,
    sourceUrl: input.sourceUrl,
    observedAt: input.capturedAt,
    effectiveFrom: input.capturedAt.slice(0, 10),
    provenance: {
      source: 'atlantsolia_is_fuel_prices',
      parserVersion: ATLANTSOLIA_IS_FUEL_PRICE_PARSER_VERSION,
      contentDigest: input.digest,
      originalPriceText: input.originalPriceText,
      originalStationName: input.stationName || undefined,
      originalStationHref: input.stationHref
    }
  };
}

export function parseAtlantsoliaIsFuelPricePage(input: {
  body: string;
  capturedAt: string;
  sourceUrl?: string;
}): AtlantsoliaIsFuelPriceObservation[] {
  const sourceUrl = input.sourceUrl ?? ATLANTSOLIA_IS_FUEL_PRICES_URL;
  if (!sourceUrl.includes('atlantsolia.is')) throw new Error('Atlantsolía IS fuel connector only accepts atlantsolia.is source URLs');
  if (/access denied|innskráning/i.test(input.body)) throw new Error('Atlantsolía IS fuel source blocked/login page');
  const digest = contentHashFor(input.body);
  const tableRows = [...input.body.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)]
    .map((row) =>
      [...row[0].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => ({
        html: cell[1] ?? '',
        text: textFromHtml(cell[1] ?? '')
      }))
    )
    .filter((cells) => cells.length >= 2);
  const headerRow = tableRows.find((cells) => cells.some((cell) => headerProductId(cell.text)));
  if (!headerRow) return [];

  const gradeColumns = headerRow
    .map((header, index) => ({ index, spec: headerProductId(header.text) }))
    .filter((entry): entry is { index: number; spec: NonNullable<ReturnType<typeof headerProductId>> } => entry.spec !== undefined);
  const rows: AtlantsoliaIsFuelPriceObservation[] = [];

  for (const cells of tableRows.slice(tableRows.indexOf(headerRow) + 1)) {
    const stationName = cells[0]?.text.trim() ?? '';
    if (!stationName) continue;
    const storeId = stationIdFromCell(cells[0]?.html ?? '', stationName);
    const stationHref = stationHrefFromCell(cells[0]?.html ?? '', sourceUrl);
    const emitsMemberDiscount = !noMemberDiscountStations.has(storeId);
    for (const { index, spec } of gradeColumns) {
      const originalPriceText = cells[index]?.text ?? '';
      const price = parseIcelandicPrice(originalPriceText);
      if (price === undefined) continue;
      rows.push(
        buildFuelRow({
          capturedAt: input.capturedAt,
          digest,
          sourceUrl,
          spec,
          price,
          originalPriceText,
          stationName,
          storeId,
          stationHref,
          isMemberPrice: false
        })
      );
      if (emitsMemberDiscount) {
        rows.push(
          buildFuelRow({
            capturedAt: input.capturedAt,
            digest,
            sourceUrl,
            spec,
            price,
            originalPriceText,
            stationName,
            storeId,
            stationHref,
            isMemberPrice: true
          })
        );
      }
    }
  }

  return rows;
}

export async function fetchAtlantsoliaIsFuelPrices(options: {
  fetchImpl?: typeof fetch;
  capturedAt?: string;
  sourceUrl?: string;
} = {}): Promise<AtlantsoliaIsFuelPriceObservation[]> {
  const sourceUrl = options.sourceUrl ?? ATLANTSOLIA_IS_FUEL_PRICES_URL;
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 atlantsolia-is-connector (fixture-friendly)'
    }
  });
  if (!response.ok) {
    throw new Error(`Atlantsolía IS fuel source blocked with HTTP ${response.status}`);
  }

  return parseAtlantsoliaIsFuelPricePage({
    body: await response.text(),
    capturedAt: options.capturedAt ?? new Date().toISOString(),
    sourceUrl
  });
}
