import { createHash } from 'node:crypto';

export const ATLANTSOLIA_IS_FUEL_PRICES_URL = 'https://www.atlantsolia.is/';
export const ATLANTSOLIA_IS_FUEL_PRICE_PARSER_VERSION = 'atlantsolia-is-fuel-prices-v1';

export type AtlantsoliaIsFuelGradeId = 'fuel-is-95' | 'fuel-is-diesel';

export type AtlantsoliaIsFuelPriceObservation = {
  domain: 'fuel';
  productId: AtlantsoliaIsFuelGradeId;
  fuelGrade: '95' | 'diesel';
  gradeLabel: string;
  chainId: 'atlantsolia';
  operatorName: 'Atlantsolía';
  countryCode: 'IS';
  sourceKind: 'operator_public_price_page';
  sourceUrl: string;
  observedAt: string;
  capturedAt: string;
  effectiveFrom: string;
  pricePerLitre: number;
  currency: 'ISK';
  unit: 'l';
  confidence: number;
  provenance: {
    source: 'atlantsolia_is_homepage';
    sourceUrl: string;
    parserVersion: string;
    rawSnapshotRef: string;
    originalLabel: string;
    originalPriceText: string;
  };
};

const ATLANTSOLIA_GRADE_ROWS: Array<{
  labelPattern: RegExp;
  productId: AtlantsoliaIsFuelGradeId;
  fuelGrade: AtlantsoliaIsFuelPriceObservation['fuelGrade'];
  gradeLabel: string;
}> = [
  { labelPattern: /95\s+okt\.?/i, productId: 'fuel-is-95', fuelGrade: '95', gradeLabel: '95 okt.' },
  { labelPattern: /d(?:í|i|&#xED;)sel/i, productId: 'fuel-is-diesel', fuelGrade: 'diesel', gradeLabel: 'Dísel' }
];

export async function fetchAtlantsoliaIsFuelPrices(options: {
  fetchImpl?: typeof fetch;
  capturedAt?: string;
  sourceUrl?: string;
} = {}): Promise<AtlantsoliaIsFuelPriceObservation[]> {
  const sourceUrl = options.sourceUrl ?? ATLANTSOLIA_IS_FUEL_PRICES_URL;
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 fuel-price-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Atlantsolía fuel price source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Atlantsolía fuel price source failed with HTTP ${response.status}.`);

  return parseAtlantsoliaIsFuelPricePage({
    body: await response.text(),
    sourceUrl,
    capturedAt
  });
}

export function parseAtlantsoliaIsFuelPricePage(input: {
  body: string;
  sourceUrl?: string;
  capturedAt: string;
  parserVersion?: string;
  rawSnapshotRef?: string;
}): AtlantsoliaIsFuelPriceObservation[] {
  const sourceUrl = input.sourceUrl ?? ATLANTSOLIA_IS_FUEL_PRICES_URL;
  const parserVersion = input.parserVersion ?? ATLANTSOLIA_IS_FUEL_PRICE_PARSER_VERSION;
  const rawSnapshotRef = input.rawSnapshotRef ?? `raw://atlantsolia-is-fuel/${contentHashFor(input.body)}`;
  const pageText = decodeHtmlText(input.body);
  const effectiveFrom = isoDateAtStartOfDay(input.capturedAt.slice(0, 10));

  return ATLANTSOLIA_GRADE_ROWS.map((grade) => {
    const originalPriceText = priceTextAfterLabel(pageText, grade.labelPattern, grade.gradeLabel);
    return {
      domain: 'fuel',
      productId: grade.productId,
      fuelGrade: grade.fuelGrade,
      gradeLabel: grade.gradeLabel,
      chainId: 'atlantsolia',
      operatorName: 'Atlantsolía',
      countryCode: 'IS',
      sourceKind: 'operator_public_price_page',
      sourceUrl,
      observedAt: input.capturedAt,
      capturedAt: input.capturedAt,
      effectiveFrom,
      pricePerLitre: parseIcelandicKronur(originalPriceText),
      currency: 'ISK',
      unit: 'l',
      confidence: 0.85,
      provenance: {
        source: 'atlantsolia_is_homepage',
        sourceUrl,
        parserVersion,
        rawSnapshotRef,
        originalLabel: grade.gradeLabel,
        originalPriceText
      }
    };
  });
}

function priceTextAfterLabel(text: string, labelPattern: RegExp, label: string): string {
  const labelMatch = text.match(labelPattern);
  if (!labelMatch || labelMatch.index === undefined) throw new Error(`Atlantsolía fuel price label missing: ${label}`);
  const afterLabel = text.slice(labelMatch.index + labelMatch[0].length, labelMatch.index + labelMatch[0].length + 120);
  const priceMatch = afterLabel.match(/([0-9](?:\s*[0-9]){1,2}\s*[,.]\s*[0-9]\s*[0-9])/);
  if (!priceMatch) throw new Error(`Atlantsolía fuel price missing for ${label}`);
  return priceMatch[1].replace(/\s+/g, '').replace('.', ',');
}

function parseIcelandicKronur(value: string): number {
  const parsed = Number(value.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Invalid Atlantsolía fuel price: ${value}`);
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}

function isoDateAtStartOfDay(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Invalid Atlantsolía capture date: ${date}`);
  return `${date}T00:00:00.000Z`;
}

function contentHashFor(body: string): string {
  return createHash('sha256').update(body).digest('hex');
}

function decodeHtmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, value: string) => String.fromCodePoint(Number.parseInt(value, 16)))
    .replace(/&#([0-9]+);/g, (_, value: string) => String.fromCodePoint(Number.parseInt(value, 10)))
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
