export type FuelGradeId = 'fuel-95-e10' | 'fuel-98' | 'fuel-diesel' | 'fuel-hvo100' | 'fuel-e85';

export type FuelPriceSourceKind = 'operator_public_price_page' | 'crowd_station_report';

export type FuelPriceObservation = {
  domain: 'fuel';
  productId: FuelGradeId;
  fuelGrade: '95' | '98' | 'diesel' | 'hvo100' | 'e85';
  gradeLabel: string;
  chainId: 'okq8';
  operatorName: 'OKQ8';
  customerSegment: 'business';
  channel: 'store';
  storeRegion: 'SE-national';
  sourceKind: FuelPriceSourceKind;
  sourceUrl: string;
  observedAt: string;
  capturedAt: string;
  effectiveFrom: string;
  pricePerLitre: number;
  currency: 'SEK';
  unit: 'l';
  confidence: number;
  provenance: {
    source: 'okq8_fuel_prices';
    sourceUrl: string;
    parserVersion: string;
    rawSnapshotRef: string;
    originalTitle: string;
    originalPriceText: string;
    originalEffectiveDate: string;
  };
};

export type FuelOperatorSource = {
  kind: 'operator_public_price_page';
  operatorId: 'okq8';
  operatorName: 'OKQ8';
  sourceUrl: string;
  parserVersion: string;
  capturedAt: string;
};

export type FuelCrowdSource = {
  kind: 'crowd_station_report';
  reporterTrustTier: 'new' | 'trusted' | 'operator_verified';
  stationId: string;
  submittedAt: string;
  evidenceType: 'receipt' | 'pump_photo' | 'manual_entry';
};

export type FuelPriceSource = FuelOperatorSource | FuelCrowdSource;

export const OKQ8_FUEL_PRICES_URL = 'https://www.okq8.se/foretag/priser/';
export const OKQ8_FUEL_PRICE_PARSER_VERSION = 'okq8-fuel-prices-v1';

const OKQ8_GRADE_ROWS: Array<{
  title: string;
  productId: FuelGradeId;
  fuelGrade: FuelPriceObservation['fuelGrade'];
  gradeLabel: string;
}> = [
  { title: 'OKQ8 GoEasy 95 (Blyfri 95)', productId: 'fuel-95-e10', fuelGrade: '95', gradeLabel: '95 E10 / Blyfri 95' },
  { title: 'OKQ8 GoEasy 98 (Blyfri 98)', productId: 'fuel-98', fuelGrade: '98', gradeLabel: '98 / Blyfri 98' },
  { title: 'OKQ8 GoEasy Diesel', productId: 'fuel-diesel', fuelGrade: 'diesel', gradeLabel: 'Diesel' },
  { title: 'Neste MY Förnybar Diesel (HVO100)', productId: 'fuel-hvo100', fuelGrade: 'hvo100', gradeLabel: 'HVO100' },
  { title: 'Etanol E85', productId: 'fuel-e85', fuelGrade: 'e85', gradeLabel: 'E85' }
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseSwedishKronor(value: string): number {
  const normalized = value.replace(/\s+/g, ' ').trim().replace(',', '.').replace(/\s*kr$/i, '');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Invalid OKQ8 fuel price: ${value}`);
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}

function isoDateAtStartOfDay(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Invalid OKQ8 fuel effective date: ${date}`);
  return `${date}T00:00:00.000Z`;
}

function contentHashFor(body: string): string {
  let hash = 0;
  for (let index = 0; index < body.length; index += 1) {
    hash = ((hash << 5) - hash + body.charCodeAt(index)) | 0;
  }
  return `okq8-fuel-${Math.abs(hash).toString(16)}`;
}

export function parseOkq8FuelPricePage(input: {
  body: string;
  sourceUrl?: string;
  capturedAt: string;
  rawSnapshotRef?: string;
  parserVersion?: string;
}): FuelPriceObservation[] {
  const sourceUrl = input.sourceUrl ?? OKQ8_FUEL_PRICES_URL;
  const parserVersion = input.parserVersion ?? OKQ8_FUEL_PRICE_PARSER_VERSION;
  const rawSnapshotRef = input.rawSnapshotRef ?? `raw://okq8-fuel/${contentHashFor(input.body)}`;

  return OKQ8_GRADE_ROWS.map((grade) => {
    const pattern = new RegExp(
      `"title":"${escapeRegExp(grade.title)}","cells":\\[\\{"text":"([^"]+)","links":\\[\\]\\},\\{"text":"([^"]*)","links":\\[\\]\\},\\{"text":"([^"]+)","links":\\[\\]\\}\\]`
    );
    const match = input.body.match(pattern);
    if (!match) throw new Error(`OKQ8 fuel price row not found: ${grade.title}`);
    const priceText = match[1]!;
    const effectiveFrom = match[3]!.trim();
    const pricePerLitre = parseSwedishKronor(priceText);

    return {
      domain: 'fuel',
      productId: grade.productId,
      fuelGrade: grade.fuelGrade,
      gradeLabel: grade.gradeLabel,
      chainId: 'okq8',
      operatorName: 'OKQ8',
      customerSegment: 'business',
      channel: 'store',
      storeRegion: 'SE-national',
      sourceKind: 'operator_public_price_page',
      sourceUrl,
      observedAt: isoDateAtStartOfDay(effectiveFrom),
      capturedAt: input.capturedAt,
      effectiveFrom,
      pricePerLitre,
      currency: 'SEK',
      unit: 'l',
      confidence: 0.85,
      provenance: {
        source: 'okq8_fuel_prices',
        sourceUrl,
        parserVersion,
        rawSnapshotRef,
        originalTitle: grade.title,
        originalPriceText: priceText,
        originalEffectiveDate: effectiveFrom
      }
    };
  });
}

export async function fetchOkq8FuelPrices(options: {
  fetchImpl?: typeof fetch;
  capturedAt?: string;
  sourceUrl?: string;
} = {}): Promise<FuelPriceObservation[]> {
  const sourceUrl = options.sourceUrl ?? OKQ8_FUEL_PRICES_URL;
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView fuel-price connector (+https://groceryview.example)'
    }
  });
  if (response.status === 403 || response.status === 401) throw new Error(`OKQ8 fuel price source blocked with HTTP ${response.status}.`);
  if (!response.ok) throw new Error(`OKQ8 fuel price source failed with HTTP ${response.status}.`);
  const body = await response.text();
  if (/captcha|logga in för att fortsätta|access denied/i.test(body)) {
    throw new Error('OKQ8 fuel price source returned a login/captcha/access-denied page.');
  }
  return parseOkq8FuelPricePage({
    body,
    sourceUrl,
    capturedAt,
    rawSnapshotRef: `raw://okq8-fuel/${contentHashFor(body)}`
  });
}
