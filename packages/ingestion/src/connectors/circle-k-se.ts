import { createHash } from 'node:crypto';

export const CIRCLE_K_SE_BUSINESS_FUEL_PRICES_URL = 'https://www.circlek.se/foretag/drivmedel/priser';
export const CIRCLE_K_SE_TRUCK_FUEL_PRICES_URL = 'https://www.circlek.se/foretag/fordonspark/truck/priser';
export const CIRCLE_K_SE_CONSUMER_FUEL_PRICES_URL = 'https://www.circlek.se/drivmedel/drivmedelspriser';
export const CIRCLE_K_SE_EXTRA_URL = 'https://www.circlek.se/extra';
export const CIRCLE_K_SE_PARSER_VERSION = 'circle-k-se-business-fuel-prices-v1';
export const CIRCLE_K_SE_QUIRKS_PARSER_VERSION = 'circle-k-se-pricing-quirks-v1';

export type CircleKSeFuelPriceKind = 'business_card' | 'truck_card';
export type CircleKSePricingQuirkKind =
  | 'consumer_local_pump_price'
  | 'extra_new_member_fuel_discount'
  | 'extra_charge_app_discount'
  | 'extra_app_reward_coupon'
  | 'business_fuel_list_price'
  | 'truck_weekly_price';

export type CircleKSeFuelObservation = {
  id: string;
  domain: 'fuel';
  chainId: 'circle-k-se';
  operatorName: 'Circle K Sverige';
  customerSegment: 'business';
  listPriceKind: CircleKSeFuelPriceKind;
  productName: string;
  fuelGrade: '95' | '98' | 'diesel' | 'hvo100' | 'cng' | 'e85' | 'b100' | 'adblue' | 'unknown';
  price: number;
  currency: 'SEK';
  unit: 'l' | 'kg' | 'kWh';
  includesVat: true;
  effectiveFrom: string;
  observedAt: string;
  sourceUrl: string;
  provenance: {
    source: 'circle_k_se_business_fuel_prices';
    parserVersion: string;
    sourceUrl: string;
    contentDigest: string;
    originalProductText: string;
    originalPriceText: string;
    originalUnitText: string;
    originalChangeText?: string;
  };
};

export type CircleKSePricingQuirkRow = {
  id: string;
  domain: 'fuel' | 'ev_charging' | 'store_offer';
  chainId: 'circle-k-se';
  operatorName: 'Circle K Sverige';
  country: 'SE';
  kind: CircleKSePricingQuirkKind;
  channel: 'store' | 'app' | 'b2b';
  customerSegment: 'consumer' | 'business';
  productScope: 'fuel' | 'charging' | 'store_offer' | 'truck_fuel';
  price: number | null;
  currency: 'SEK';
  unit: 'l' | 'kWh' | 'offer' | 'metadata';
  storePriceSource?: 'local_station_price_sign';
  requiresStoreId: boolean;
  is_member_price: boolean;
  membershipProgram?: 'Circle K EXTRA' | 'Circle K Pro';
  is_subscription_price: false;
  is_coupon_price: boolean;
  is_clearance: false;
  multi_buy: null;
  out_of_scope_for_consumer_connector?: boolean;
  observedAt: string;
  sourceUrl: string;
  provenance: {
    source: 'circle_k_se_pricing_quirks';
    parserVersion: string;
    sourceUrl: string;
    contentDigest: string;
    matchedText: string;
  };
};

type CircleKSeSourcePage = {
  sourceUrl: string;
  html: string;
};

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

function contentDigest(html: string): string {
  return createHash('sha256').update(html).digest('hex');
}

function sourceDigest(html: string): string {
  return `sha256:${contentDigest(html)}`;
}

function parseSwedishNumber(value: string): number {
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Invalid Circle K SE fuel price: ${value}`);
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}

function normalizeUnit(unit: string): CircleKSeFuelObservation['unit'] {
  if (unit === 'kr/l') return 'l';
  if (unit === 'kr/kg') return 'kg';
  if (unit === 'kr/kWh') return 'kWh';
  throw new Error(`Unsupported Circle K SE fuel unit: ${unit}`);
}

function slug(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function assertCircleKSeSource(sourceUrl: string) {
  if (new URL(sourceUrl).hostname !== 'www.circlek.se') throw new Error('Circle K SE connector only accepts www.circlek.se source URLs.');
}

function parseOrePerUnit(text: string): number | null {
  const match = text.match(/(\d+)\s*öre/i);
  if (!match) return null;
  return Math.round((Number(match[1]) / 100 + Number.EPSILON) * 100) / 100;
}

function quirkRow(input: {
  id: string;
  kind: CircleKSePricingQuirkKind;
  domain: CircleKSePricingQuirkRow['domain'];
  channel: CircleKSePricingQuirkRow['channel'];
  customerSegment: CircleKSePricingQuirkRow['customerSegment'];
  productScope: CircleKSePricingQuirkRow['productScope'];
  price: number | null;
  unit: CircleKSePricingQuirkRow['unit'];
  requiresStoreId: boolean;
  is_member_price: boolean;
  is_coupon_price: boolean;
  page: CircleKSeSourcePage;
  matchedText: string;
  observedAt: string;
  membershipProgram?: CircleKSePricingQuirkRow['membershipProgram'];
  storePriceSource?: CircleKSePricingQuirkRow['storePriceSource'];
  out_of_scope_for_consumer_connector?: boolean;
}): CircleKSePricingQuirkRow {
  return {
    id: input.id,
    domain: input.domain,
    chainId: 'circle-k-se',
    operatorName: 'Circle K Sverige',
    country: 'SE',
    kind: input.kind,
    channel: input.channel,
    customerSegment: input.customerSegment,
    productScope: input.productScope,
    price: input.price,
    currency: 'SEK',
    unit: input.unit,
    ...(input.storePriceSource ? { storePriceSource: input.storePriceSource } : {}),
    requiresStoreId: input.requiresStoreId,
    is_member_price: input.is_member_price,
    ...(input.membershipProgram ? { membershipProgram: input.membershipProgram } : {}),
    is_subscription_price: false,
    is_coupon_price: input.is_coupon_price,
    is_clearance: false,
    multi_buy: null,
    ...(input.out_of_scope_for_consumer_connector ? { out_of_scope_for_consumer_connector: true } : {}),
    observedAt: input.observedAt,
    sourceUrl: input.page.sourceUrl,
    provenance: {
      source: 'circle_k_se_pricing_quirks',
      parserVersion: CIRCLE_K_SE_QUIRKS_PARSER_VERSION,
      sourceUrl: input.page.sourceUrl,
      contentDigest: sourceDigest(input.page.html),
      matchedText: input.matchedText
    }
  };
}

function gradeFromProduct(productName: string): CircleKSeFuelObservation['fuelGrade'] {
  const normalized = productName.toLowerCase();
  if (/\b95\b/.test(normalized)) return '95';
  if (/\b98\b/.test(normalized)) return '98';
  if (/hvo\s*100|hvo100/.test(normalized)) return 'hvo100';
  if (/diesel/.test(normalized)) return 'diesel';
  if (/fordonsgas|cng/.test(normalized)) return 'cng';
  if (/e85/.test(normalized)) return 'e85';
  if (/b100/.test(normalized)) return 'b100';
  if (/ad\s*blue|adblue/.test(normalized)) return 'adblue';
  return 'unknown';
}

function priceKindForUrl(sourceUrl: string): CircleKSeFuelPriceKind {
  const pathname = new URL(sourceUrl).pathname;
  if (/\/foretag\/fordonspark\/truck\/priser\/?$/i.test(pathname)) return 'truck_card';
  if (/\/foretag\/drivmedel\/(?:drivmedelspriser|priser)\/?$/i.test(pathname)) return 'business_card';
  throw new Error('Circle K SE connector only accepts Circle K Pro business fuel price pages.');
}

export function parseCircleKSeFuelPrices(input: {
  html: string;
  observedAt: string;
  sourceUrl?: string;
  parserVersion?: string;
}): CircleKSeFuelObservation[] {
  const sourceUrl = input.sourceUrl ?? CIRCLE_K_SE_BUSINESS_FUEL_PRICES_URL;
  const listPriceKind = priceKindForUrl(sourceUrl);
  const text = decodeHtmlText(input.html);
  if (/captcha|access denied|cloudflare|logga in/i.test(text)) throw new Error('Circle K SE fuel price source returned a blocked/login page.');
  if (!/Aktuella (?:listpriser företagskund|priser truck)/i.test(text)) throw new Error('Circle K SE fuel price heading missing.');

  const digest = contentDigest(input.html);
  const rows: CircleKSeFuelObservation[] = [];
  const rowPattern = /Produktnamn:\s*(.+?)\s+Pris:\s*([0-9][0-9\s]*(?:[,.][0-9]{1,2})?)\s+Ändringsdatum:\s*(\d{4}-\d{2}-\d{2})\s+Enhet:\s*(kr\/(?:l|kg|kWh))(?:\s+Ändring:\s*([+-]?[0-9][0-9\s]*(?:[,.][0-9]{1,2})?))?/gi;
  for (const match of text.matchAll(rowPattern)) {
    const originalProductText = match[1]!.trim();
    const productName = originalProductText.replace(/\*+$/g, '').trim();
    const originalPriceText = match[2]!.trim();
    const effectiveFrom = match[3]!;
    const originalUnitText = match[4]!.trim();
    const originalChangeText = match[5]?.trim();
    rows.push({
      id: `circle-k-se-${listPriceKind}-${slug(productName)}-${effectiveFrom}`,
      domain: 'fuel',
      chainId: 'circle-k-se',
      operatorName: 'Circle K Sverige',
      customerSegment: 'business',
      listPriceKind,
      productName,
      fuelGrade: gradeFromProduct(productName),
      price: parseSwedishNumber(originalPriceText),
      currency: 'SEK',
      unit: normalizeUnit(originalUnitText),
      includesVat: true,
      effectiveFrom,
      observedAt: input.observedAt,
      sourceUrl,
      provenance: {
        source: 'circle_k_se_business_fuel_prices',
        parserVersion: input.parserVersion ?? CIRCLE_K_SE_PARSER_VERSION,
        sourceUrl,
        contentDigest: digest,
        originalProductText,
        originalPriceText,
        originalUnitText,
        ...(originalChangeText ? { originalChangeText } : {})
      }
    });
  }
  if (rows.length === 0) throw new Error('No Circle K SE fuel prices parsed.');
  return rows;
}

export function parseCircleKSePricingQuirks(input: {
  pages: CircleKSeSourcePage[];
  observedAt: string;
}): CircleKSePricingQuirkRow[] {
  const rows: CircleKSePricingQuirkRow[] = [];
  const seen = new Set<CircleKSePricingQuirkKind>();

  for (const page of input.pages) {
    assertCircleKSeSource(page.sourceUrl);
    const text = decodeHtmlText(page.html);
    if (/captcha|access denied|cloudflare|logga in/i.test(text)) throw new Error('Circle K SE source returned a blocked/login page.');

    const localPumpText = text.match(/Aktuellt pris kan ni se på er lokala stations prisstolpe\.[^.]*|priser varierar från dag till dag och från station till station\./i);
    if (localPumpText && !seen.has('consumer_local_pump_price')) {
      seen.add('consumer_local_pump_price');
      rows.push(quirkRow({
        id: 'circle-k-se-consumer-local-pump-price',
        kind: 'consumer_local_pump_price',
        domain: 'fuel',
        channel: 'store',
        customerSegment: 'consumer',
        productScope: 'fuel',
        price: null,
        unit: 'metadata',
        requiresStoreId: true,
        is_member_price: false,
        is_coupon_price: false,
        storePriceSource: 'local_station_price_sign',
        page,
        matchedText: localPumpText[0],
        observedAt: input.observedAt
      }));
    }

    const newMemberFuelText = text.match(/50\s*öre rabatt\/liter på de 3 första tankningarna[^.]*\./i);
    const newMemberFuelPrice = newMemberFuelText ? parseOrePerUnit(newMemberFuelText[0]) : null;
    if (newMemberFuelText && newMemberFuelPrice !== null && !seen.has('extra_new_member_fuel_discount')) {
      seen.add('extra_new_member_fuel_discount');
      rows.push(quirkRow({
        id: 'circle-k-se-extra-new-member-fuel-discount',
        kind: 'extra_new_member_fuel_discount',
        domain: 'fuel',
        channel: 'store',
        customerSegment: 'consumer',
        productScope: 'fuel',
        price: newMemberFuelPrice,
        unit: 'l',
        requiresStoreId: true,
        is_member_price: true,
        is_coupon_price: false,
        membershipProgram: 'Circle K EXTRA',
        page,
        matchedText: newMemberFuelText[0],
        observedAt: input.observedAt
      }));
    }

    const chargeAppText = text.match(/50\s*öre per kWh[^.]*Circle K Charge-app[^.]*\./i);
    const chargeAppPrice = chargeAppText ? parseOrePerUnit(chargeAppText[0]) : null;
    if (chargeAppText && chargeAppPrice !== null && !seen.has('extra_charge_app_discount')) {
      seen.add('extra_charge_app_discount');
      rows.push(quirkRow({
        id: 'circle-k-se-extra-charge-app-discount',
        kind: 'extra_charge_app_discount',
        domain: 'ev_charging',
        channel: 'app',
        customerSegment: 'consumer',
        productScope: 'charging',
        price: chargeAppPrice,
        unit: 'kWh',
        requiresStoreId: false,
        is_member_price: true,
        is_coupon_price: true,
        membershipProgram: 'Circle K EXTRA',
        page,
        matchedText: chargeAppText[0],
        observedAt: input.observedAt
      }));
    }

    const appRewardText = text.match(/Efter var femte besök får du välja en belöning direkt i Circle K-appen\.[^.]*\./i);
    if (appRewardText && !seen.has('extra_app_reward_coupon')) {
      seen.add('extra_app_reward_coupon');
      rows.push(quirkRow({
        id: 'circle-k-se-extra-app-reward-coupon',
        kind: 'extra_app_reward_coupon',
        domain: 'store_offer',
        channel: 'app',
        customerSegment: 'consumer',
        productScope: 'store_offer',
        price: null,
        unit: 'offer',
        requiresStoreId: false,
        is_member_price: true,
        is_coupon_price: true,
        membershipProgram: 'Circle K EXTRA',
        page,
        matchedText: appRewardText[0],
        observedAt: input.observedAt
      }));
    }

    const businessListText = text.match(/Som Circle K Pro-kund tankar du till vårt aktuella listpris minus rabatt[^.]*\./i);
    if (businessListText && !seen.has('business_fuel_list_price')) {
      seen.add('business_fuel_list_price');
      rows.push(quirkRow({
        id: 'circle-k-se-business-fuel-list-price',
        kind: 'business_fuel_list_price',
        domain: 'fuel',
        channel: 'b2b',
        customerSegment: 'business',
        productScope: 'fuel',
        price: null,
        unit: 'metadata',
        requiresStoreId: false,
        is_member_price: false,
        is_coupon_price: false,
        membershipProgram: 'Circle K Pro',
        out_of_scope_for_consumer_connector: true,
        page,
        matchedText: businessListText[0],
        observedAt: input.observedAt
      }));
    }

    const truckWeeklyText = text.match(/Ovanstående priser är veckopriser och gäller måndag - söndag\.[^.]*\./i);
    if (truckWeeklyText && !seen.has('truck_weekly_price')) {
      seen.add('truck_weekly_price');
      rows.push(quirkRow({
        id: 'circle-k-se-truck-weekly-price',
        kind: 'truck_weekly_price',
        domain: 'fuel',
        channel: 'b2b',
        customerSegment: 'business',
        productScope: 'truck_fuel',
        price: null,
        unit: 'metadata',
        requiresStoreId: false,
        is_member_price: false,
        is_coupon_price: false,
        membershipProgram: 'Circle K Pro',
        out_of_scope_for_consumer_connector: true,
        page,
        matchedText: truckWeeklyText[0],
        observedAt: input.observedAt
      }));
    }
  }

  return rows;
}

export async function fetchCircleKSeFuelPrices(options: {
  fetchImpl?: typeof fetch;
  observedAt?: string;
  sourceUrls?: string[];
} = {}): Promise<CircleKSeFuelObservation[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const observedAt = options.observedAt ?? new Date().toISOString();
  const sourceUrls = options.sourceUrls ?? [CIRCLE_K_SE_BUSINESS_FUEL_PRICES_URL, CIRCLE_K_SE_TRUCK_FUEL_PRICES_URL];
  const rows: CircleKSeFuelObservation[] = [];
  for (const sourceUrl of sourceUrls) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 circle-k-se-fuel-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
      throw new Error(`Circle K SE fuel price source blocked with HTTP ${response.status}.`);
    }
    if (!response.ok) throw new Error(`Circle K SE fuel price source failed with HTTP ${response.status}.`);
    rows.push(...parseCircleKSeFuelPrices({ html: await response.text(), observedAt, sourceUrl }));
  }
  return rows;
}

export async function fetchCircleKSePricingQuirks(options: {
  fetchImpl?: typeof fetch;
  observedAt?: string;
  sourceUrls?: string[];
} = {}): Promise<CircleKSePricingQuirkRow[]> {
  const sourceUrls = options.sourceUrls ?? [
    CIRCLE_K_SE_CONSUMER_FUEL_PRICES_URL,
    CIRCLE_K_SE_EXTRA_URL,
    CIRCLE_K_SE_BUSINESS_FUEL_PRICES_URL,
    CIRCLE_K_SE_TRUCK_FUEL_PRICES_URL
  ];
  const fetchImpl = options.fetchImpl ?? fetch;
  const pages: CircleKSeSourcePage[] = [];

  for (const sourceUrl of sourceUrls) {
    assertCircleKSeSource(sourceUrl);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 circle-k-se-pricing-quirks-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
      throw new Error(`Circle K SE pricing quirk source blocked with HTTP ${response.status}.`);
    }
    if (!response.ok) throw new Error(`Circle K SE pricing quirk source failed with HTTP ${response.status}.`);
    pages.push({ sourceUrl, html: await response.text() });
  }

  return parseCircleKSePricingQuirks({ pages, observedAt: options.observedAt ?? new Date().toISOString() });
}
