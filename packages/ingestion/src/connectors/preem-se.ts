import type { FuelGradeId, FuelPriceSourceKind } from './okq8-fuel.js';

export const PREEM_STATIONS_STORE_URL = 'https://www.preem.se/stations-store.json';
export const PREEM_FUEL_LIST_PRICES_URL = 'https://www.preem.se/foretag/listpriser/';
export const PREEM_CONVENIENCE_OFFERS_URL = 'https://www.preem.se/pa-stationen/erbjudanden/';
export const PREEM_SE_PRICE_PARSER_VERSION = 'preem-se-prices-v1';

export type PreemFuelGradeId = FuelGradeId;
export type PreemPriceDomain = 'fuel' | 'convenience';

export type PreemStation = {
  stationId: string;
  sourceStationCode: string;
  name: string;
  chainId: 'preem';
  operatorName: 'Preem';
  stationType: string;
  stationConcept: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  municipality: string;
  county: string;
  latitude: number;
  longitude: number;
  foodAndBeverages: boolean;
  espressoHouse: boolean;
  fuelTypes: string[];
  sourceUrl: string;
};

export type PreemFuelPriceObservation = {
  domain: 'fuel';
  productId: PreemFuelGradeId;
  fuelGrade: '95' | '98' | 'diesel' | 'hvo100' | 'e85';
  gradeLabel: string;
  chainId: 'preem';
  operatorName: 'Preem';
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
    source: 'preem_fuel_list_prices';
    sourceUrl: string;
    parserVersion: string;
    rawSnapshotRef: string;
    originalTitle: string;
    originalPriceText: string;
    originalEffectiveDate: string;
  };
};

export type PreemConveniencePriceObservation = {
  domain: 'convenience';
  productId: string;
  categoryId: 'preem-food' | 'preem-convenience' | 'preem-car-care';
  offerTitle: string;
  rawName: string;
  chainId: 'preem';
  operatorName: 'Preem';
  sourceKind: 'operator_public_offer_page';
  sourceUrl: string;
  observedAt: string;
  capturedAt: string;
  price: number;
  regularPrice?: number;
  currency: 'SEK';
  packageSize: number;
  packageUnit: 'pce';
  memberOnly: boolean;
  confidence: number;
  provenance: {
    source: 'preem_convenience_offers';
    sourceUrl: string;
    parserVersion: string;
    rawSnapshotRef: string;
    originalTitle: string;
    originalPriceText: string;
    originalRegularPriceText?: string;
  };
};

export type PreemSePriceRow = (PreemFuelPriceObservation | PreemConveniencePriceObservation) & {
  station: PreemStation;
  storeId: string;
};

type PreemStationStorePayload = {
  data?: unknown;
};

const PREEM_FUEL_ROWS: Array<{
  sourceTitle: string;
  productId: PreemFuelGradeId;
  fuelGrade: PreemFuelPriceObservation['fuelGrade'];
  gradeLabel: string;
  aliases: RegExp[];
}> = [
  {
    sourceTitle: 'Preem Evolution Bensin 95',
    productId: 'fuel-95-e10',
    fuelGrade: '95',
    gradeLabel: 'Preem Evolution Bensin 95 E10',
    aliases: [/evolution\s*bensin\s*95/i, /\bbensin\s*95\b/i]
  },
  {
    sourceTitle: 'Bensin 98',
    productId: 'fuel-98',
    fuelGrade: '98',
    gradeLabel: 'Bensin 98',
    aliases: [/\bbensin\s*98\b/i]
  },
  {
    sourceTitle: 'Preem Evolution Diesel',
    productId: 'fuel-diesel',
    fuelGrade: 'diesel',
    gradeLabel: 'Preem Evolution Diesel',
    aliases: [/preem\s*evolution\s*diesel/i, /evolution\s*diesel/i, /acp\s*diesel/i]
  },
  {
    sourceTitle: 'HVO100',
    productId: 'fuel-hvo100',
    fuelGrade: 'hvo100',
    gradeLabel: 'HVO100',
    aliases: [/hvo\s*100/i, /hvo100/i, /redefine\s*hvo/i]
  },
  {
    sourceTitle: 'Etanol E85',
    productId: 'fuel-e85',
    fuelGrade: 'e85',
    gradeLabel: 'Etanol E85',
    aliases: [/\be85\b/i, /etanol/i]
  }
];

function stableKeyPart(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'unknown';
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function bool(value: unknown): boolean {
  return value === true;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function contentHashFor(prefix: string, body: string): string {
  let hash = 0;
  for (let index = 0; index < body.length; index += 1) {
    hash = ((hash << 5) - hash + body.charCodeAt(index)) | 0;
  }
  return `${prefix}-${Math.abs(hash).toString(16)}`;
}

function parseSwedishPrice(value: string, context: string): number {
  const normalized = value.replace(/\s+/g, ' ').trim().replace(',', '.');
  const match = normalized.match(/(\d+(?:\.\d{1,2})?)/);
  if (!match) throw new Error(`Missing Preem price for ${context}: ${value}`);
  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Invalid Preem price for ${context}: ${value}`);
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}

function isoDateAtStartOfDay(date: string, context: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Invalid Preem effective date for ${context}: ${date}`);
  return `${date}T00:00:00.000Z`;
}

function decodeHtmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&aring;/g, 'å')
    .replace(/&auml;/g, 'ä')
    .replace(/&ouml;/g, 'ö')
    .replace(/&Aring;/g, 'Å')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&ndash;|&mdash;/g, '–')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function preemFuelRowForStationFuelType(fuelType: string): typeof PREEM_FUEL_ROWS[number] | null {
  const normalized = fuelType.replace(/([a-z])([A-Z])/g, '$1 $2');
  return PREEM_FUEL_ROWS.find((row) => row.aliases.some((alias) => alias.test(normalized))) ?? null;
}

export function parsePreemStationsStore(input: {
  body: string;
  sourceUrl?: string;
}): PreemStation[] {
  const sourceUrl = input.sourceUrl ?? PREEM_STATIONS_STORE_URL;
  let payload: PreemStationStorePayload;
  try {
    payload = JSON.parse(input.body) as PreemStationStorePayload;
  } catch (error) {
    throw new Error(`Preem station store JSON is invalid: ${error instanceof Error ? error.message : 'unknown parse error'}`);
  }
  const rows = Array.isArray(payload.data) ? payload.data : [];
  return rows.flatMap((entry): PreemStation[] => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return [];
    const record = entry as Record<string, unknown>;
    if (text(record.chain).toLowerCase() !== 'preem') return [];
    if (!text(record.county)) return [];
    const sourceStationCode = text(record.stationCode);
    const latitude = numberOrNull(record.latitude);
    const longitude = numberOrNull(record.longitude);
    if (!sourceStationCode || latitude === null || longitude === null) return [];
    const fuelTypes = Array.isArray(record.fuelTypes)
      ? record.fuelTypes.map((fuel) => typeof fuel === 'object' && fuel !== null && !Array.isArray(fuel) ? text((fuel as Record<string, unknown>).name) : '').filter(Boolean)
      : [];

    return [{
      stationId: `preem-${stableKeyPart(sourceStationCode)}`,
      sourceStationCode,
      name: text(record.stationName) || `Preem ${sourceStationCode}`,
      chainId: 'preem',
      operatorName: 'Preem',
      stationType: text(record.stationType),
      stationConcept: text(record.stationConcept),
      streetAddress: text(record.streetAddress),
      postalCode: text(record.postalCode),
      city: text(record.city),
      municipality: text(record.municipality),
      county: text(record.county),
      latitude,
      longitude,
      foodAndBeverages: bool(record.foodAndBeverages),
      espressoHouse: bool(record.espressoHouse),
      fuelTypes,
      sourceUrl
    }];
  });
}

export function parsePreemFuelListPricePage(input: {
  body: string;
  sourceUrl?: string;
  capturedAt: string;
  rawSnapshotRef?: string;
  parserVersion?: string;
}): PreemFuelPriceObservation[] {
  const sourceUrl = input.sourceUrl ?? PREEM_FUEL_LIST_PRICES_URL;
  const parserVersion = input.parserVersion ?? PREEM_SE_PRICE_PARSER_VERSION;
  const rawSnapshotRef = input.rawSnapshotRef ?? `raw://preem-se/fuel/${contentHashFor('preem-fuel', input.body)}`;
  const text = decodeHtmlText(input.body);
  const businessCardSection = text.match(/Listpriser Företagskort och Transportkort([\s\S]*?)Prishistorik Företagskort och Transportkort/i)?.[1]
    ?? text;

  return PREEM_FUEL_ROWS.map((grade) => {
    const pattern = new RegExp(`${escapeRegExp(grade.sourceTitle)}\\s+Pris inkl\\. moms\\s+([0-9]+(?:[,.][0-9]{1,2})?)\\s*kr\\/l\\s+Gäller fr\\.om\\s+(\\d{4}-\\d{2}-\\d{2})`, 'i');
    const match = businessCardSection.match(pattern);
    if (!match) throw new Error(`Preem fuel list price row not found: ${grade.sourceTitle}`);
    const originalPriceText = `${match[1]} kr/l`;
    const effectiveFrom = match[2]!;
    return {
      domain: 'fuel',
      productId: grade.productId,
      fuelGrade: grade.fuelGrade,
      gradeLabel: grade.gradeLabel,
      chainId: 'preem',
      operatorName: 'Preem',
      sourceKind: 'operator_public_price_page',
      sourceUrl,
      observedAt: isoDateAtStartOfDay(effectiveFrom, grade.sourceTitle),
      capturedAt: input.capturedAt,
      effectiveFrom,
      pricePerLitre: parseSwedishPrice(originalPriceText, grade.sourceTitle),
      currency: 'SEK',
      unit: 'l',
      confidence: 0.82,
      provenance: {
        source: 'preem_fuel_list_prices',
        sourceUrl,
        parserVersion,
        rawSnapshotRef,
        originalTitle: grade.sourceTitle,
        originalPriceText,
        originalEffectiveDate: effectiveFrom
      }
    };
  });
}

function categoryForOffer(title: string, description: string): PreemConveniencePriceObservation['categoryId'] {
  const haystack = `${title} ${description}`.toLowerCase();
  if (/tvätt|turtle|rengöring|spolarvätska/.test(haystack)) return 'preem-car-care';
  if (/lunch|frukost|fralla|yalla|kaffe|bulle|loka|dryck|korv|mat/.test(haystack)) return 'preem-food';
  return 'preem-convenience';
}

function removeRepeatedTitlePrefix(value: string): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  for (let length = 1; length <= Math.floor(words.length / 2); length += 1) {
    const first = words.slice(0, length).join(' ').toLowerCase();
    const second = words.slice(length, length * 2).join(' ').toLowerCase();
    if (first === second) return words.slice(0, length).join(' ');
  }
  return value.trim();
}

function parseOfferCandidates(text: string): Array<{ title: string; description: string; priceText: string; regularPriceText?: string }> {
  const section = text.match(/Aktuella erbjudanden på station([\s\S]*?)(?:Ta del av våra medlemserbjudanden|Villkor för våra erbjudanden)/i)?.[1]
    ?? text;
  const offerPattern = /(?:^\s*|[.)]\s+|\b(?:Bli medlem|Se meny|Hitta station)\s+)([A-ZÅÄÖ][A-ZÅÄÖa-zåäö0-9 &-]{1,80}?)\s+för\s+([0-9]+(?:[,.][0-9]{1,2})?)\s*kr/gi;
  const matches = [...section.matchAll(offerPattern)];
  const rows: Array<{ title: string; description: string; priceText: string; regularPriceText?: string }> = [];
  for (const [index, match] of matches.entries()) {
    const nextMatch = matches[index + 1];
    const chunk = section.slice(match.index ?? 0, nextMatch?.index ?? undefined);
    const rawTitle = match[1]!
      .replace(/^(och|en|ett|du får köpa|köp|från)\s+/i, '')
      .replace(/\s+från\s+[A-ZÅÄÖa-zåäö0-9].*$/i, '')
      .trim();
    const title = removeRepeatedTitlePrefix(rawTitle || match[1]!.trim());
    const regularMatch = chunk.match(/(?:ord\.?\s*pris|värde)\s*(?:ca\s*)?([0-9]+(?:[,.][0-9]{1,2})?)\s*kr/i);
    rows.push({
      title,
      description: chunk.trim(),
      priceText: `${match[2]} kr`,
      ...(regularMatch?.[1] ? { regularPriceText: `${regularMatch[1]} kr` } : {})
    });
  }

  const lunch = section.match(/Dagens lunch[^.]*?([0-9]+(?:[,.][0-9]{1,2})?)\s*kr/i);
  if (lunch && !rows.some((row) => /dagens lunch/i.test(row.title))) {
    rows.push({ title: 'Dagens lunch', description: lunch[0].trim(), priceText: `${lunch[1]} kr` });
  }
  return rows;
}

export function parsePreemConvenienceOfferPage(input: {
  body: string;
  sourceUrl?: string;
  capturedAt: string;
  rawSnapshotRef?: string;
  parserVersion?: string;
}): PreemConveniencePriceObservation[] {
  const sourceUrl = input.sourceUrl ?? PREEM_CONVENIENCE_OFFERS_URL;
  const parserVersion = input.parserVersion ?? PREEM_SE_PRICE_PARSER_VERSION;
  const rawSnapshotRef = input.rawSnapshotRef ?? `raw://preem-se/offers/${contentHashFor('preem-offers', input.body)}`;
  const text = decodeHtmlText(input.body);
  const candidates = parseOfferCandidates(text);
  const seen = new Set<string>();
  const rows: PreemConveniencePriceObservation[] = [];
  for (const candidate of candidates) {
    const key = stableKeyPart(`${candidate.title}-${candidate.priceText}`);
    if (seen.has(key)) continue;
    seen.add(key);
    const regularPrice = candidate.regularPriceText ? parseSwedishPrice(candidate.regularPriceText, candidate.title) : undefined;
    rows.push({
      domain: 'convenience',
      productId: `preem-offer-${key}`,
      categoryId: categoryForOffer(candidate.title, candidate.description),
      offerTitle: candidate.title,
      rawName: candidate.title,
      chainId: 'preem',
      operatorName: 'Preem',
      sourceKind: 'operator_public_offer_page',
      sourceUrl,
      observedAt: input.capturedAt,
      capturedAt: input.capturedAt,
      price: parseSwedishPrice(candidate.priceText, candidate.title),
      ...(regularPrice !== undefined ? { regularPrice } : {}),
      currency: 'SEK',
      packageSize: 1,
      packageUnit: 'pce',
      memberOnly: /medlem|bli medlem|preem medlem/i.test(candidate.description),
      confidence: 0.72,
      provenance: {
        source: 'preem_convenience_offers',
        sourceUrl,
        parserVersion,
        rawSnapshotRef,
        originalTitle: candidate.title,
        originalPriceText: candidate.priceText,
        ...(candidate.regularPriceText ? { originalRegularPriceText: candidate.regularPriceText } : {})
      }
    });
  }
  if (rows.length === 0) throw new Error('Preem convenience offer page contained no price rows.');
  return rows;
}

async function fetchText(fetchImpl: typeof fetch, sourceUrl: string, userAgent: string): Promise<string> {
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: sourceUrl.endsWith('.json') ? 'application/json' : 'text/html,application/xhtml+xml',
      'user-agent': userAgent
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Preem source blocked with HTTP ${response.status}: ${sourceUrl}`);
  }
  if (!response.ok) throw new Error(`Preem source failed with HTTP ${response.status}: ${sourceUrl}`);
  return await response.text();
}

export async function fetchPreemSePrices(options: {
  fetchImpl?: typeof fetch;
  capturedAt?: string;
  stationSourceUrl?: string;
  fuelSourceUrl?: string;
  offerSourceUrl?: string;
  maxStations?: number;
} = {}): Promise<PreemSePriceRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const stationSourceUrl = options.stationSourceUrl ?? PREEM_STATIONS_STORE_URL;
  const fuelSourceUrl = options.fuelSourceUrl ?? PREEM_FUEL_LIST_PRICES_URL;
  const offerSourceUrl = options.offerSourceUrl ?? PREEM_CONVENIENCE_OFFERS_URL;
  const userAgent = 'GroceryView Preem SE connector (+https://github.com/SzeChunYiu/GroceryView)';

  const [stationBody, fuelBody, offerBody] = await Promise.all([
    fetchText(fetchImpl, stationSourceUrl, userAgent),
    fetchText(fetchImpl, fuelSourceUrl, userAgent),
    fetchText(fetchImpl, offerSourceUrl, userAgent)
  ]);
  const stations = parsePreemStationsStore({ body: stationBody, sourceUrl: stationSourceUrl })
    .slice(0, options.maxStations ?? Number.POSITIVE_INFINITY);
  const fuelPrices = parsePreemFuelListPricePage({
    body: fuelBody,
    sourceUrl: fuelSourceUrl,
    capturedAt,
    rawSnapshotRef: `raw://preem-se/fuel/${contentHashFor('preem-fuel', fuelBody)}`
  });
  const fuelPriceByProductId = new Map(fuelPrices.map((row) => [row.productId, row]));
  const offers = parsePreemConvenienceOfferPage({
    body: offerBody,
    sourceUrl: offerSourceUrl,
    capturedAt,
    rawSnapshotRef: `raw://preem-se/offers/${contentHashFor('preem-offers', offerBody)}`
  });

  const rows: PreemSePriceRow[] = [];
  for (const station of stations) {
    const stationFuelProductIds = new Set(station.fuelTypes.flatMap((fuelType) => {
      const grade = preemFuelRowForStationFuelType(fuelType);
      return grade ? [grade.productId] : [];
    }));
    for (const productId of stationFuelProductIds) {
      const fuelPrice = fuelPriceByProductId.get(productId);
      if (fuelPrice) rows.push({ ...fuelPrice, station, storeId: station.stationId });
    }
    if (station.foodAndBeverages || /bemannad/i.test(station.stationType)) {
      for (const offer of offers) rows.push({ ...offer, station, storeId: station.stationId });
    }
  }
  if (rows.length === 0) throw new Error('Preem connector produced no station-scoped fuel or convenience price rows.');
  return rows;
}
