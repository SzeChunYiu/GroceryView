import { type FuelGradeId, type FuelPriceSourceKind } from './okq8-fuel.js';

export const OB_IS_FUEL_PRICES_URL = 'https://www.ob.is/eldsneytisverd/';
export const OB_IS_FUEL_PRICE_PARSER_VERSION = 'ob-is-fuel-prices-v1';

type ObIsFuelGrade = '95' | 'diesel';

export type ObIsFuelPriceObservation = {
  domain: 'fuel';
  productId: FuelGradeId;
  fuelGrade: ObIsFuelGrade;
  gradeLabel: string;
  chainId: 'ob-is';
  operatorName: 'OB';
  sourceKind: FuelPriceSourceKind;
  sourceUrl: string;
  observedAt: string;
  capturedAt: string;
  effectiveFrom: string;
  pricePerLitre: number;
  currency: 'ISK';
  unit: 'l';
  confidence: number;
  provenance: {
    source: 'ob_is_fuel_prices';
    sourceUrl: string;
    parserVersion: string;
    rawSnapshotRef: string;
    originalTitle: string;
    originalPriceText: string;
    originalEffectiveDate: string;
  };
};

const OB_IS_GRADE_ROWS: Array<{ keys: string[]; productId: FuelGradeId; fuelGrade: ObIsFuelGrade; gradeLabel: string }> = [
  { keys: ['95', 'bensin95', 'bensin 95'], productId: 'fuel-95-e10', fuelGrade: '95', gradeLabel: 'Bensín 95' },
  { keys: ['diesel', 'disil', 'dísel'], productId: 'fuel-diesel', fuelGrade: 'diesel', gradeLabel: 'Dísel' }
];

function contentHashFor(body: string): string {
  let hash = 0;
  for (let index = 0; index < body.length; index += 1) hash = ((hash << 5) - hash + body.charCodeAt(index)) | 0;
  return `ob-is-fuel-${Math.abs(hash).toString(16)}`;
}

function priceFromUnknown(value: unknown): { price: number; text: string } | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return { price: value, text: String(value) };
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/\s+/g, ' ').trim();
  const match = normalized.match(/([0-9]+(?:[,.][0-9]{1,2})?)/);
  if (!match) return null;
  const price = Number(match[1]!.replace(',', '.'));
  return Number.isFinite(price) && price >= 0 ? { price: Math.round((price + Number.EPSILON) * 100) / 100, text: normalized } : null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

function records(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null && !Array.isArray(entry));
  return [];
}

function findNestedArrays(value: unknown, output: unknown[] = []): unknown[] {
  if (Array.isArray(value)) output.push(value);
  if (typeof value === 'object' && value !== null) {
    for (const nested of Object.values(value as Record<string, unknown>)) findNestedArrays(nested, output);
  }
  return output;
}

function normalizeGradeKey(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('is-IS').replace(/[^a-z0-9]+/g, ' ').trim();
}

function extractJsonPayloads(body: string): unknown[] {
  const payloads: unknown[] = [];
  try { payloads.push(JSON.parse(body)); } catch { /* HTML fallback below. */ }
  const nextData = body.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (nextData) {
    try { payloads.push(JSON.parse(nextData[1]!.trim())); } catch { /* ignore unrelated scripts */ }
  }
  for (const match of body.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { payloads.push(JSON.parse(match[1]!.trim())); } catch { /* ignore */ }
  }
  return payloads;
}

function findPriceForGrade(payloads: unknown[], grade: typeof OB_IS_GRADE_ROWS[number]): { price: number; text: string; title: string } | null {
  const keys = grade.keys.map(normalizeGradeKey);
  for (const payload of payloads) {
    for (const candidateArray of findNestedArrays(payload)) {
      for (const record of records(candidateArray)) {
        const title = text(record.title) || text(record.name) || text(record.label) || text(record.fuelGrade) || text(record.grade) || text(record.product);
        const normalizedTitle = normalizeGradeKey(title);
        if (!keys.some((key) => normalizedTitle.includes(key))) continue;
        const price = priceFromUnknown(record.pricePerLitre ?? record.price ?? record.value ?? record.amount ?? record.verð ?? record.verd);
        if (price) return { ...price, title: title || grade.gradeLabel };
      }
    }
  }
  return null;
}

export function parseObIsFuelPrices(input: {
  body: string;
  sourceUrl?: string;
  capturedAt: string;
  rawSnapshotRef?: string;
  parserVersion?: string;
  effectiveFrom?: string;
}): ObIsFuelPriceObservation[] {
  const sourceUrl = input.sourceUrl ?? OB_IS_FUEL_PRICES_URL;
  const parserVersion = input.parserVersion ?? OB_IS_FUEL_PRICE_PARSER_VERSION;
  const rawSnapshotRef = input.rawSnapshotRef ?? `raw://ob-is-fuel/${contentHashFor(input.body)}`;
  const effectiveFrom = input.effectiveFrom ?? input.capturedAt.slice(0, 10);
  const payloads = extractJsonPayloads(input.body);
  return OB_IS_GRADE_ROWS.map((grade) => {
    const match = findPriceForGrade(payloads, grade);
    if (!match) throw new Error(`OB IS fuel price row not found: ${grade.gradeLabel}`);
    return {
      domain: 'fuel',
      productId: grade.productId,
      fuelGrade: grade.fuelGrade,
      gradeLabel: grade.gradeLabel,
      chainId: 'ob-is',
      operatorName: 'OB',
      sourceKind: 'operator_public_price_page',
      sourceUrl,
      observedAt: `${effectiveFrom}T00:00:00.000Z`,
      capturedAt: input.capturedAt,
      effectiveFrom,
      pricePerLitre: match.price,
      currency: 'ISK',
      unit: 'l',
      confidence: 0.85,
      provenance: {
        source: 'ob_is_fuel_prices',
        sourceUrl,
        parserVersion,
        rawSnapshotRef,
        originalTitle: match.title,
        originalPriceText: match.text,
        originalEffectiveDate: effectiveFrom
      }
    };
  });
}

export async function fetchObIsFuelPrices(options: { fetchImpl?: typeof fetch; capturedAt?: string; sourceUrl?: string } = {}): Promise<ObIsFuelPriceObservation[]> {
  const sourceUrl = options.sourceUrl ?? OB_IS_FUEL_PRICES_URL;
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/json',
      'user-agent': 'GroceryView fuel-price connector (+https://groceryview.example)'
    }
  });
  if (response.status === 403 || response.status === 401) throw new Error(`OB IS fuel price source blocked with HTTP ${response.status}.`);
  if (!response.ok) throw new Error(`OB IS fuel price source failed with HTTP ${response.status}.`);
  const body = await response.text();
  if (/captcha|access denied|aðgangi hafnað/i.test(body)) throw new Error('OB IS fuel price source returned a login/captcha/access-denied page.');
  return parseObIsFuelPrices({ body, sourceUrl, capturedAt });
}
