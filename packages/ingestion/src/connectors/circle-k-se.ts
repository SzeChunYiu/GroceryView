import { createHash } from 'node:crypto';
import { runAllStoreTasks, type AllStoreTaskRunnerControls } from './all-store-runner.js';

export const CIRCLE_K_SE_FUEL_PRICES_URL = 'https://www.circlek.se/foretag/drivmedel/drivmedelspriser';
export const CIRCLE_K_SE_TRUCK_FUEL_PRICES_URL = 'https://www.circlek.se/foretag/fordonspark/truck/priser';
export const CIRCLE_K_SE_OFFERS_URL = 'https://www.circlek.se/erbjudanden';
export const CIRCLE_K_SE_FOOD_URL = 'https://www.circlek.se/mat';
export const CIRCLE_K_SE_PARSER_VERSION = 'circle-k-se-v1';

export type CircleKFuelGradeId = 'fuel-95-e10' | 'fuel-98' | 'fuel-98-plus' | 'fuel-diesel' | 'fuel-diesel-plus' | 'fuel-hvo100' | 'fuel-e85' | 'fuel-cng' | 'fuel-b100' | 'fuel-adblue';
export type CircleKConvenienceCategory = 'coffee' | 'drink' | 'food' | 'snack' | 'meal-deal' | 'other';

export type CircleKFuelPriceObservation = {
  domain: 'fuel';
  chainId: 'circle-k';
  operatorName: 'Circle K Sverige AB';
  productId: CircleKFuelGradeId;
  fuelGrade: string;
  gradeLabel: string;
  pricePerUnit: number;
  unit: 'l' | 'kg';
  currency: 'SEK';
  effectiveFrom: string;
  observedAt: string;
  capturedAt: string;
  sourceUrl: string;
  sourceKind: 'operator_public_price_page';
  confidence: number;
  provenance: CircleKProvenance & {
    originalProductName: string;
    originalPriceText: string;
    originalUnitText: string;
    originalEffectiveDate: string;
  };
};

export type CircleKConvenienceSku = {
  domain: 'convenience';
  chainId: 'circle-k';
  country: 'SE';
  retailerProductId: string;
  name: string;
  category: CircleKConvenienceCategory;
  price: number | null;
  currency: 'SEK';
  packageSize: number;
  packageUnit: 'each';
  sourceUrl: string;
  observedAt: string;
  capturedAt: string;
  confidence: number;
  provenance: CircleKProvenance & {
    originalName: string;
    originalPriceText?: string;
  };
};

export type CircleKSeRow = CircleKFuelPriceObservation | CircleKConvenienceSku;

export type CircleKProvenance = {
  source: 'circle_k_se_fuel_prices' | 'circle_k_se_convenience_page';
  parserVersion: string;
  rawSnapshotRef: string;
  contentDigest: { algorithm: 'sha-256'; value: string };
};

export type CircleKStationConfig = { stationId: string; sourceUrl?: string; name?: string };

const FUEL_PRODUCTS: Array<{ labels: RegExp[]; productId: CircleKFuelGradeId; fuelGrade: string; gradeLabel: string }> = [
  { labels: [/miles\s*95/i], productId: 'fuel-95-e10', fuelGrade: '95', gradeLabel: 'miles 95' },
  { labels: [/miles\s*\+\s*98|miles\+\s*98/i], productId: 'fuel-98-plus', fuelGrade: '98+', gradeLabel: 'miles+ 98' },
  { labels: [/miles\s*98/i], productId: 'fuel-98', fuelGrade: '98', gradeLabel: 'miles 98' },
  { labels: [/miles\s*\+\s*diesel|miles\+\s*diesel/i], productId: 'fuel-diesel-plus', fuelGrade: 'diesel+', gradeLabel: 'miles+ diesel' },
  { labels: [/miles\s*diesel|diesel/i], productId: 'fuel-diesel', fuelGrade: 'diesel', gradeLabel: 'miles diesel' },
  { labels: [/hvo\s*100|hvo100/i], productId: 'fuel-hvo100', fuelGrade: 'hvo100', gradeLabel: 'HVO100' },
  { labels: [/e85|ethanol/i], productId: 'fuel-e85', fuelGrade: 'e85', gradeLabel: 'E85' },
  { labels: [/fordonsgas|cng/i], productId: 'fuel-cng', fuelGrade: 'cng', gradeLabel: 'Fordonsgas' },
  { labels: [/b100/i], productId: 'fuel-b100', fuelGrade: 'b100', gradeLabel: 'B100' },
  { labels: [/ad\s*blue|adblue/i], productId: 'fuel-adblue', fuelGrade: 'adblue', gradeLabel: 'AdBlue' }
];

function digest(body: string): string { return createHash('sha256').update(body).digest('hex'); }
function rawRef(prefix: string, body: string): string { return `raw://circle-k-se/${prefix}/${digest(body).slice(0, 16)}`; }
function decodeHtml(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(Number.parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number.parseInt(d, 10)))
    .replace(/\s+/g, ' ')
    .trim();
}
function parsePrice(text: string): number {
  const parsed = Number.parseFloat(text.replace(/\s/g, '').replace(',', '.').replace(/kr(?:\/(?:l|kg))?/i, ''));
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Invalid Circle K price: ${text}`);
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}
function isoDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Invalid Circle K effective date: ${date}`);
  return `${date}T00:00:00.000Z`;
}
function productFor(name: string) { return FUEL_PRODUCTS.find((p) => p.labels.some((label) => label.test(name))); }
function slug(value: string): string { return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80); }
function categoryFor(name: string): CircleKConvenienceCategory {
  if (/kaffe|coffee|latte|espresso/i.test(name)) return 'coffee';
  if (/dryck|läsk|juice|k[-\s]?freeze|vatten|energi/i.test(name)) return 'drink';
  if (/korv|pizza|burgare|wrap|sallad|sandwich|smörgås|meal/i.test(name)) return 'food';
  if (/chips|godis|nöt|snack|bulle|fikabröd/i.test(name)) return 'snack';
  if (/deal|meny|combo/i.test(name)) return 'meal-deal';
  return 'other';
}

export function parseCircleKSeFuelPrices(input: { body: string; sourceUrl?: string; capturedAt: string; rawSnapshotRef?: string; parserVersion?: string }): CircleKFuelPriceObservation[] {
  const sourceUrl = input.sourceUrl ?? CIRCLE_K_SE_FUEL_PRICES_URL;
  const parserVersion = input.parserVersion ?? CIRCLE_K_SE_PARSER_VERSION;
  const text = decodeHtml(input.body);
  const contentDigest = digest(input.body);
  const rowPattern = /Produktnamn:\s*([^|]+?)\s*\|\s*Pris:\s*([0-9]+(?:[,.][0-9]{1,2})?)\s*\|\s*Ändringsdatum:\s*(\d{4}-\d{2}-\d{2})\s*\|\s*Enhet:\s*kr\/(l|kg)/gi;
  const rows: CircleKFuelPriceObservation[] = [];
  for (const match of text.matchAll(rowPattern)) {
    const originalProductName = match[1].trim();
    const product = productFor(originalProductName);
    if (!product) continue;
    const originalPriceText = match[2];
    const originalEffectiveDate = match[3];
    rows.push({
      domain: 'fuel', chainId: 'circle-k', operatorName: 'Circle K Sverige AB', productId: product.productId,
      fuelGrade: product.fuelGrade, gradeLabel: product.gradeLabel, pricePerUnit: parsePrice(originalPriceText), unit: match[4].toLowerCase() as 'l' | 'kg', currency: 'SEK',
      effectiveFrom: originalEffectiveDate, observedAt: isoDate(originalEffectiveDate), capturedAt: input.capturedAt,
      sourceUrl, sourceKind: 'operator_public_price_page', confidence: 0.9,
      provenance: { source: 'circle_k_se_fuel_prices', parserVersion, rawSnapshotRef: input.rawSnapshotRef ?? rawRef('fuel', input.body), contentDigest: { algorithm: 'sha-256', value: contentDigest }, originalProductName, originalPriceText, originalUnitText: `kr/${match[4].toLowerCase()}`, originalEffectiveDate }
    });
  }
  if (rows.length === 0) throw new Error('Circle K fuel price rows not found.');
  return rows;
}

export function parseCircleKSeConveniencePage(input: { body: string; sourceUrl?: string; capturedAt: string; rawSnapshotRef?: string; parserVersion?: string }): CircleKConvenienceSku[] {
  const sourceUrl = input.sourceUrl ?? CIRCLE_K_SE_OFFERS_URL;
  const parserVersion = input.parserVersion ?? CIRCLE_K_SE_PARSER_VERSION;
  const text = decodeHtml(input.body);
  const contentDigest = digest(input.body);
  const rows = new Map<string, CircleKConvenienceSku>();
  const patterns = [
    /(?:Produkt|Erbjudande|Titel|Namn):\s*([^|.]{3,90}?)\s*\|\s*(?:Pris|Från pris):\s*([0-9]+(?:[,.][0-9]{1,2})?)\s*kr/gi,
    /([^.!?]{3,80}?)\s+(?:för|från)?\s*([0-9]+(?:[,.][0-9]{1,2})?)\s*kr/gi
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const name = match[1].trim().replace(/^(Köp|Pris|Produkt)\s+/i, '');
      if (!/[a-zåäö]{3}/i.test(name) || /cookie|integritet|circle k extra/i.test(name)) continue;
      const id = `circle-k-se-${slug(name)}`;
      if (rows.has(id)) continue;
      rows.set(id, { domain: 'convenience', chainId: 'circle-k', country: 'SE', retailerProductId: id, name, category: categoryFor(name), price: parsePrice(match[2]), currency: 'SEK', packageSize: 1, packageUnit: 'each', sourceUrl, observedAt: input.capturedAt, capturedAt: input.capturedAt, confidence: 0.65, provenance: { source: 'circle_k_se_convenience_page', parserVersion, rawSnapshotRef: input.rawSnapshotRef ?? rawRef('convenience', input.body), contentDigest: { algorithm: 'sha-256', value: contentDigest }, originalName: name, originalPriceText: match[2] } });
    }
  }
  return [...rows.values()];
}

async function fetchText(fetchImpl: typeof fetch, sourceUrl: string): Promise<string> {
  const response = await fetchImpl(sourceUrl, { headers: { accept: 'text/html,application/xhtml+xml', 'user-agent': 'GroceryView Circle K SE connector (+https://github.com/SzeChunYiu/GroceryView)' } });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) throw new Error(`Circle K SE source blocked with HTTP ${response.status}: ${sourceUrl}`);
  if (!response.ok) throw new Error(`Circle K SE source failed with HTTP ${response.status}: ${sourceUrl}`);
  const body = await response.text();
  if (/captcha|access denied|åtkomst nekad/i.test(body)) throw new Error(`Circle K SE source returned a blocked page: ${sourceUrl}`);
  return body;
}

export async function fetchCircleKSeFuelPrices(options: { fetchImpl?: typeof fetch; capturedAt?: string; sourceUrl?: string } = {}): Promise<CircleKFuelPriceObservation[]> {
  const sourceUrl = options.sourceUrl ?? CIRCLE_K_SE_FUEL_PRICES_URL;
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const body = await fetchText(options.fetchImpl ?? fetch, sourceUrl);
  return parseCircleKSeFuelPrices({ body, sourceUrl, capturedAt });
}

export async function fetchCircleKSeConvenienceSkus(options: { fetchImpl?: typeof fetch; capturedAt?: string; sourceUrls?: readonly string[] } = {}): Promise<CircleKConvenienceSku[]> {
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrls = options.sourceUrls ?? [CIRCLE_K_SE_OFFERS_URL, CIRCLE_K_SE_FOOD_URL];
  const rows = await Promise.all(sourceUrls.map(async (sourceUrl) => parseCircleKSeConveniencePage({ body: await fetchText(fetchImpl, sourceUrl), sourceUrl, capturedAt })));
  return rows.flat();
}

export async function fetchCircleKSeConvenienceSkusForAllStations(options: AllStoreTaskRunnerControls & { fetchImpl?: typeof fetch; capturedAt?: string; stations: readonly CircleKStationConfig[]; sourceUrls?: readonly string[] } ): Promise<CircleKConvenienceSku[]> {
  const result = await runAllStoreTasks({
    ...options,
    stores: options.stations,
    storeId: (station) => station.stationId,
    task: async (station) => fetchCircleKSeConvenienceSkus({ fetchImpl: options.fetchImpl, capturedAt: options.capturedAt, sourceUrls: station.sourceUrl ? [station.sourceUrl] : options.sourceUrls })
  });
  return result.rows;
}

export async function fetchCircleKSeRows(options: { fetchImpl?: typeof fetch; capturedAt?: string; fuelUrl?: string; convenienceUrls?: readonly string[] } = {}): Promise<CircleKSeRow[]> {
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const [fuel, convenience] = await Promise.all([
    fetchCircleKSeFuelPrices({ fetchImpl: options.fetchImpl, capturedAt, sourceUrl: options.fuelUrl }),
    fetchCircleKSeConvenienceSkus({ fetchImpl: options.fetchImpl, capturedAt, sourceUrls: options.convenienceUrls })
  ]);
  return [...fuel, ...convenience];
}
