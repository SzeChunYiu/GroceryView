import { createHash } from 'node:crypto';

export type OrkanIsFuelPriceObservation = {
  domain: 'fuel';
  productId: 'fuel-95-e10' | 'fuel-diesel';
  gradeLabel: string;
  pricePerLitre: number;
  unit: 'l';
  currency: 'ISK';
  chainId: 'orkan-is';
  operatorName: 'Orkan';
  sourceUrl: string;
  observedAt: string;
  channel: 'self_service_pump';
  format: 'lowest_price_station';
  store_id: 'orkan-is-lowest-price-network';
  region: 'lowest_price_network';
  is_member_price: false;
  provenance: {
    source: 'orkan_is_home_lowest_price';
    parserVersion: typeof ORKAN_IS_PARSER_VERSION;
    contentDigest: string;
    originalPriceText: string;
    lowestPriceLocations: string[];
  };
};

export type OrkanIsMemberDiscountObservation = {
  domain: 'fuel';
  productId: 'fuel-95-e10-or-diesel';
  discountPerLitre: number;
  unit: 'l';
  currency: 'ISK';
  chainId: 'orkan-is';
  operatorName: 'Orkan';
  sourceUrl: string;
  observedAt: string;
  channel: 'self_service_pump';
  is_member_price: true;
  memberProgram: 'Orkan card';
  requirements: 'Apply for Orkan card to Apple/Google wallet';
  excludedLocations: string[];
  provenance: {
    source: 'orkan_is_card_terms';
    parserVersion: typeof ORKAN_IS_PARSER_VERSION;
    contentDigest: string;
    originalDiscountText: string;
  };
};

export type OrkanIsEvPriceObservation = {
  domain: 'ev_charging';
  productId: 'ev-dc-fast-kwh';
  pricePerKwh: number;
  idlePricePerMinute: number;
  idleAppliesAfterMinutes: 60;
  unit: 'kWh';
  currency: 'ISK';
  chainId: 'orkan-is';
  operatorName: 'Orkan';
  sourceUrl: string;
  observedAt: string;
  channel: 'ev_charger';
  is_member_price: boolean;
  memberProgram?: 'Orkan card';
  excludedLocations?: string[];
  provenance: {
    source: 'orkan_is_english_ev_pricing';
    parserVersion: typeof ORKAN_IS_PARSER_VERSION;
    contentDigest: string;
    originalPriceText: string;
    originalDiscountText?: string;
  };
};

export type OrkanIsPricingObservation =
  | OrkanIsFuelPriceObservation
  | OrkanIsMemberDiscountObservation
  | OrkanIsEvPriceObservation;

export const ORKAN_IS_HOME_URL = 'https://www.orkan.is/';
export const ORKAN_IS_ENGLISH_URL = 'https://www.orkan.is/english/';
export const ORKAN_IS_CARD_URL = 'https://www.orkan.is/english/apply-for-orkan-discount-card/';
export const ORKAN_IS_PARSER_VERSION = 'orkan-is-pricing-v1';

function contentHashFor(body: string) {
  return `sha256:${createHash('sha256').update(body).digest('hex')}`;
}

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parsePrice(value: string | undefined) {
  if (!value) return undefined;
  const match = value.match(/(\d+(?:[,.]\d+)?)/);
  return match ? Number(match[1]!.replace(',', '.')) : undefined;
}

function parseLocations(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map((location) => location.trim())
    .filter(Boolean);
}

export function parseOrkanIsHomeLowestFuelPrices(input: {
  body: string;
  capturedAt: string;
  sourceUrl?: string;
}): OrkanIsFuelPriceObservation[] {
  const sourceUrl = input.sourceUrl ?? ORKAN_IS_HOME_URL;
  if (!sourceUrl.includes('orkan.is')) throw new Error('Orkan IS connector only accepts orkan.is source URLs');
  if (/access denied|captcha|innskráning/i.test(input.body)) throw new Error('Orkan IS home source blocked/login page');
  const text = htmlToText(input.body);
  const locationText = text.match(/Við bjóðum okkar lægsta verð á eftirfarandi staðsetningum\s+(.+?)\s+95 okt:/i)?.[1];
  const locations = parseLocations(locationText);
  const petrol = parsePrice(text.match(/95 okt:\s+Dísel:\s+(\d+(?:[,.]\d+)?)/i)?.[1] ?? text.match(/95 okt:\s+(\d+(?:[,.]\d+)?)/i)?.[1]);
  const diesel = parsePrice(text.match(/95 okt:\s+Dísel:\s+\d+(?:[,.]\d+)?\s+(\d+(?:[,.]\d+)?)/i)?.[1] ?? text.match(/Dísel:\s+(\d+(?:[,.]\d+)?)/i)?.[1]);
  const digest = contentHashFor(input.body);

  return [
    petrol === undefined
      ? undefined
      : fuelRow({
          productId: 'fuel-95-e10',
          gradeLabel: 'Orkan 95 okt',
          price: petrol,
          originalPriceText: String(petrol),
          locations,
          sourceUrl,
          capturedAt: input.capturedAt,
          digest
        }),
    diesel === undefined
      ? undefined
      : fuelRow({
          productId: 'fuel-diesel',
          gradeLabel: 'Orkan Dísel',
          price: diesel,
          originalPriceText: String(diesel),
          locations,
          sourceUrl,
          capturedAt: input.capturedAt,
          digest
        })
  ].filter((row): row is OrkanIsFuelPriceObservation => row !== undefined);
}

function fuelRow(input: {
  productId: OrkanIsFuelPriceObservation['productId'];
  gradeLabel: string;
  price: number;
  originalPriceText: string;
  locations: string[];
  sourceUrl: string;
  capturedAt: string;
  digest: string;
}): OrkanIsFuelPriceObservation {
  return {
    domain: 'fuel',
    productId: input.productId,
    gradeLabel: input.gradeLabel,
    pricePerLitre: input.price,
    unit: 'l',
    currency: 'ISK',
    chainId: 'orkan-is',
    operatorName: 'Orkan',
    sourceUrl: input.sourceUrl,
    observedAt: input.capturedAt,
    channel: 'self_service_pump',
    format: 'lowest_price_station',
    store_id: 'orkan-is-lowest-price-network',
    region: 'lowest_price_network',
    is_member_price: false,
    provenance: {
      source: 'orkan_is_home_lowest_price',
      parserVersion: ORKAN_IS_PARSER_VERSION,
      contentDigest: input.digest,
      originalPriceText: input.originalPriceText,
      lowestPriceLocations: input.locations
    }
  };
}

export function parseOrkanIsCardTerms(input: {
  body: string;
  capturedAt: string;
  sourceUrl?: string;
}): OrkanIsMemberDiscountObservation[] {
  const sourceUrl = input.sourceUrl ?? ORKAN_IS_CARD_URL;
  if (!sourceUrl.includes('orkan.is')) throw new Error('Orkan IS connector only accepts orkan.is source URLs');
  const text = htmlToText(input.body);
  const discountText = text.match(/With Orkan card you get\s+(\d+)\s*kr\.?\s+discount per liter/i)?.[0];
  const discount = parsePrice(discountText);
  const excludedText = text.match(/Discount is available at all stations except\s+(.+?)\s+where we offer our lowest possible price/i)?.[1];
  if (discount === undefined || !excludedText) return [];

  return [
    {
      domain: 'fuel',
      productId: 'fuel-95-e10-or-diesel',
      discountPerLitre: discount,
      unit: 'l',
      currency: 'ISK',
      chainId: 'orkan-is',
      operatorName: 'Orkan',
      sourceUrl,
      observedAt: input.capturedAt,
      channel: 'self_service_pump',
      is_member_price: true,
      memberProgram: 'Orkan card',
      requirements: 'Apply for Orkan card to Apple/Google wallet',
      excludedLocations: parseLocations(excludedText.replace(/\s+og\s+/i, ', ')),
      provenance: {
        source: 'orkan_is_card_terms',
        parserVersion: ORKAN_IS_PARSER_VERSION,
        contentDigest: contentHashFor(input.body),
        originalDiscountText: discountText ?? `${discount} kr discount per liter`
      }
    }
  ];
}

export function parseOrkanIsEvPricing(input: {
  body: string;
  capturedAt: string;
  sourceUrl?: string;
}): OrkanIsEvPriceObservation[] {
  const sourceUrl = input.sourceUrl ?? ORKAN_IS_ENGLISH_URL;
  if (!sourceUrl.includes('orkan.is')) throw new Error('Orkan IS connector only accepts orkan.is source URLs');
  const text = htmlToText(input.body);
  const ordinaryText = text.match(/(\d+)\s*kr\/kWh\*\s+at all stations except\s+(.+?)\s+(\d+)\s*kr\/min after 60min charging/i);
  const lowText = text.match(/(\d+)\s*kr\/kWh at Fitjar and Vesturlandsvegur\s+(\d+)\s*kr\/min after 60min charging/i);
  const memberDiscount = parsePrice(text.match(/(\d+)\s*kr\.?\s+discount per kW/i)?.[1]);
  const digest = contentHashFor(input.body);
  const rows: OrkanIsEvPriceObservation[] = [];

  if (ordinaryText) {
    const ordinaryPrice = Number(ordinaryText[1]);
    const idlePrice = Number(ordinaryText[3]);
    const excludedLocations = parseLocations(ordinaryText[2]?.replace(/\s+and\s+/i, ', '));
    rows.push(evRow({ price: ordinaryPrice, idlePrice, sourceUrl, capturedAt: input.capturedAt, digest, originalPriceText: ordinaryText[0] }));
    if (memberDiscount !== undefined) {
      rows.push(
        evRow({
          price: ordinaryPrice - memberDiscount,
          idlePrice,
          sourceUrl,
          capturedAt: input.capturedAt,
          digest,
          originalPriceText: ordinaryText[0],
          originalDiscountText: `${memberDiscount} kr discount per kW`,
          memberProgram: 'Orkan card',
          excludedLocations
        })
      );
    }
  }

  if (lowText) {
    rows.push(
      evRow({
        price: Number(lowText[1]),
        idlePrice: Number(lowText[2]),
        sourceUrl,
        capturedAt: input.capturedAt,
        digest,
        originalPriceText: lowText[0]
      })
    );
  }

  return rows;
}

function evRow(input: {
  price: number;
  idlePrice: number;
  sourceUrl: string;
  capturedAt: string;
  digest: string;
  originalPriceText: string;
  originalDiscountText?: string;
  memberProgram?: 'Orkan card';
  excludedLocations?: string[];
}): OrkanIsEvPriceObservation {
  return {
    domain: 'ev_charging',
    productId: 'ev-dc-fast-kwh',
    pricePerKwh: input.price,
    idlePricePerMinute: input.idlePrice,
    idleAppliesAfterMinutes: 60,
    unit: 'kWh',
    currency: 'ISK',
    chainId: 'orkan-is',
    operatorName: 'Orkan',
    sourceUrl: input.sourceUrl,
    observedAt: input.capturedAt,
    channel: 'ev_charger',
    is_member_price: input.memberProgram !== undefined,
    ...(input.memberProgram ? { memberProgram: input.memberProgram } : {}),
    ...(input.excludedLocations ? { excludedLocations: input.excludedLocations } : {}),
    provenance: {
      source: 'orkan_is_english_ev_pricing',
      parserVersion: ORKAN_IS_PARSER_VERSION,
      contentDigest: input.digest,
      originalPriceText: input.originalPriceText,
      ...(input.originalDiscountText ? { originalDiscountText: input.originalDiscountText } : {})
    }
  };
}

export async function fetchOrkanIsPricing(options: {
  fetchImpl?: typeof fetch;
  capturedAt?: string;
  homeUrl?: string;
  englishUrl?: string;
  cardUrl?: string;
} = {}): Promise<OrkanIsPricingObservation[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const headers = {
    accept: 'text/html,application/xhtml+xml',
    'user-agent': 'GroceryView/0.1 orkan-is-connector (fixture-friendly)'
  };
  const [homeResponse, englishResponse, cardResponse] = await Promise.all([
    fetchImpl(options.homeUrl ?? ORKAN_IS_HOME_URL, { headers }),
    fetchImpl(options.englishUrl ?? ORKAN_IS_ENGLISH_URL, { headers }),
    fetchImpl(options.cardUrl ?? ORKAN_IS_CARD_URL, { headers })
  ]);
  if (!homeResponse.ok) throw new Error(`Orkan IS home source blocked with HTTP ${homeResponse.status}`);
  if (!englishResponse.ok) throw new Error(`Orkan IS English source blocked with HTTP ${englishResponse.status}`);
  if (!cardResponse.ok) throw new Error(`Orkan IS card source blocked with HTTP ${cardResponse.status}`);

  return [
    ...parseOrkanIsHomeLowestFuelPrices({
      body: await homeResponse.text(),
      capturedAt,
      sourceUrl: options.homeUrl ?? ORKAN_IS_HOME_URL
    }),
    ...parseOrkanIsEvPricing({
      body: await englishResponse.text(),
      capturedAt,
      sourceUrl: options.englishUrl ?? ORKAN_IS_ENGLISH_URL
    }),
    ...parseOrkanIsCardTerms({
      body: await cardResponse.text(),
      capturedAt,
      sourceUrl: options.cardUrl ?? ORKAN_IS_CARD_URL
    })
  ];
}
