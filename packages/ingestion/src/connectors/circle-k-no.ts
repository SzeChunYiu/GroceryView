import { createHash } from 'node:crypto';

export const CIRCLE_K_NO_FUEL_PRICES_URL = 'https://www.circlek.no/bedrift/drivstoff/drivstoffpriser';
export const CIRCLE_K_NO_CONVENIENCE_URL = 'https://www.circlek.no/mat-og-drikke';
export const CIRCLE_K_NO_PARSER_VERSION = 'circle-k-no-v1';

export type CircleKNoFuelGrade = '95' | '98' | 'diesel' | 'hvo100' | 'truckdiesel' | 'construction-diesel';

export type CircleKNoFuelPriceObservation = {
  id: string;
  domain: 'fuel';
  countryCode: 'NO';
  chainId: 'circle_k_no';
  operatorName: 'Circle K Norge';
  grade: CircleKNoFuelGrade;
  label: string;
  pricePerLitre: number;
  currency: 'NOK';
  unit: 'l';
  observedAt: string;
  validFrom: string;
  confidence: number;
  sourceUrl: string;
  provenance: {
    source: 'circle_k_no_fuel_prices';
    sourceUrl: string;
    capturedAt: string;
    parserVersion: string;
    contentDigest: string;
    originalLabel: string;
    originalPriceText: string;
    originalValidFrom: string;
  };
};

export type CircleKNoConvenienceProduct = {
  id: string;
  domain: 'convenience';
  countryCode: 'NO';
  chainId: 'circle_k_no';
  operatorName: 'Circle K Norge';
  name: string;
  categoryLabel: string;
  sourceUrl: string;
  observedAt: string;
  confidence: number;
  provenance: {
    source: 'circle_k_no_convenience';
    sourceUrl: string;
    capturedAt: string;
    parserVersion: string;
    contentDigest: string;
  };
};

type ParseContext = {
  body: string;
  sourceUrl?: string;
  capturedAt: string;
};

export async function fetchCircleKNoFuelPrices(options: {
  fetchImpl?: typeof fetch;
  capturedAt?: string;
  sourceUrl?: string;
} = {}): Promise<CircleKNoFuelPriceObservation[]> {
  const sourceUrl = options.sourceUrl ?? CIRCLE_K_NO_FUEL_PRICES_URL;
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 Circle K NO connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Circle K NO fuel source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Circle K NO fuel source failed with HTTP ${response.status}.`);
  return parseCircleKNoFuelPrices({ body: await response.text(), sourceUrl, capturedAt });
}

export async function fetchCircleKNoConvenienceProducts(options: {
  fetchImpl?: typeof fetch;
  capturedAt?: string;
  sourceUrl?: string;
} = {}): Promise<CircleKNoConvenienceProduct[]> {
  const sourceUrl = options.sourceUrl ?? CIRCLE_K_NO_CONVENIENCE_URL;
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 Circle K NO connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Circle K NO convenience source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Circle K NO convenience source failed with HTTP ${response.status}.`);
  return parseCircleKNoConvenienceProducts({ body: await response.text(), sourceUrl, capturedAt });
}

export function parseCircleKNoFuelPrices(input: ParseContext): CircleKNoFuelPriceObservation[] {
  const sourceUrl = input.sourceUrl ?? CIRCLE_K_NO_FUEL_PRICES_URL;
  const digest = contentDigest(input.body);
  const rows = htmlTableRows(input.body)
    .map((cells) => fuelRowFromCells(cells))
    .filter((row): row is { label: string; grade: CircleKNoFuelGrade; priceText: string; validFrom: string } => row !== null);

  if (rows.length === 0) throw new Error('Circle K NO fuel price rows not found.');

  return rows.map((row) => {
    const pricePerLitre = parseNorwegianPrice(row.priceText);
    const observedAt = isoDate(row.validFrom);
    return {
      id: `circle-k-no-${row.grade}-${observedAt.slice(0, 10)}`,
      domain: 'fuel',
      countryCode: 'NO',
      chainId: 'circle_k_no',
      operatorName: 'Circle K Norge',
      grade: row.grade,
      label: row.label,
      pricePerLitre,
      currency: 'NOK',
      unit: 'l',
      observedAt,
      validFrom: row.validFrom,
      confidence: 0.85,
      sourceUrl,
      provenance: {
        source: 'circle_k_no_fuel_prices',
        sourceUrl,
        capturedAt: input.capturedAt,
        parserVersion: CIRCLE_K_NO_PARSER_VERSION,
        contentDigest: digest,
        originalLabel: row.label,
        originalPriceText: row.priceText,
        originalValidFrom: row.validFrom
      }
    };
  });
}

export function parseCircleKNoConvenienceProducts(input: ParseContext): CircleKNoConvenienceProduct[] {
  const sourceUrl = input.sourceUrl ?? CIRCLE_K_NO_CONVENIENCE_URL;
  const digest = contentDigest(input.body);
  const names = [...jsonLdNames(input.body), ...headingNames(input.body)]
    .map((name) => normalizeText(name))
    .filter((name) => name.length > 0);
  const uniqueNames = [...new Set(names)].slice(0, 50);

  return uniqueNames.map((name) => ({
    id: `circle-k-no-convenience-${slug(name)}`,
    domain: 'convenience',
    countryCode: 'NO',
    chainId: 'circle_k_no',
    operatorName: 'Circle K Norge',
    name,
    categoryLabel: 'Circle K NO convenience',
    sourceUrl,
    observedAt: input.capturedAt,
    confidence: 0.7,
    provenance: {
      source: 'circle_k_no_convenience',
      sourceUrl,
      capturedAt: input.capturedAt,
      parserVersion: CIRCLE_K_NO_PARSER_VERSION,
      contentDigest: digest
    }
  }));
}

function fuelRowFromCells(cells: string[]): { label: string; grade: CircleKNoFuelGrade; priceText: string; validFrom: string } | null {
  const normalized = cells.map(normalizeText).filter(Boolean);
  if (normalized.length < 3) return null;
  const label = normalized[0]!;
  const grade = fuelGrade(label);
  if (!grade) return null;
  const priceText = normalized.find((cell) => /\d+[,.]\d{1,2}\s*(?:kr|nok)?$/i.test(cell));
  const validFrom = normalized.find((cell) => /^\d{4}-\d{2}-\d{2}$/.test(cell) || /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(cell));
  if (!priceText || !validFrom) return null;
  return { label, grade, priceText, validFrom: normalizeDate(validFrom) };
}

function fuelGrade(label: string): CircleKNoFuelGrade | null {
  const normalized = label.toLowerCase();
  if (/hvo/.test(normalized)) return 'hvo100';
  if (/anlegg|avgiftsfri|farget/.test(normalized)) return 'construction-diesel';
  if (/truck/.test(normalized)) return 'truckdiesel';
  if (/diesel/.test(normalized)) return 'diesel';
  if (/\b98\b/.test(normalized)) return '98';
  if (/\b95\b/.test(normalized) || /miles/.test(normalized)) return '95';
  return null;
}

function htmlTableRows(html: string): string[][] {
  return [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) => (
    [...row[1]!.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => decodeHtml(cell[1]!))
  ));
}

function jsonLdNames(html: string): string[] {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap((match) => {
      try {
        const parsed = JSON.parse(match[1]!.trim()) as unknown;
        return namesFromJsonLd(parsed);
      } catch {
        return [];
      }
    });
}

function namesFromJsonLd(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(namesFromJsonLd);
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  const ownName = typeof record.name === 'string' ? [record.name] : [];
  return [
    ...ownName,
    ...namesFromJsonLd(record.item),
    ...namesFromJsonLd(record.itemListElement)
  ];
}

function headingNames(html: string): string[] {
  return [...html.matchAll(/<(?:h2|h3)\b[^>]*>([\s\S]*?)<\/(?:h2|h3)>/gi)].map((match) => decodeHtml(match[1]!));
}

function decodeHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeText(value: string): string {
  return decodeHtml(value).replace(/\s+/g, ' ').trim();
}

function parseNorwegianPrice(value: string): number {
  const parsed = Number(value.replace(/\s+/g, '').replace(',', '.').replace(/(?:kr|nok)$/i, ''));
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Invalid Circle K NO price: ${value}`);
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}

function normalizeDate(value: string): string {
  const trimmed = value.trim();
  const dotted = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotted) return `${dotted[3]}-${dotted[2]!.padStart(2, '0')}-${dotted[1]!.padStart(2, '0')}`;
  return trimmed;
}

function isoDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`Invalid Circle K NO valid-from date: ${value}`);
  return `${value}T00:00:00.000Z`;
}

function slug(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function contentDigest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
