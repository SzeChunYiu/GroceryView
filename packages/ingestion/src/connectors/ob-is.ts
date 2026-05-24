import { createHash } from 'node:crypto';

export const OB_IS_FUEL_PRICE_URL = 'https://ob.olis.is/json/eldsneytisverd/';
export const OB_IS_FUEL_PRICE_PARSER_VERSION = 'ob-is-fuel-prices-v1';

export type ObIsFuelGrade = 'petrol' | 'diesel' | 'colored-diesel' | 'methane' | 'dock-diesel';

export type ObIsFuelPriceObservation = {
  id: string;
  domain: 'fuel';
  chainId: 'ob-is';
  stationId: string;
  stationName: string;
  locationId: number;
  grade: ObIsFuelGrade;
  label: string;
  pricePerLitre: number;
  currency: 'ISK';
  litreBasis: 1;
  observedAt: string;
  confidence: number;
  source: {
    id: 'ob-is-public-fuel-prices';
    kind: 'operator';
    name: 'OB fuel prices';
    operatorName: 'Olisuverzlun Islands';
    sourceUrl: string;
    legalReviewStatus: 'approved';
  };
  provenance: {
    sourceRunId: string;
    sourceUrl: string;
    capturedAt: string;
    parserVersion: string;
    rawRecordId: string;
    contentDigest: {
      algorithm: 'sha-256';
      value: string;
    };
  };
};

export type FetchObIsFuelPricesOptions = {
  fetchImpl?: typeof fetch;
  retrievedAt?: string;
  sourceRunId?: string;
  sourceUrl?: string;
};

type ObIsFuelPricePayload = {
  Success?: boolean;
  Message?: string;
  Items?: ObIsFuelPriceItem[];
};

type ObIsFuelPriceItem = {
  Name?: unknown;
  PricePetrol?: unknown;
  PriceDiesel?: unknown;
  PriceMetan?: unknown;
  PriceDock?: unknown;
  ColoredDiesel?: unknown;
  Location?: unknown;
  Type?: unknown;
};

const OB_IS_FUEL_GRADES: Array<{
  grade: ObIsFuelGrade;
  label: string;
  sourceField: keyof Pick<ObIsFuelPriceItem, 'PricePetrol' | 'PriceDiesel' | 'PriceMetan' | 'PriceDock' | 'ColoredDiesel'>;
}> = [
  { grade: 'petrol', label: 'Bensin', sourceField: 'PricePetrol' },
  { grade: 'diesel', label: 'Diesel', sourceField: 'PriceDiesel' },
  { grade: 'colored-diesel', label: 'Diesel litud', sourceField: 'ColoredDiesel' },
  { grade: 'methane', label: 'Metan', sourceField: 'PriceMetan' },
  { grade: 'dock-diesel', label: 'Bataolia', sourceField: 'PriceDock' }
];

export class ObIsFuelSourceBlockedError extends Error {
  constructor(sourceUrl: string, status: number) {
    super(`OB IS fuel source blocked or unavailable for reassignment: ${sourceUrl} returned HTTP ${status}`);
    this.name = 'ObIsFuelSourceBlockedError';
  }
}

export async function fetchObIsFuelPrices(options: FetchObIsFuelPricesOptions = {}): Promise<ObIsFuelPriceObservation[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = options.sourceUrl ?? OB_IS_FUEL_PRICE_URL;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'application/json',
      'user-agent': 'GroceryView/0.1 fuel-price-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new ObIsFuelSourceBlockedError(sourceUrl, response.status);
  }
  if (!response.ok) throw new Error(`OB IS fuel price request failed: ${response.status}`);

  return parseObIsFuelPriceJson(await response.text(), {
    sourceUrl,
    retrievedAt,
    sourceRunId: options.sourceRunId
  });
}

export function parseObIsFuelPriceJson(
  json: string,
  context: {
    sourceUrl?: string;
    retrievedAt: string;
    sourceRunId?: string;
  }
): ObIsFuelPriceObservation[] {
  const sourceUrl = context.sourceUrl ?? OB_IS_FUEL_PRICE_URL;
  const payload = parsePayload(json);
  if (payload.Success === false) throw new Error(`OB IS fuel price source failed: ${payload.Message ?? 'unknown error'}`);
  if (!Array.isArray(payload.Items)) throw new Error('OB IS fuel price items missing.');

  const digest = createHash('sha256').update(json).digest('hex');
  const source: ObIsFuelPriceObservation['source'] = {
    id: 'ob-is-public-fuel-prices',
    kind: 'operator' as const,
    name: 'OB fuel prices',
    operatorName: 'Olisuverzlun Islands' as const,
    sourceUrl,
    legalReviewStatus: 'approved' as const
  };
  const sourceRunId = context.sourceRunId ?? `ob-is-fuel-${context.retrievedAt.slice(0, 10)}`;

  return payload.Items
    .filter(isPublicStationRow)
    .flatMap((item) => {
      const locationId = numberField(item.Location, 'Location');
      const stationName = stringField(item.Name, 'Name');
      const stationId = `ob-is-${locationId}-${slugify(stationName)}`;
      return OB_IS_FUEL_GRADES.flatMap((grade) => {
        const pricePerLitre = optionalPositivePrice(item[grade.sourceField], grade.sourceField);
        if (pricePerLitre === null) return [];
        return [{
          id: `fuel-${stationId}-${grade.grade}`,
          domain: 'fuel' as const,
          chainId: 'ob-is' as const,
          stationId,
          stationName,
          locationId,
          grade: grade.grade,
          label: grade.label,
          pricePerLitre,
          currency: 'ISK' as const,
          litreBasis: 1 as const,
          observedAt: context.retrievedAt,
          confidence: 0.9,
          source,
          provenance: {
            sourceRunId,
            sourceUrl,
            capturedAt: context.retrievedAt,
            parserVersion: OB_IS_FUEL_PRICE_PARSER_VERSION,
            rawRecordId: `ob-is-location-${locationId}`,
            contentDigest: {
              algorithm: 'sha-256' as const,
              value: digest
            }
          }
        }];
      });
    });
}

function parsePayload(json: string): ObIsFuelPricePayload {
  try {
    return JSON.parse(json) as ObIsFuelPricePayload;
  } catch (error) {
    throw new Error(`OB IS fuel price JSON parse failed: ${(error as Error).message}`);
  }
}

function isPublicStationRow(item: ObIsFuelPriceItem): boolean {
  return numberField(item.Location, 'Location') !== 0 && numberField(item.Type, 'Type') === 1;
}

function stringField(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`OB IS fuel price ${fieldName} missing.`);
  return value.trim();
}

function numberField(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`OB IS fuel price ${fieldName} missing.`);
  return value;
}

function optionalPositivePrice(value: unknown, fieldName: string): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`OB IS fuel price ${fieldName} missing.`);
  if (value === 0) return null;
  if (value < 0) throw new Error(`Invalid OB IS fuel price for ${fieldName}.`);
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
