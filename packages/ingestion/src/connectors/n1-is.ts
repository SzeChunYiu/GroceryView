export const N1_IS_SOURCE_URL = 'https://www.n1.is';
export const N1_IS_CONNECTOR_VERSION = 'n1-is-fuel-convenience-v1';

export type N1FuelGrade = '95' | 'diesel' | 'electric' | 'methane';

export type N1FuelObservation = {
  domain: 'fuel';
  chainId: 'n1';
  countryCode: 'IS';
  productId: string;
  grade: N1FuelGrade;
  label: string;
  pricePerLitre: number;
  currency: 'ISK';
  unit: 'l';
  sourceUrl: string;
  retrievedAt: string;
  provenance: {
    source: 'n1_is';
    parserVersion: string;
    rawName: string;
  };
};

export type N1ConvenienceSku = {
  domain: 'convenience_sku';
  chainId: 'n1';
  countryCode: 'IS';
  sku: string;
  name: string;
  category: string;
  price: number;
  currency: 'ISK';
  unit: 'each';
  sourceUrl: string;
  retrievedAt: string;
  provenance: {
    source: 'n1_is';
    parserVersion: string;
    rawName: string;
  };
};

export type N1IsRow = N1FuelObservation | N1ConvenienceSku;

type N1RawRow = Record<string, unknown>;

type N1Payload = {
  fuelPrices?: N1RawRow[];
  fuels?: N1RawRow[];
  products?: N1RawRow[];
  convenienceSkus?: N1RawRow[];
};

type FetchN1IsOptions = {
  sourceUrl?: string;
  fetchImpl?: typeof fetch;
  retrievedAt?: string;
};

export const n1IsTestFixture: N1Payload = {
  fuelPrices: [
    { name: 'Bensín 95', price: '329,7', grade: '95' },
    { name: 'Dísel', price: 318.4, grade: 'diesel' }
  ],
  products: [
    { sku: 'n1-coffee', name: 'Kaffi', category: 'drykkir', price: 499 },
    { sku: 'n1-hotdog', name: 'Pylsa', category: 'matur', price: '699 kr.' }
  ]
};

export async function fetchN1IsRows(options: FetchN1IsOptions = {}): Promise<N1IsRow[]> {
  const sourceUrl = options.sourceUrl ?? process.env.N1_IS_SOURCE_URL ?? N1_IS_SOURCE_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'application/json,text/html',
      'user-agent': 'GroceryView n1-is connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (!response.ok) throw new Error(`N1 Iceland connector failed with HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('json') ? await response.json() : parseEmbeddedJson(await response.text());
  return parseN1IsPayload(payload, { sourceUrl, retrievedAt: options.retrievedAt ?? new Date().toISOString() });
}

export function parseN1IsPayload(payload: unknown, context: { sourceUrl: string; retrievedAt: string }): N1IsRow[] {
  if (!isRecord(payload)) return [];
  const shaped = payload as N1Payload;
  return [
    ...rawRows(shaped.fuelPrices ?? shaped.fuels).map((row) => normalizeFuel(row, context)).filter((row): row is N1FuelObservation => row !== null),
    ...rawRows(shaped.products ?? shaped.convenienceSkus).map((row) => normalizeConvenienceSku(row, context)).filter((row): row is N1ConvenienceSku => row !== null)
  ];
}

function normalizeFuel(row: N1RawRow, context: { sourceUrl: string; retrievedAt: string }): N1FuelObservation | null {
  const rawName = text(row.name) || text(row.title) || text(row.label);
  const grade = normalizeGrade(text(row.grade) || rawName);
  const pricePerLitre = price(row.price) ?? price(row.pricePerLitre);
  if (!rawName || !grade || pricePerLitre === null) return null;

  return {
    domain: 'fuel',
    chainId: 'n1',
    countryCode: 'IS',
    productId: `n1-is-fuel-${grade}`,
    grade,
    label: rawName,
    pricePerLitre,
    currency: 'ISK',
    unit: 'l',
    sourceUrl: context.sourceUrl,
    retrievedAt: context.retrievedAt,
    provenance: { source: 'n1_is', parserVersion: N1_IS_CONNECTOR_VERSION, rawName }
  };
}

function normalizeConvenienceSku(row: N1RawRow, context: { sourceUrl: string; retrievedAt: string }): N1ConvenienceSku | null {
  const name = text(row.name) || text(row.title);
  const sku = text(row.sku) || text(row.id) || stableSku(name);
  const skuPrice = price(row.price) ?? price(row.currentPrice);
  if (!name || !sku || skuPrice === null) return null;

  return {
    domain: 'convenience_sku',
    chainId: 'n1',
    countryCode: 'IS',
    sku,
    name,
    category: text(row.category) || 'convenience',
    price: skuPrice,
    currency: 'ISK',
    unit: 'each',
    sourceUrl: context.sourceUrl,
    retrievedAt: context.retrievedAt,
    provenance: { source: 'n1_is', parserVersion: N1_IS_CONNECTOR_VERSION, rawName: name }
  };
}

function parseEmbeddedJson(html: string): unknown {
  const match = html.match(/<script[^>]+type="application\/json"[^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return {};
  try {
    return JSON.parse(match[1]);
  } catch {
    return {};
  }
}

function normalizeGrade(value: string): N1FuelGrade | null {
  const lower = value.toLowerCase();
  if (lower.includes('95') || lower.includes('bens')) return '95';
  if (lower.includes('dísel') || lower.includes('diesel')) return 'diesel';
  if (lower.includes('raf') || lower.includes('electric')) return 'electric';
  if (lower.includes('metan') || lower.includes('methane')) return 'methane';
  return null;
}

function rawRows(value: unknown): N1RawRow[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function isRecord(value: unknown): value is N1RawRow {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function price(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const parsed = Number.parseFloat(value.replace(',', '.').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function stableSku(name: string): string {
  return name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
