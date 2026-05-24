export type OrkanPriceUnit = 'liter' | 'kWh';
export type OrkanProductId = 'petrol_95' | 'diesel' | 'ev_fast_charging';
export type OrkanStationFormat = 'standard_self_service' | 'lowest_price_station' | 'lowest_price_ev_station';

export type OrkanPriceRow = {
  chain: 'orkan';
  country: 'IS';
  store_id: string;
  station: string;
  region: string;
  product_id: OrkanProductId;
  product_name: string;
  price: number;
  currency: 'ISK';
  unit: OrkanPriceUnit;
  channel: 'store';
  format: OrkanStationFormat;
  is_member_price: boolean;
  source_url: string;
  retrieved_at: string;
  evidence: string;
};

export type OrkanStation = {
  name: string;
  slug: string;
  region: string;
  format: OrkanStationFormat;
};

export const ORKAN_LOWEST_PRICE_URL = 'https://www.orkan.is/laegsta-verdid/';
export const ORKAN_STATIONS_URL = 'https://www.orkan.is/orkustodvar/';
export const ORKAN_ENGLISH_URL = 'https://www.orkan.is/english/';
export const ORKAN_MEMBER_DISCOUNT_ISK_PER_LITER = 12;
export const ORKAN_MEMBER_DISCOUNT_ISK_PER_KWH = 12;

export const ORKAN_LOWEST_PRICE_STATIONS: OrkanStation[] = [
  { name: 'Skógarhlíð', slug: 'skogarhlid', region: 'reykjavik', format: 'lowest_price_station' },
  { name: 'Bústaðavegur', slug: 'bustadavegur', region: 'reykjavik', format: 'lowest_price_station' },
  { name: 'Suðurfell', slug: 'sudurfell', region: 'reykjavik', format: 'lowest_price_station' },
  { name: 'Kleppsvegur', slug: 'kleppsvegur', region: 'reykjavik', format: 'lowest_price_station' },
  { name: 'Dalvegur', slug: 'dalvegur', region: 'kopavogur', format: 'lowest_price_station' },
  { name: 'Salavegur', slug: 'salavegur', region: 'kopavogur', format: 'lowest_price_station' },
  { name: 'Reykjavíkurvegur', slug: 'reykjavikurvegur', region: 'hafnarfjordur', format: 'lowest_price_station' },
  { name: 'Einhella', slug: 'einhella', region: 'hafnarfjordur', format: 'lowest_price_station' },
  { name: 'Mýrarvegur', slug: 'myrarvegur', region: 'akureyri', format: 'lowest_price_station' },
  { name: 'Hörgárbraut', slug: 'horgarbraut', region: 'akureyri', format: 'lowest_price_station' },
  { name: 'Furuvellir', slug: 'furuvellir', region: 'akureyri', format: 'lowest_price_station' },
  { name: 'Brúartorg', slug: 'bruartorg', region: 'borgarnes', format: 'lowest_price_station' },
  { name: 'Suðurlandsvegur', slug: 'sudurlandsvegur', region: 'selfoss', format: 'lowest_price_station' }
];

export const ORKAN_LOWEST_PRICE_EV_STATIONS: OrkanStation[] = [
  { name: 'Fitjar', slug: 'fitjar', region: 'southwest_iceland', format: 'lowest_price_ev_station' },
  { name: 'Vesturlandsvegur', slug: 'vesturlandsvegur', region: 'capital_area', format: 'lowest_price_ev_station' }
];

export function parseOrkanLowestPriceStationPage(
  text: string,
  options: { retrievedAt?: string; sourceUrl?: string } = {}
): OrkanPriceRow[] {
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const sourceUrl = options.sourceUrl ?? ORKAN_STATIONS_URL;
  const [petrol95, diesel] = pricesAfterFuelLabels(text);
  const prices: Array<{ product_id: OrkanProductId; product_name: string; unit: OrkanPriceUnit; price: number }> = [];

  if (petrol95 !== null) prices.push({ product_id: 'petrol_95', product_name: '95 octane petrol', unit: 'liter', price: petrol95 });
  if (diesel !== null) prices.push({ product_id: 'diesel', product_name: 'Diesel', unit: 'liter', price: diesel });

  return buildOrkanLowestPriceStationRows(prices, { retrievedAt, sourceUrl });
}

export function buildOrkanLowestPriceStationRows(
  prices: Array<{ product_id: OrkanProductId; product_name: string; unit: OrkanPriceUnit; price: number }>,
  options: { retrievedAt?: string; sourceUrl?: string } = {}
): OrkanPriceRow[] {
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const sourceUrl = options.sourceUrl ?? ORKAN_LOWEST_PRICE_URL;
  return ORKAN_LOWEST_PRICE_STATIONS.flatMap((station) => prices.map((price) => priceRow(station, price, {
    isMemberPrice: false,
    retrievedAt,
    sourceUrl,
    evidence: 'Orkan lowest-price station list and station page fuel price block'
  })));
}

export function buildOrkanEvPriceRows(options: { retrievedAt?: string; sourceUrl?: string } = {}): OrkanPriceRow[] {
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const sourceUrl = options.sourceUrl ?? ORKAN_ENGLISH_URL;
  const standard: OrkanPriceRow = priceRow(
    { name: 'Orkan EV fast charging', slug: 'ev-fast-charging', region: 'iceland', format: 'standard_self_service' },
    { product_id: 'ev_fast_charging', product_name: 'EV fast charging', unit: 'kWh', price: 58 },
    { isMemberPrice: false, retrievedAt, sourceUrl, evidence: 'Orkan English EV pricing block' }
  );
  const standardMember = memberPriceRow(standard, ORKAN_MEMBER_DISCOUNT_ISK_PER_KWH);
  const lowPriceRows = ORKAN_LOWEST_PRICE_EV_STATIONS.map((station) => priceRow(station, {
    product_id: 'ev_fast_charging',
    product_name: 'EV fast charging',
    unit: 'kWh',
    price: 38
  }, {
    isMemberPrice: false,
    retrievedAt,
    sourceUrl,
    evidence: 'Orkan English EV pricing block for Fitjar and Vesturlandsvegur'
  }));

  return [standard, standardMember, ...lowPriceRows];
}

export function applyOrkanMemberDiscountRows(rows: readonly OrkanPriceRow[]): OrkanPriceRow[] {
  const memberRows = rows
    .filter((row) => row.format === 'standard_self_service' && !row.is_member_price)
    .map((row) => memberPriceRow(row, row.unit === 'kWh' ? ORKAN_MEMBER_DISCOUNT_ISK_PER_KWH : ORKAN_MEMBER_DISCOUNT_ISK_PER_LITER));
  return [...rows, ...memberRows];
}

function memberPriceRow(row: OrkanPriceRow, discount: number): OrkanPriceRow {
  return {
    ...row,
    price: Math.max(0, Number((row.price - discount).toFixed(1))),
    is_member_price: true,
    evidence: `${row.evidence}; Orkan card discount ${discount} ISK/${row.unit}`
  };
}

function priceRow(
  station: OrkanStation,
  price: { product_id: OrkanProductId; product_name: string; unit: OrkanPriceUnit; price: number },
  context: { isMemberPrice: boolean; retrievedAt: string; sourceUrl: string; evidence: string }
): OrkanPriceRow {
  return {
    chain: 'orkan',
    country: 'IS',
    store_id: `orkan-is:${station.region}:${station.slug}`,
    station: station.name,
    region: station.region,
    product_id: price.product_id,
    product_name: price.product_name,
    price: price.price,
    currency: 'ISK',
    unit: price.unit,
    channel: 'store',
    format: station.format,
    is_member_price: context.isMemberPrice,
    source_url: context.sourceUrl,
    retrieved_at: context.retrievedAt,
    evidence: context.evidence
  };
}

function pricesAfterFuelLabels(text: string): [number | null, number | null] {
  const compact = text.replace(/\s+/g, ' ');
  const petrolLabel = compact.search(/95\s*okt/i);
  const dieselLabel = compact.search(/d[íi]sel/i);
  const firstFuelLabel = [petrolLabel, dieselLabel].filter((index) => index >= 0).sort((a, b) => a - b)[0];
  if (firstFuelLabel === undefined) return [null, null];

  const values = [...compact.slice(firstFuelLabel).matchAll(/(\d{2,4}[,.]\d)/g)]
    .map((match) => Number(match[1]!.replace(',', '.')))
    .filter((value) => Number.isFinite(value));
  return [values[0] ?? null, values[1] ?? null];
}
