import { createHash } from 'node:crypto';

export const UNO_X_NO_FUEL_PRICE_URL = 'https://www.unox.no/drivstoffpriser/';

export type UnoXNoFuelGrade = '95' | 'diesel';
export type UnoXNoFuelObservationDomain = 'fuel';

export type UnoXNoFuelPriceObservation = {
  id: string;
  domain: UnoXNoFuelObservationDomain;
  countryCode: 'NO';
  chainId: 'uno-x-no';
  grade: UnoXNoFuelGrade;
  label: string;
  pricePerLitre: number;
  currency: 'NOK';
  litreBasis: 1;
  observedAt: string;
  validFrom: string;
  confidence: number;
  source: {
    id: 'uno-x-no-public-fuel-prices';
    kind: 'operator';
    operatorName: 'Uno-X Norge AS';
    sourceUrl: string;
    legalReviewStatus: 'approved';
  };
  provenance: {
    sourceRunId: string;
    sourceUrl: string;
    capturedAt: string;
    parserVersion: 'uno-x-no-fuel-prices-v1';
    contentDigest: {
      algorithm: 'sha-256';
      value: string;
    };
  };
};

type UnoXNoFuelProduct = {
  grade: UnoXNoFuelGrade;
  label: string;
  sourceLabels: string[];
};

const UNO_X_NO_FUEL_PRODUCTS: UnoXNoFuelProduct[] = [
  { grade: '95', label: 'Bensin 95', sourceLabels: ['Bensin 95', '95 blyfri', '95'] },
  { grade: 'diesel', label: 'Diesel', sourceLabels: ['Diesel'] }
];

export class UnoXNoFuelSourceBlockedError extends Error {
  constructor(sourceUrl: string, status: number) {
    super(`Uno-X NO fuel source blocked or unavailable: ${sourceUrl} returned HTTP ${status}`);
    this.name = 'UnoXNoFuelSourceBlockedError';
  }
}

export async function fetchUnoXNoFuelPrices(options: {
  fetchImpl?: typeof fetch;
  retrievedAt?: string;
  sourceRunId?: string;
} = {}): Promise<UnoXNoFuelPriceObservation[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(UNO_X_NO_FUEL_PRICE_URL, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 uno-x-no-fuel-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new UnoXNoFuelSourceBlockedError(UNO_X_NO_FUEL_PRICE_URL, response.status);
  }
  if (!response.ok) throw new Error(`Uno-X NO fuel price request failed: ${response.status}`);

  return parseUnoXNoFuelPriceHtml(await response.text(), {
    sourceUrl: UNO_X_NO_FUEL_PRICE_URL,
    retrievedAt,
    sourceRunId: options.sourceRunId
  });
}

export function parseUnoXNoFuelPriceHtml(
  html: string,
  context: {
    sourceUrl?: string;
    retrievedAt: string;
    sourceRunId?: string;
  }
): UnoXNoFuelPriceObservation[] {
  const sourceUrl = context.sourceUrl ?? UNO_X_NO_FUEL_PRICE_URL;
  const text = decodeHtmlText(html);
  const validFrom = parseNorwegianValidFrom(text);
  const digest = createHash('sha256').update(html).digest('hex');
  const source = {
    id: 'uno-x-no-public-fuel-prices' as const,
    kind: 'operator' as const,
    operatorName: 'Uno-X Norge AS' as const,
    sourceUrl,
    legalReviewStatus: 'approved' as const
  };

  return UNO_X_NO_FUEL_PRODUCTS.map((product) => ({
    id: `fuel-uno-x-no-${product.grade}-${validFrom.slice(0, 10)}`,
    domain: 'fuel',
    countryCode: 'NO',
    chainId: 'uno-x-no',
    grade: product.grade,
    label: product.label,
    pricePerLitre: priceForLabels(text, product.sourceLabels),
    currency: 'NOK',
    litreBasis: 1,
    observedAt: validFrom,
    validFrom,
    confidence: 0.9,
    source,
    provenance: {
      sourceRunId: context.sourceRunId ?? `uno-x-no-fuel-${validFrom.slice(0, 10)}`,
      sourceUrl,
      capturedAt: context.retrievedAt,
      parserVersion: 'uno-x-no-fuel-prices-v1',
      contentDigest: {
        algorithm: 'sha-256',
        value: digest
      }
    }
  }));
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

function parseNorwegianValidFrom(text: string): string {
  const match = text.match(/(?:Gyldig|Gjelder)\s+fra\s+(\d{1,2})\.?\s+([a-zæøå]+)\s+(\d{4})/i);
  if (!match) throw new Error('Uno-X NO fuel price valid-from date missing.');
  const day = match[1].padStart(2, '0');
  const month = norwegianMonthNumber(match[2]);
  return new Date(`${match[3]}-${month}-${day}T00:01:00+02:00`).toISOString();
}

function norwegianMonthNumber(monthName: string): string {
  const months: Record<string, string> = {
    januar: '01',
    februar: '02',
    mars: '03',
    april: '04',
    mai: '05',
    juni: '06',
    juli: '07',
    august: '08',
    september: '09',
    oktober: '10',
    november: '11',
    desember: '12'
  };
  const month = months[monthName.toLowerCase()];
  if (!month) throw new Error(`Unsupported Norwegian month in Uno-X NO fuel price date: ${monthName}`);
  return month;
}

function priceForLabels(text: string, labels: string[]): number {
  for (const label of labels) {
    const match = text.match(new RegExp(`${escapeRegExp(label)}\\s+([0-9]+(?:[,.][0-9]{1,2})?)\\s*(?:kr|nok)`, 'i'));
    if (match) {
      const price = Number.parseFloat(match[1].replace(',', '.'));
      if (!Number.isFinite(price) || price < 0) throw new Error(`Invalid Uno-X NO fuel price for ${label}.`);
      return price;
    }
  }
  throw new Error(`Uno-X NO fuel price missing for ${labels[0]}.`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
