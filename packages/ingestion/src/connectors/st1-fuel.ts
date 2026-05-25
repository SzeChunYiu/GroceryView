import { createHash } from 'node:crypto';

export const ST1_FUEL_PRICE_URL = 'https://st1.se/foretag/listpris';
export const ST1_TRUCK_FUEL_PRICE_URL = 'https://st1.se/foretag/listpris-truck';
export const ST1_LOW_PRICE_URL = 'https://st1.se/privat/tjanster/billig-bensin';
export const ST1_STATIONS_URL = 'https://st1.se/privat/tjanster/st1-stationer';
export const ST1_MOBILITY_URL = 'https://st1.se/app-och-erbjudanden/st1-mobility';
export const ST1_EV_CHARGING_PRICES_URL = 'https://st1.se/privat/produkter/ladda-bilen/priser';
export const ST1_SE_QUIRK_PARSER_VERSION = 'st1-se-pricing-quirks-v1';

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

export type St1SePricingQuirkRow = {
  chain: 'st1-se';
  country: 'SE';
  currency: 'SEK';
  store_id: string;
  region: string;
  format: 'st1_station' | 'st1_truck' | 'st1_mobility' | 'st1_ev_charging';
  product: string;
  channel: 'store' | 'app' | 'b2b';
  customer_segment: 'consumer' | 'business';
  price: number | null;
  unit: 'l' | 'kwh' | 'metadata' | 'offer';
  is_member_price: boolean;
  is_subscription_price: boolean;
  is_coupon_price: boolean;
  is_clearance: boolean;
  multi_buy: null;
  display_price_note?: string;
  out_of_scope_for_consumer_connector?: boolean;
  sourceUrl: string;
  retrievedAt: string;
  provenance: {
    parserVersion: string;
    evidenceText: string;
  };
};

export type ParseSt1SePricingQuirksInput = {
  listPriceHtml: string;
  truckListPriceHtml: string;
  lowPriceHtml: string;
  mobilityHtml: string;
  evChargingPricesHtml: string;
  retrievedAt: string;
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

export function parseSt1SePricingQuirks(input: ParseSt1SePricingQuirksInput): St1SePricingQuirkRow[] {
  const listText = decodeHtmlText(input.listPriceHtml);
  const truckText = decodeHtmlText(input.truckListPriceHtml);
  const lowPriceText = decodeHtmlText(input.lowPriceHtml);
  const mobilityText = decodeHtmlText(input.mobilityHtml);
  const evText = decodeHtmlText(input.evChargingPricesHtml);
  const allText = [listText, truckText, lowPriceText, mobilityText, evText].join(' ');
  if (/captcha|access denied|cloudflare|logga in/i.test(allText)) {
    throw new Error('St1 SE source returned a blocked/login page.');
  }

  const businessListEvidence = requireTextEvidence(
    listText,
    /Listpriserna gäller oavsett var du tankar och betalar med kortet i Sverige\. Din eventuella rabatt gäller alltid mot aktuellt listpris\./i,
    'St1 Business list-price agreement'
  );
  const localPriceEvidence = requireTextEvidence(
    lowPriceText,
    /Varje dag varierar priset på bensinstationer runt om i Sverige\.[^]*?lokala marknaden[^.]*\./i,
    'local fuel price variation'
  );
  const truckDisplayEvidence = requireTextEvidence(
    truckText,
    /fiktivt pris på 1 kr\/liter\. Kvittot visar korrekt pris\.|Vid tankning på St1-stationer utgår aktuellt pumppris utan rabatt\./i,
    'St1 Truck display and station pump-price rule'
  );
  const appOfferEvidence = requireTextEvidence(
    mobilityText,
    /St1 Mobility ger dig också unika erbjudanden från vägens godaste matdestinationer PLOQ och Välkommen in!|Få app-unika erbjudanden/i,
    'St1 Mobility app-only offers'
  );
  const evMullsjoEvidence = requireEvChargingEvidence(evText, 'Mullsjö');
  const evArvikaEvidence = requireEvChargingEvidence(evText, 'Arvika');

  const base = {
    chain: 'st1-se' as const,
    country: 'SE' as const,
    currency: 'SEK' as const,
    is_subscription_price: false,
    is_clearance: false,
    multi_buy: null,
    retrievedAt: input.retrievedAt
  };

  return [
    {
      ...base,
      store_id: 'se:national-st1-business',
      region: 'se-national',
      format: 'st1_station',
      product: 'St1 Business list-price fuel agreement',
      channel: 'b2b',
      customer_segment: 'business',
      price: null,
      unit: 'metadata',
      is_member_price: true,
      is_coupon_price: false,
      out_of_scope_for_consumer_connector: true,
      sourceUrl: ST1_FUEL_PRICE_URL,
      provenance: { parserVersion: ST1_SE_QUIRK_PARSER_VERSION, evidenceText: businessListEvidence }
    },
    {
      ...base,
      store_id: 'se:local-market-fuel',
      region: 'se-local-market',
      format: 'st1_station',
      product: 'Local St1 pump fuel price',
      channel: 'store',
      customer_segment: 'consumer',
      price: null,
      unit: 'metadata',
      is_member_price: false,
      is_coupon_price: false,
      sourceUrl: ST1_LOW_PRICE_URL,
      provenance: { parserVersion: ST1_SE_QUIRK_PARSER_VERSION, evidenceText: localPriceEvidence }
    },
    {
      ...base,
      store_id: 'se:national-st1-truck',
      region: 'se-national',
      format: 'st1_truck',
      product: 'St1 Truck heavy-traffic list-price display rule',
      channel: 'b2b',
      customer_segment: 'business',
      price: null,
      unit: 'metadata',
      is_member_price: true,
      is_coupon_price: false,
      out_of_scope_for_consumer_connector: true,
      display_price_note: 'St1 Truck diesel pump may display 1 kr/liter for heavy-traffic Business-card fills while receipt shows the correct price.',
      sourceUrl: ST1_TRUCK_FUEL_PRICE_URL,
      provenance: { parserVersion: ST1_SE_QUIRK_PARSER_VERSION, evidenceText: truckDisplayEvidence }
    },
    {
      ...base,
      store_id: 'se:national-st1-mobility',
      region: 'se-national',
      format: 'st1_mobility',
      product: 'St1 Mobility app-only PLOQ and Välkommen in offers',
      channel: 'app',
      customer_segment: 'consumer',
      price: null,
      unit: 'offer',
      is_member_price: false,
      is_coupon_price: true,
      sourceUrl: ST1_MOBILITY_URL,
      provenance: { parserVersion: ST1_SE_QUIRK_PARSER_VERSION, evidenceText: appOfferEvidence }
    },
    evChargingRow('Mullsjö', evMullsjoEvidence, input.retrievedAt),
    evChargingRow('Arvika', evArvikaEvidence, input.retrievedAt)
  ];
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

function requireTextEvidence(text: string, pattern: RegExp, label: string): string {
  const match = text.match(pattern);
  if (!match) throw new Error(`St1 SE source missing evidence for ${label}.`);
  return match[0];
}

function requireEvChargingEvidence(text: string, city: string): { evidenceText: string; price: number } {
  const match = text.match(new RegExp(`${escapeRegExp(city)}\\s+Ladda bilen[^]*?Pris:\\s*([0-9]+(?:,[0-9]{1,2})?)\\s*kr/kWh`, 'i'));
  if (!match) throw new Error(`St1 SE source missing EV charging price evidence for ${city}.`);
  const price = Number.parseFloat(match[1].replace(',', '.'));
  if (!Number.isFinite(price) || price < 0) throw new Error(`Invalid St1 EV charging price for ${city}.`);
  return { evidenceText: match[0].replace(/\s+/g, ' ').trim(), price };
}

function evChargingRow(city: string, evidence: { evidenceText: string; price: number }, retrievedAt: string): St1SePricingQuirkRow {
  const slug = city.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return {
    chain: 'st1-se',
    country: 'SE',
    currency: 'SEK',
    store_id: `se:st1-ev:${slug}`,
    region: `se:${slug}`,
    format: 'st1_ev_charging',
    product: `St1 EV charging ${city}`,
    channel: 'store',
    customer_segment: 'consumer',
    price: evidence.price,
    unit: 'kwh',
    is_member_price: false,
    is_subscription_price: false,
    is_coupon_price: false,
    is_clearance: false,
    multi_buy: null,
    sourceUrl: ST1_EV_CHARGING_PRICES_URL,
    retrievedAt,
    provenance: {
      parserVersion: ST1_SE_QUIRK_PARSER_VERSION,
      evidenceText: evidence.evidenceText
    }
  };
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
