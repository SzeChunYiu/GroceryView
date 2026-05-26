import { createHash } from 'node:crypto';

export const CIRCLE_K_SE_BUSINESS_FUEL_PRICES_URL = 'https://www.circlek.se/foretag/drivmedel/priser';
export const CIRCLE_K_SE_TRUCK_FUEL_PRICES_URL = 'https://www.circlek.se/foretag/fordonspark/truck/priser';
export const CIRCLE_K_SE_PARSER_VERSION = 'circle-k-se-business-fuel-prices-v1';

export type CircleKSeFuelPriceKind = 'business_card' | 'truck_card';

export type CircleKSeFuelObservation = {
  id: string;
  domain: 'fuel';
  chainId: 'circle-k-se';
  operatorName: 'Circle K Sverige';
  customerSegment: 'business';
  listPriceKind: CircleKSeFuelPriceKind;
  productName: string;
  fuelGrade: '95' | '98' | 'diesel' | 'hvo100' | 'cng' | 'e85' | 'b100' | 'adblue' | 'unknown';
  price: number;
  currency: 'SEK';
  unit: 'l' | 'kg' | 'kWh';
  includesVat: true;
  effectiveFrom: string;
  observedAt: string;
  sourceUrl: string;
  provenance: {
    source: 'circle_k_se_business_fuel_prices';
    parserVersion: string;
    sourceUrl: string;
    contentDigest: string;
    originalProductText: string;
    originalPriceText: string;
    originalUnitText: string;
    originalChangeText?: string;
  };
};

function decodeHtmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function contentDigest(html: string): string {
  return createHash('sha256').update(html).digest('hex');
}

function parseSwedishNumber(value: string): number {
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Invalid Circle K SE fuel price: ${value}`);
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}

function normalizeUnit(unit: string): CircleKSeFuelObservation['unit'] {
  if (unit === 'kr/l') return 'l';
  if (unit === 'kr/kg') return 'kg';
  if (unit === 'kr/kWh') return 'kWh';
  throw new Error(`Unsupported Circle K SE fuel unit: ${unit}`);
}

function slug(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function gradeFromProduct(productName: string): CircleKSeFuelObservation['fuelGrade'] {
  const normalized = productName.toLowerCase();
  if (/\b95\b/.test(normalized)) return '95';
  if (/\b98\b/.test(normalized)) return '98';
  if (/hvo\s*100|hvo100/.test(normalized)) return 'hvo100';
  if (/diesel/.test(normalized)) return 'diesel';
  if (/fordonsgas|cng/.test(normalized)) return 'cng';
  if (/e85/.test(normalized)) return 'e85';
  if (/b100/.test(normalized)) return 'b100';
  if (/ad\s*blue|adblue/.test(normalized)) return 'adblue';
  return 'unknown';
}

function priceKindForUrl(sourceUrl: string): CircleKSeFuelPriceKind {
  const pathname = new URL(sourceUrl).pathname;
  if (/\/foretag\/fordonspark\/truck\/priser\/?$/i.test(pathname)) return 'truck_card';
  if (/\/foretag\/drivmedel\/(?:drivmedelspriser|priser)\/?$/i.test(pathname)) return 'business_card';
  throw new Error('Circle K SE connector only accepts Circle K Pro business fuel price pages.');
}

export function parseCircleKSeFuelPrices(input: {
  html: string;
  observedAt: string;
  sourceUrl?: string;
  parserVersion?: string;
}): CircleKSeFuelObservation[] {
  const sourceUrl = input.sourceUrl ?? CIRCLE_K_SE_BUSINESS_FUEL_PRICES_URL;
  const listPriceKind = priceKindForUrl(sourceUrl);
  const text = decodeHtmlText(input.html);
  if (/captcha|access denied|cloudflare|logga in/i.test(text)) throw new Error('Circle K SE fuel price source returned a blocked/login page.');
  if (!/Aktuella (?:listpriser företagskund|priser truck)/i.test(text)) throw new Error('Circle K SE fuel price heading missing.');

  const digest = contentDigest(input.html);
  const rows: CircleKSeFuelObservation[] = [];
  const rowPattern = /Produktnamn:\s*(.+?)\s+Pris:\s*([0-9][0-9\s]*(?:[,.][0-9]{1,2})?)\s+Ändringsdatum:\s*(\d{4}-\d{2}-\d{2})\s+Enhet:\s*(kr\/(?:l|kg|kWh))(?:\s+Ändring:\s*([+-]?[0-9][0-9\s]*(?:[,.][0-9]{1,2})?))?/gi;
  for (const match of text.matchAll(rowPattern)) {
    const originalProductText = match[1]!.trim();
    const productName = originalProductText.replace(/\*+$/g, '').trim();
    const originalPriceText = match[2]!.trim();
    const effectiveFrom = match[3]!;
    const originalUnitText = match[4]!.trim();
    const originalChangeText = match[5]?.trim();
    rows.push({
      id: `circle-k-se-${listPriceKind}-${slug(productName)}-${effectiveFrom}`,
      domain: 'fuel',
      chainId: 'circle-k-se',
      operatorName: 'Circle K Sverige',
      customerSegment: 'business',
      listPriceKind,
      productName,
      fuelGrade: gradeFromProduct(productName),
      price: parseSwedishNumber(originalPriceText),
      currency: 'SEK',
      unit: normalizeUnit(originalUnitText),
      includesVat: true,
      effectiveFrom,
      observedAt: input.observedAt,
      sourceUrl,
      provenance: {
        source: 'circle_k_se_business_fuel_prices',
        parserVersion: input.parserVersion ?? CIRCLE_K_SE_PARSER_VERSION,
        sourceUrl,
        contentDigest: digest,
        originalProductText,
        originalPriceText,
        originalUnitText,
        ...(originalChangeText ? { originalChangeText } : {})
      }
    });
  }
  if (rows.length === 0) throw new Error('No Circle K SE fuel prices parsed.');
  return rows;
}

export async function fetchCircleKSeFuelPrices(options: {
  fetchImpl?: typeof fetch;
  observedAt?: string;
  sourceUrls?: string[];
} = {}): Promise<CircleKSeFuelObservation[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const observedAt = options.observedAt ?? new Date().toISOString();
  const sourceUrls = options.sourceUrls ?? [CIRCLE_K_SE_BUSINESS_FUEL_PRICES_URL, CIRCLE_K_SE_TRUCK_FUEL_PRICES_URL];
  const rows: CircleKSeFuelObservation[] = [];
  for (const sourceUrl of sourceUrls) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 circle-k-se-fuel-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
      throw new Error(`Circle K SE fuel price source blocked with HTTP ${response.status}.`);
    }
    if (!response.ok) throw new Error(`Circle K SE fuel price source failed with HTTP ${response.status}.`);
    rows.push(...parseCircleKSeFuelPrices({ html: await response.text(), observedAt, sourceUrl }));
  }
  return rows;
}
