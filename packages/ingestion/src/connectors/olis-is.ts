export type OlisFuelGrade = '95' | 'diesel' | 'colored-diesel' | 'adblue';

export type OlisFuelPriceObservation = {
  chainId: 'olis-is';
  confidence: number;
  currency: 'ISK';
  domain: 'fuel';
  grade: OlisFuelGrade;
  id: string;
  label: string;
  observedAt: string;
  pricePerLitre: number;
  provenance: {
    capturedAt: string;
    parserVersion: 'olis-is-fuel-v1';
    rawSnapshotRef: string;
    sourceUrl: string;
  };
  sourceUrl: string;
  unit: 'l';
};

export type FetchOlisFuelPricesOptions = {
  capturedAt?: string;
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
};

const OLIS_FUEL_PRICE_URL = 'https://www.olis.is/';
const OLIS_PARSER_VERSION = 'olis-is-fuel-v1';

const OLIS_GRADES: Array<{ grade: OlisFuelGrade; label: string; patterns: RegExp[] }> = [
  { grade: '95', label: 'Bensín 95', patterns: [/bens[ií]n\s*95/i, /95\s*okt/i] },
  { grade: 'diesel', label: 'Dísel', patterns: [/d[ií]sel(?!\s*lita)/i, /diesel/i] },
  { grade: 'colored-diesel', label: 'Litað dísel', patterns: [/lita[ðd]\s*d[ií]sel/i] },
  { grade: 'adblue', label: 'AdBlue', patterns: [/adblue/i] }
];

export async function fetchOlisFuelPrices(options: FetchOlisFuelPricesOptions = {}): Promise<OlisFuelPriceObservation[]> {
  const sourceUrl = options.sourceUrl ?? OLIS_FUEL_PRICE_URL;
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 fuel-price-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (response.status === 401 || response.status === 403 || response.status === 429) {
    throw new Error(`Olís fuel source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Olís fuel source failed with HTTP ${response.status}.`);

  const body = await response.text();
  return parseOlisFuelPricePage({ body, capturedAt, sourceUrl });
}

export function parseOlisFuelPricePage(input: {
  body: string;
  capturedAt: string;
  rawSnapshotRef?: string;
  sourceUrl?: string;
}): OlisFuelPriceObservation[] {
  const sourceUrl = input.sourceUrl ?? OLIS_FUEL_PRICE_URL;
  const text = decodeHtmlText(input.body);
  const rawSnapshotRef = input.rawSnapshotRef ?? `raw://olis-is/${contentHashFor(input.body)}`;

  return OLIS_GRADES.flatMap((grade) => {
    const pricePerLitre = priceForGrade(text, grade.patterns);
    if (pricePerLitre === null) return [];

    return [{
      chainId: 'olis-is' as const,
      confidence: 0.82,
      currency: 'ISK' as const,
      domain: 'fuel' as const,
      grade: grade.grade,
      id: `fuel-olis-is-${grade.grade}-${input.capturedAt.slice(0, 10)}`,
      label: grade.label,
      observedAt: input.capturedAt,
      pricePerLitre,
      provenance: {
        capturedAt: input.capturedAt,
        parserVersion: OLIS_PARSER_VERSION,
        rawSnapshotRef,
        sourceUrl
      },
      sourceUrl,
      unit: 'l' as const
    }];
  });
}

function priceForGrade(text: string, patterns: readonly RegExp[]): number | null {
  for (const pattern of patterns) {
    const index = text.search(pattern);
    if (index < 0) continue;
    const nearby = text.slice(index, index + 220);
    const match = nearby.match(/(\d{2,4}(?:[.,]\d{1,2})?)\s*(?:kr\.?|isk)?/i);
    if (match) return parseIcelandicKronur(match[1]!);
  }
  return null;
}

function parseIcelandicKronur(value: string): number {
  const parsed = Number.parseFloat(value.replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Invalid Olís fuel price: ${value}`);
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}

function decodeHtmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function contentHashFor(body: string): string {
  let hash = 0;
  for (let index = 0; index < body.length; index += 1) {
    hash = ((hash << 5) - hash + body.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(16);
}
