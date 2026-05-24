import { createHash } from 'node:crypto';

export const PREEM_SE_BUSINESS_LIST_PRICE_URL = 'https://www.preem.se/foretag/kund-hos-preem/listpriser/';
export const PREEM_SE_PARSER_VERSION = 'preem-se-business-listpriser-v1';

export type PreemSeFuelGrade = '95' | '98' | 'diesel' | 'hvo100' | 'e85';

export type PreemSeFuelPriceObservation = {
  id: string;
  domain: 'fuel';
  chainId: 'preem';
  operatorName: 'Preem';
  fuelGrade: PreemSeFuelGrade;
  gradeLabel: string;
  pricePerLitre: number;
  currency: 'SEK';
  unit: 'l';
  customerSegment: 'business_card';
  sourceKind: 'operator_business_list_price_page';
  sourceUrl: string;
  observedAt: string;
  capturedAt: string;
  validFrom: string;
  confidence: number;
  provenance: {
    source: 'preem_se_business_list_prices';
    sourceUrl: string;
    parserVersion: string;
    rawSnapshotRef: string;
    originalLabel: string;
    originalPriceText: string;
    originalValidFromText: string;
  };
};

const PRODUCTS: Array<{ label: string; grade: PreemSeFuelGrade; gradeLabel: string }> = [
  { label: 'Diesel', grade: 'diesel', gradeLabel: 'Diesel' },
  { label: 'HVO100', grade: 'hvo100', gradeLabel: 'HVO100' },
  { label: 'Bensin 95', grade: '95', gradeLabel: 'Bensin 95' },
  { label: 'Bensin 98', grade: '98', gradeLabel: 'Bensin 98' },
  { label: 'E85', grade: 'e85', gradeLabel: 'E85' }
];

export async function fetchPreemSeBusinessFuelPrices(options: {
  fetchImpl?: typeof fetch;
  capturedAt?: string;
  sourceUrl?: string;
} = {}): Promise<PreemSeFuelPriceObservation[]> {
  const sourceUrl = options.sourceUrl ?? PREEM_SE_BUSINESS_LIST_PRICE_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView fuel-price connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Preem SE fuel price source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Preem SE fuel price source failed with HTTP ${response.status}.`);
  return parsePreemSeBusinessFuelPricePage({
    html: await response.text(),
    sourceUrl,
    capturedAt: options.capturedAt ?? new Date().toISOString()
  });
}

export function parsePreemSeBusinessFuelPricePage(input: {
  html: string;
  sourceUrl?: string;
  capturedAt: string;
  rawSnapshotRef?: string;
}): PreemSeFuelPriceObservation[] {
  const sourceUrl = input.sourceUrl ?? PREEM_SE_BUSINESS_LIST_PRICE_URL;
  const text = decodeHtmlText(input.html);
  const validFromText = parseValidFromText(text);
  const validFrom = swedishDateToIso(validFromText);
  const businessCardSection = sectionBetween(text, 'Listpriser Företagskort och Transportkort', 'Listpriser Truckkort');
  const rawSnapshotRef = input.rawSnapshotRef ?? `raw://preem-se/${createHash('sha256').update(input.html).digest('hex')}`;

  return PRODUCTS.map((product) => {
    const originalPriceText = priceTextForLabel(businessCardSection, product.label);
    const idGrade = product.grade.toLowerCase();
    return {
      id: `fuel-preem-${idGrade}-${validFrom.slice(0, 10)}`,
      domain: 'fuel',
      chainId: 'preem',
      operatorName: 'Preem',
      fuelGrade: product.grade,
      gradeLabel: product.gradeLabel,
      pricePerLitre: parseSwedishKronor(originalPriceText),
      currency: 'SEK',
      unit: 'l',
      customerSegment: 'business_card',
      sourceKind: 'operator_business_list_price_page',
      sourceUrl,
      observedAt: validFrom,
      capturedAt: input.capturedAt,
      validFrom,
      confidence: 0.9,
      provenance: {
        source: 'preem_se_business_list_prices',
        sourceUrl,
        parserVersion: PREEM_SE_PARSER_VERSION,
        rawSnapshotRef,
        originalLabel: product.label,
        originalPriceText,
        originalValidFromText: validFromText
      }
    };
  });
}

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

function sectionBetween(text: string, start: string, end: string): string {
  const startIndex = text.indexOf(start);
  if (startIndex === -1) throw new Error(`Preem SE section missing: ${start}`);
  const endIndex = text.indexOf(end, startIndex + start.length);
  if (endIndex === -1) throw new Error(`Preem SE section terminator missing: ${end}`);
  return text.slice(startIndex, endIndex);
}

function priceTextForLabel(text: string, label: string): string {
  const match = text.match(new RegExp(`${escapeRegExp(label)}\\s+([0-9]+(?:,[0-9]{1,2})?)\\s*kr`, 'i'));
  if (!match) throw new Error(`Preem SE fuel price missing for ${label}.`);
  return `${match[1]} kr`;
}

function parseSwedishKronor(value: string): number {
  const parsed = Number.parseFloat(value.replace(/\s*kr$/i, '').replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Invalid Preem SE fuel price: ${value}`);
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}

function parseValidFromText(text: string): string {
  const match = text.match(/gällande från\s+(\d{1,2}\s+[a-zåäö]+\s+\d{4})/i);
  if (!match) throw new Error('Preem SE fuel price valid-from date missing.');
  return match[1];
}

function swedishDateToIso(value: string): string {
  const match = value.match(/^(\d{1,2})\s+([a-zåäö]+)\s+(\d{4})$/i);
  if (!match) throw new Error(`Invalid Preem SE fuel price date: ${value}`);
  const month = swedishMonthNumber(match[2]);
  return new Date(`${match[3]}-${month}-${match[1].padStart(2, '0')}T00:01:00+02:00`).toISOString();
}

function swedishMonthNumber(monthName: string): string {
  const months: Record<string, string> = {
    januari: '01', februari: '02', mars: '03', april: '04', maj: '05', juni: '06',
    juli: '07', augusti: '08', september: '09', oktober: '10', november: '11', december: '12'
  };
  const month = months[monthName.toLowerCase()];
  if (!month) throw new Error(`Unsupported Swedish month in Preem SE fuel price date: ${monthName}`);
  return month;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
