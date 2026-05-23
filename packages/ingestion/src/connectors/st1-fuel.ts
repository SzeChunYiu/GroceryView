import { createHash } from 'node:crypto';

export const ST1_FUEL_PRICE_URL = 'https://st1.se/foretag/listpris';

export type St1FuelGrade = '95' | '98' | 'diesel' | 'HVO100' | 'E85';
export type St1FuelObservationDomain = 'fuel';
export type St1FuelSourceKind = 'operator' | 'crowd';

export type St1FuelPriceSource = {
  id: string;
  kind: St1FuelSourceKind;
  name: string;
  operatorName?: string;
  sourceUrl: string;
  legalReviewStatus: 'approved' | 'pending' | 'rejected' | 'stub_only';
};

export type St1FuelPriceObservation = {
  id: string;
  domain: St1FuelObservationDomain;
  grade: St1FuelGrade;
  label: string;
  pricePerLitre: number;
  currency: 'SEK';
  litreBasis: 1;
  observedAt: string;
  validFrom: string;
  confidence: number;
  source: St1FuelPriceSource;
  provenance: {
    sourceRunId: string;
    sourceUrl: string;
    capturedAt: string;
    parserVersion: string;
    rawRecordId?: string;
    contentDigest: {
      algorithm: 'sha-256';
      value: string;
    };
  };
};

export type FetchSt1FuelPricesOptions = {
  fetchImpl?: typeof fetch;
  retrievedAt?: string;
  sourceRunId?: string;
  rawRecordId?: string;
};

type St1FuelProduct = {
  grade: St1FuelGrade;
  label: string;
  sourceLabel: string;
};

const ST1_FUEL_PRODUCTS: St1FuelProduct[] = [
  { grade: '98', label: 'Bensin 98', sourceLabel: 'Bensin 98' },
  { grade: '95', label: 'Bensin 95', sourceLabel: 'Bensin 95' },
  { grade: 'E85', label: 'E85', sourceLabel: 'E85' },
  { grade: 'diesel', label: 'Diesel', sourceLabel: 'Diesel' },
  { grade: 'HVO100', label: 'HVO100', sourceLabel: 'HVO100' }
];

export class FuelSourceBlockedError extends Error {
  constructor(sourceUrl: string, status: number) {
    super(`Fuel source blocked or unavailable for reassignment: ${sourceUrl} returned HTTP ${status}`);
    this.name = 'FuelSourceBlockedError';
  }
}

export async function fetchSt1FuelPrices(options: FetchSt1FuelPricesOptions = {}): Promise<St1FuelPriceObservation[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(ST1_FUEL_PRICE_URL, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 fuel-price-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new FuelSourceBlockedError(ST1_FUEL_PRICE_URL, response.status);
  }
  if (!response.ok) {
    throw new Error(`St1 fuel price request failed: ${response.status}`);
  }

  return parseSt1FuelPriceHtml(await response.text(), {
    sourceUrl: ST1_FUEL_PRICE_URL,
    retrievedAt,
    sourceRunId: options.sourceRunId,
    rawRecordId: options.rawRecordId
  });
}

export function parseSt1FuelPriceHtml(
  html: string,
  context: {
    sourceUrl?: string;
    retrievedAt: string;
    sourceRunId?: string;
    rawRecordId?: string;
  }
): St1FuelPriceObservation[] {
  const sourceUrl = context.sourceUrl ?? ST1_FUEL_PRICE_URL;
  const text = decodeHtmlText(html);
  const validFrom = parseSwedishValidFrom(text);
  const digest = createHash('sha256').update(html).digest('hex');
  const source: St1FuelPriceSource = {
    id: 'st1-business-listpris',
    kind: 'operator',
    name: 'St1 Business listpris',
    operatorName: 'St1 Sverige AB',
    sourceUrl,
    legalReviewStatus: 'approved'
  };

  return ST1_FUEL_PRODUCTS.map((product) => {
    const pricePerLitre = priceForLabel(text, product.sourceLabel);
    return {
      id: `fuel-st1-${product.grade.toLowerCase()}-${validFrom.slice(0, 10)}`,
      domain: 'fuel',
      grade: product.grade,
      label: product.label,
      pricePerLitre,
      currency: 'SEK',
      litreBasis: 1,
      observedAt: validFrom,
      validFrom,
      confidence: 0.95,
      source,
      provenance: {
        sourceRunId: context.sourceRunId ?? `st1-fuel-${validFrom.slice(0, 10)}`,
        sourceUrl,
        capturedAt: context.retrievedAt,
        parserVersion: 'st1-fuel-listpris-v1',
        ...(context.rawRecordId ? { rawRecordId: context.rawRecordId } : {}),
        contentDigest: {
          algorithm: 'sha-256',
          value: digest
        }
      }
    };
  });
}

function decodeHtmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\\u002F/g, '/')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSwedishValidFrom(text: string): string {
  const match = text.match(/Listpriser gällande från\s+(\d{1,2})\s+([a-zåäö]+)\s+(\d{4})/i);
  if (!match) {
    throw new Error('St1 fuel price valid-from date missing.');
  }
  const month = swedishMonthNumber(match[2]);
  const day = match[1].padStart(2, '0');
  return new Date(`${match[3]}-${month}-${day}T00:01:00+02:00`).toISOString();
}

function swedishMonthNumber(monthName: string): string {
  const months: Record<string, string> = {
    januari: '01',
    februari: '02',
    mars: '03',
    april: '04',
    maj: '05',
    juni: '06',
    juli: '07',
    augusti: '08',
    september: '09',
    oktober: '10',
    november: '11',
    december: '12'
  };
  const month = months[monthName.toLowerCase()];
  if (!month) {
    throw new Error(`Unsupported Swedish month in St1 fuel price date: ${monthName}`);
  }
  return month;
}

function priceForLabel(text: string, label: string): number {
  const match = text.match(new RegExp(`${escapeRegExp(label)}\\s+([0-9]+(?:[,.][0-9]{1,2})?)\\s*kr`, 'i'));
  if (!match) {
    throw new Error(`St1 fuel price missing for ${label}.`);
  }
  const price = Number.parseFloat(match[1].replace(',', '.'));
  if (!Number.isFinite(price) || price < 0) {
    throw new Error(`Invalid St1 fuel price for ${label}.`);
  }
  return price;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
