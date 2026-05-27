import { createHash } from 'node:crypto';

export const CIRCLE_K_NO_FUEL_PRICES_URL = 'https://www.circlek.no/bedrift/produkter/drivstoff/priser';
export const CIRCLE_K_NO_FOOD_URL = 'https://www.circlek.no/mat';
export const CIRCLE_K_NO_DRINK_URL = 'https://www.circlek.no/drikke';
export const CIRCLE_K_NO_PARSER_VERSION = 'circle-k-no-fuel-convenience-v1';

export type CircleKNoConnectorRow = {
  id: string;
  chain: 'circle-k-no';
  country: 'NO';
  currency: 'NOK';
  domain: 'fuel' | 'convenience';
  category: 'business_fuel_prices' | 'truck_fuel_prices' | 'food' | 'drink';
  product: string;
  price: number | null;
  unit: 'l' | 'kg' | 'kWh' | 'metadata';
  customerSegment: 'business' | 'consumer';
  channel: 'portal' | 'station';
  requiresLogin: boolean;
  sourceUrl: string;
  retrievedAt: string;
  provenance: {
    parserVersion: string;
    evidenceText: string;
    contentDigest: string;
  };
};

export type FetchCircleKNoRowsOptions = {
  fetchImpl?: typeof fetch;
  retrievedAt?: string;
  sourceUrls?: {
    fuelPrices?: string;
    food?: string;
    drink?: string;
  };
};

export async function fetchCircleKNoRows(options: FetchCircleKNoRowsOptions = {}): Promise<CircleKNoConnectorRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const urls = {
    fuelPrices: options.sourceUrls?.fuelPrices ?? CIRCLE_K_NO_FUEL_PRICES_URL,
    food: options.sourceUrls?.food ?? CIRCLE_K_NO_FOOD_URL,
    drink: options.sourceUrls?.drink ?? CIRCLE_K_NO_DRINK_URL
  };
  const [fuelHtml, foodHtml, drinkHtml] = await Promise.all([
    fetchHtml(fetchImpl, urls.fuelPrices, 'fuel price'),
    fetchHtml(fetchImpl, urls.food, 'food'),
    fetchHtml(fetchImpl, urls.drink, 'drink')
  ]);
  return parseCircleKNoRows({
    fuelPricesHtml: fuelHtml,
    foodHtml,
    drinkHtml,
    retrievedAt,
    sourceUrls: urls
  });
}

export function parseCircleKNoRows(input: {
  fuelPricesHtml: string;
  foodHtml: string;
  drinkHtml: string;
  retrievedAt: string;
  sourceUrls?: {
    fuelPrices?: string;
    food?: string;
    drink?: string;
  };
}): CircleKNoConnectorRow[] {
  const sourceUrls = {
    fuelPrices: input.sourceUrls?.fuelPrices ?? CIRCLE_K_NO_FUEL_PRICES_URL,
    food: input.sourceUrls?.food ?? CIRCLE_K_NO_FOOD_URL,
    drink: input.sourceUrls?.drink ?? CIRCLE_K_NO_DRINK_URL
  };
  const fuelText = textFromHtml(input.fuelPricesHtml);
  const foodText = textFromHtml(input.foodHtml);
  const drinkText = textFromHtml(input.drinkHtml);
  // NB: do NOT treat a bare "logg inn" as a blocked page — the legitimate business fuel
  // portal page invites customers to "Logg inn i/via vår kundeportal" for list prices. Only
  // flag genuine bot/login WALLS (captcha/cloudflare/access denied, or an explicit
  // "logg inn for å fortsette/se" gate) so the valid portal copy isn't rejected.
  if (/captcha|access denied|cloudflare|logg inn for (?:å|a) (?:fortsette|se|få tilgang)/i.test(`${fuelText} ${foodText} ${drinkText}`)) {
    throw new Error('Circle K NO source returned a blocked/login page.');
  }

  const fuelEvidence = requireEvidence(fuelText, /Logg inn i kundeportalen[^.]*dagens priser|oppdaterte listepriser|Drivstoffpriser - Tungbil/i, 'business fuel price portal');
  const stationNetworkEvidence = requireEvidence(fuelText, /Norges beste stasjonsnett|laveste tilgjengelige priser på bensin og diesel/i, 'Norway fuel station network');
  const foodEvidence = requireEvidence(foodText, /Vår meny|pølser|burgere|sandwich|salater|pizza/i, 'station food menu');
  const drinkEvidence = requireEvidence(drinkText, /Drikke|Koppen|kaffe|smoothies|juicer|energidrikk/i, 'station drink assortment');

  return [
    metadataRow({
      id: 'circle-k-no-business-fuel-prices',
      domain: 'fuel',
      category: 'business_fuel_prices',
      product: 'Circle K Norway business fuel list prices',
      customerSegment: 'business',
      channel: 'portal',
      requiresLogin: true,
      sourceUrl: sourceUrls.fuelPrices,
      retrievedAt: input.retrievedAt,
      html: input.fuelPricesHtml,
      evidenceText: fuelEvidence
    }),
    metadataRow({
      id: 'circle-k-no-truck-fuel-prices',
      domain: 'fuel',
      category: 'truck_fuel_prices',
      product: 'Circle K Norway heavy-truck fuel prices',
      customerSegment: 'business',
      channel: 'portal',
      requiresLogin: true,
      sourceUrl: sourceUrls.fuelPrices,
      retrievedAt: input.retrievedAt,
      html: input.fuelPricesHtml,
      evidenceText: stationNetworkEvidence
    }),
    metadataRow({
      id: 'circle-k-no-station-food',
      domain: 'convenience',
      category: 'food',
      product: 'Circle K Norway station food assortment',
      customerSegment: 'consumer',
      channel: 'station',
      requiresLogin: false,
      sourceUrl: sourceUrls.food,
      retrievedAt: input.retrievedAt,
      html: input.foodHtml,
      evidenceText: foodEvidence
    }),
    metadataRow({
      id: 'circle-k-no-station-drink',
      domain: 'convenience',
      category: 'drink',
      product: 'Circle K Norway station drink assortment',
      customerSegment: 'consumer',
      channel: 'station',
      requiresLogin: false,
      sourceUrl: sourceUrls.drink,
      retrievedAt: input.retrievedAt,
      html: input.drinkHtml,
      evidenceText: drinkEvidence
    })
  ];
}

async function fetchHtml(fetchImpl: typeof fetch, sourceUrl: string, label: string): Promise<string> {
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 circle-k-no-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Circle K NO ${label} source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Circle K NO ${label} source failed with HTTP ${response.status}.`);
  return response.text();
}

function metadataRow(input: {
  id: string;
  domain: CircleKNoConnectorRow['domain'];
  category: CircleKNoConnectorRow['category'];
  product: string;
  customerSegment: CircleKNoConnectorRow['customerSegment'];
  channel: CircleKNoConnectorRow['channel'];
  requiresLogin: boolean;
  sourceUrl: string;
  retrievedAt: string;
  html: string;
  evidenceText: string;
}): CircleKNoConnectorRow {
  return {
    id: input.id,
    chain: 'circle-k-no',
    country: 'NO',
    currency: 'NOK',
    domain: input.domain,
    category: input.category,
    product: input.product,
    price: null,
    unit: 'metadata',
    customerSegment: input.customerSegment,
    channel: input.channel,
    requiresLogin: input.requiresLogin,
    sourceUrl: input.sourceUrl,
    retrievedAt: input.retrievedAt,
    provenance: {
      parserVersion: CIRCLE_K_NO_PARSER_VERSION,
      evidenceText: input.evidenceText,
      contentDigest: createHash('sha256').update(input.html).digest('hex')
    }
  };
}

function requireEvidence(text: string, pattern: RegExp, label: string): string {
  const match = text.match(pattern);
  if (!match) throw new Error(`Circle K NO source missing evidence for ${label}.`);
  return match[0];
}

function textFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}
