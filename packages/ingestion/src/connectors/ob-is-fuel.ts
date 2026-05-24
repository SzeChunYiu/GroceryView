import { type FuelGradeId, type FuelPriceSourceKind } from './okq8-fuel.js';

export const OB_IS_FUEL_PRICES_URL = 'https://olis.ob.is/eldsneytisverd';
export const OB_IS_FUEL_PRICE_PARSER_VERSION = 'ob-is-fuel-prices-v1';

export type ObIsFuelPriceObservation = {
  domain: 'fuel';
  productId: FuelGradeId;
  fuelGrade: '95' | 'diesel' | 'colored-diesel';
  gradeLabel: string;
  chainId: 'ob-is';
  operatorName: 'ÓB';
  stationId: string;
  stationName: string;
  sourceKind: FuelPriceSourceKind;
  sourceUrl: string;
  observedAt: string;
  capturedAt: string;
  pricePerLitre: number;
  currency: 'ISK';
  unit: 'l';
  confidence: number;
  provenance: {
    source: 'ob_is_fuel_prices';
    sourceUrl: string;
    parserVersion: string;
    rawSnapshotRef: string;
    originalPriceText: string;
  };
};

type ObIsGradeColumn = {
  productId: FuelGradeId;
  fuelGrade: ObIsFuelPriceObservation['fuelGrade'];
  gradeLabel: string;
  columnIndex: number;
};

const OB_IS_GRADES: ObIsGradeColumn[] = [
  { productId: 'fuel-95-e10', fuelGrade: '95', gradeLabel: 'Bensín', columnIndex: 1 },
  { productId: 'fuel-diesel', fuelGrade: 'diesel', gradeLabel: 'Dísel', columnIndex: 2 },
  { productId: 'fuel-diesel', fuelGrade: 'colored-diesel', gradeLabel: 'Dísel lituð', columnIndex: 3 }
];

function contentHashFor(body: string): string {
  let hash = 0;
  for (let index = 0; index < body.length; index += 1) {
    hash = ((hash << 5) - hash + body.charCodeAt(index)) | 0;
  }
  return `ob-is-fuel-${Math.abs(hash).toString(16)}`;
}

function decodeHtmlText(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&iacute;/gi, 'í')
    .replace(/&eth;/gi, 'ð')
    .replace(/&ouml;/gi, 'ö')
    .replace(/&ouml;/gi, 'ö')
    .replace(/&thorn;/gi, 'þ')
    .replace(/&aacute;/gi, 'á')
    .replace(/&eacute;/gi, 'é')
    .replace(/&uuml;/gi, 'ü')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseIcelandicKronur(value: string): number {
  const parsed = Number(value.replace(/\s+/g, '').replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Invalid ÓB fuel price: ${value}`);
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}

function stationKey(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'station';
}

export function parseObIsFuelPricePage(input: {
  body: string;
  sourceUrl?: string;
  capturedAt: string;
  rawSnapshotRef?: string;
  parserVersion?: string;
}): ObIsFuelPriceObservation[] {
  const sourceUrl = input.sourceUrl ?? OB_IS_FUEL_PRICES_URL;
  const parserVersion = input.parserVersion ?? OB_IS_FUEL_PRICE_PARSER_VERSION;
  const rawSnapshotRef = input.rawSnapshotRef ?? `raw://ob-is-fuel/${contentHashFor(input.body)}`;
  const observedAt = input.capturedAt;
  const tableMatch = input.body.match(/<table[^>]+id=["']gas-prices["'][\s\S]*?<\/table>/i);
  if (!tableMatch) throw new Error('ÓB fuel price table not found.');

  const rows: ObIsFuelPriceObservation[] = [];
  for (const rowMatch of tableMatch[0].matchAll(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/gi)) {
    const attrs = rowMatch[1] ?? '';
    const locationMatch = attrs.match(/data-location=["']([^"']+)["']/i);
    if (!locationMatch) continue;
    const cells = [...(rowMatch[2] ?? '').matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => decodeHtmlText(match[1] ?? ''));
    const stationName = cells[0];
    if (!stationName) continue;
    const stationId = `ob-is-${locationMatch[1]}-${stationKey(stationName)}`;
    for (const grade of OB_IS_GRADES) {
      const originalPriceText = cells[grade.columnIndex] ?? '';
      if (!originalPriceText) continue;
      rows.push({
        domain: 'fuel',
        productId: grade.productId,
        fuelGrade: grade.fuelGrade,
        gradeLabel: grade.gradeLabel,
        chainId: 'ob-is',
        operatorName: 'ÓB',
        stationId,
        stationName,
        sourceKind: 'operator_public_price_page',
        sourceUrl,
        observedAt,
        capturedAt: input.capturedAt,
        pricePerLitre: parseIcelandicKronur(originalPriceText),
        currency: 'ISK',
        unit: 'l',
        confidence: 0.9,
        provenance: {
          source: 'ob_is_fuel_prices',
          sourceUrl,
          parserVersion,
          rawSnapshotRef,
          originalPriceText
        }
      });
    }
  }

  if (rows.length === 0) throw new Error('ÓB fuel price table contained no prices.');
  return rows;
}

export async function fetchObIsFuelPrices(options: {
  fetchImpl?: typeof fetch;
  capturedAt?: string;
  sourceUrl?: string;
} = {}): Promise<ObIsFuelPriceObservation[]> {
  const sourceUrl = options.sourceUrl ?? OB_IS_FUEL_PRICES_URL;
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 fuel-price-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403) throw new Error(`ÓB fuel price source blocked with HTTP ${response.status}.`);
  if (!response.ok) throw new Error(`ÓB fuel price source failed with HTTP ${response.status}.`);
  const body = await response.text();
  if (/captcha|access denied|forbidden/i.test(body)) throw new Error('ÓB fuel price source returned a captcha/access-denied page.');
  return parseObIsFuelPricePage({
    body,
    sourceUrl,
    capturedAt,
    rawSnapshotRef: `raw://ob-is-fuel/${contentHashFor(body)}`
  });
}
