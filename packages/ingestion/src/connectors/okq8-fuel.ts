import { createHash } from 'node:crypto';

export type FuelGradeId = 'fuel-95-e10' | 'fuel-98' | 'fuel-diesel' | 'fuel-hvo100' | 'fuel-e85';

export type FuelPriceSourceKind = 'operator_public_price_page' | 'crowd_station_report';

export type FuelPriceObservation = {
  domain: 'fuel';
  productId: FuelGradeId;
  fuelGrade: '95' | '98' | 'diesel' | 'hvo100' | 'e85';
  gradeLabel: string;
  chainId: 'okq8';
  operatorName: 'OKQ8';
  country: 'SE';
  channel: 'b2b';
  customerSegment: 'business';
  store_id: 'se:national-okq8-business-fuel';
  region: 'se-national';
  format: 'okq8_station';
  sourceKind: FuelPriceSourceKind;
  sourceUrl: string;
  observedAt: string;
  capturedAt: string;
  effectiveFrom: string;
  pricePerLitre: number;
  currency: 'SEK';
  unit: 'l';
  confidence: number;
  is_member_price: false;
  is_subscription_price: false;
  is_coupon_price: false;
  is_clearance: false;
  multi_buy: null;
  regional_price_policy: 'same_business_price_nationally_except_adblue_gas_alkylate';
  out_of_scope_for_consumer_connector: true;
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
export const OKQ8_MONTHLY_OFFERS_URL = 'https://www.okq8.se/pa-stationen/manadens-erbjudande/';
export const OKQ8_MEMBERSHIP_URL = 'https://www.okq8.se/medlem/';
export const OKQ8_MEMBER_BENEFITS_URL = 'https://kundservice.privat.okq8.se/OK_Medlemskap/Bli_medlem/Medlemsf%C3%B6rm%C3%A5ner';
export const OKQ8_PRICING_QUIRKS_PARSER_VERSION = 'okq8-pricing-quirks-v1';

export type Okq8PricingQuirkRow = {
  id: string;
  chainId: 'okq8';
  operatorName: 'OKQ8';
  country: 'SE';
  productScope: 'station_goods' | 'fuel' | 'car_wash' | 'b2b_fuel';
  channel: 'store' | 'app' | 'b2b';
  customerSegment: 'consumer' | 'business';
  format: 'okq8_station';
  store_id: 'se:national-okq8-station-offers' | 'se:national-okq8-business-fuel';
  region: 'se-national';
  price: number | null;
  currency: 'SEK';
  unit: 'offer' | 'l' | 'metadata';
  is_member_price: boolean;
  membershipProgram?: 'OK';
  is_subscription_price: false;
  is_coupon_price: boolean;
  is_clearance: false;
  multi_buy: string | null;
  discountPercent?: number;
  out_of_scope_for_consumer_connector?: boolean;
  sourceUrl: string;
  observedAt: string;
  provenance: {
    source: 'okq8_pricing_quirks';
    parserVersion: string;
    sourceUrl: string;
    contentDigest: string;
    evidenceText: string;
  };
};

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

function contentDigest(body: string): string {
  return `sha256:${createHash('sha256').update(body).digest('hex')}`;
}

function decodeHtmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&ouml;/g, 'ö')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&auml;/g, 'ä')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&aring;/g, 'å')
    .replace(/&Aring;/g, 'Å')
    .replace(/\s+/g, ' ')
    .trim();
}

function assertOkq8Source(sourceUrl: string) {
  const hostname = new URL(sourceUrl).hostname;
  if (hostname !== 'okq8.se' && hostname !== 'www.okq8.se' && hostname !== 'kundservice.privat.okq8.se') {
    throw new Error('OKQ8 connector only accepts OKQ8 source URLs.');
  }
}

function quirkRow(input: {
  id: string;
  productScope: Okq8PricingQuirkRow['productScope'];
  channel: Okq8PricingQuirkRow['channel'];
  customerSegment: Okq8PricingQuirkRow['customerSegment'];
  price?: number | null;
  unit: Okq8PricingQuirkRow['unit'];
  is_member_price?: boolean;
  membershipProgram?: Okq8PricingQuirkRow['membershipProgram'];
  is_coupon_price?: boolean;
  multi_buy?: string | null;
  discountPercent?: number;
  out_of_scope_for_consumer_connector?: boolean;
  sourceUrl: string;
  observedAt: string;
  html: string;
  evidenceText: string;
}): Okq8PricingQuirkRow {
  const row: Okq8PricingQuirkRow = {
    id: input.id,
    chainId: 'okq8',
    operatorName: 'OKQ8',
    country: 'SE',
    productScope: input.productScope,
    channel: input.channel,
    customerSegment: input.customerSegment,
    format: 'okq8_station',
    store_id: input.customerSegment === 'business' ? 'se:national-okq8-business-fuel' : 'se:national-okq8-station-offers',
    region: 'se-national',
    price: input.price ?? null,
    currency: 'SEK',
    unit: input.unit,
    is_member_price: input.is_member_price ?? false,
    is_subscription_price: false,
    is_coupon_price: input.is_coupon_price ?? false,
    is_clearance: false,
    multi_buy: input.multi_buy ?? null,
    sourceUrl: input.sourceUrl,
    observedAt: input.observedAt,
    provenance: {
      source: 'okq8_pricing_quirks',
      parserVersion: OKQ8_PRICING_QUIRKS_PARSER_VERSION,
      sourceUrl: input.sourceUrl,
      contentDigest: contentDigest(input.html),
      evidenceText: input.evidenceText
    }
  };
  if (input.membershipProgram) row.membershipProgram = input.membershipProgram;
  if (input.discountPercent !== undefined) row.discountPercent = input.discountPercent;
  if (input.out_of_scope_for_consumer_connector !== undefined) {
    row.out_of_scope_for_consumer_connector = input.out_of_scope_for_consumer_connector;
  }
  return row;
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
      country: 'SE',
      channel: 'b2b',
      customerSegment: 'business',
      store_id: 'se:national-okq8-business-fuel',
      region: 'se-national',
      format: 'okq8_station',
      sourceKind: 'operator_public_price_page',
      sourceUrl,
      observedAt: isoDateAtStartOfDay(effectiveFrom),
      capturedAt: input.capturedAt,
      effectiveFrom,
      pricePerLitre,
      currency: 'SEK',
      unit: 'l',
      confidence: 0.85,
      is_member_price: false,
      is_subscription_price: false,
      is_coupon_price: false,
      is_clearance: false,
      multi_buy: null,
      regional_price_policy: 'same_business_price_nationally_except_adblue_gas_alkylate',
      out_of_scope_for_consumer_connector: true,
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

export function parseOkq8PricingQuirks(input: {
  pages: Array<{ sourceUrl: string; html: string }>;
  observedAt: string;
}): Okq8PricingQuirkRow[] {
  const rows: Okq8PricingQuirkRow[] = [];
  const seen = new Set<string>();

  for (const page of input.pages) {
    assertOkq8Source(page.sourceUrl);
    const text = decodeHtmlText(page.html);
    if (/captcha|access denied|logga in för att fortsätta/i.test(text)) throw new Error('OKQ8 source returned a blocked/login page.');

    const memberMultiBuy = text.match(/Medlemspris[\s\S]*?Ramlösa\s*&\s*Imsdal[\s\S]*?2\s*för\s*32\s*kr[\s\S]*?Ej OK-medlem\s*2\s*för\s*37\s*kr/i);
    if (memberMultiBuy && !seen.has('member-multi-buy-station-goods')) {
      seen.add('member-multi-buy-station-goods');
      rows.push(
        quirkRow({
          id: 'okq8-member-multi-buy-station-goods',
          productScope: 'station_goods',
          channel: 'store',
          customerSegment: 'consumer',
          price: 32,
          unit: 'offer',
          is_member_price: true,
          membershipProgram: 'OK',
          multi_buy: '2 for 32 SEK; non-member 2 for 37 SEK',
          sourceUrl: page.sourceUrl,
          observedAt: input.observedAt,
          html: page.html,
          evidenceText: memberMultiBuy[0]
        })
      );
    }

    const appCoupons = text.match(/Ladda ner OKQ8-appen[\s\S]*?kuponger och personliga erbjudanden/i);
    if (appCoupons && !seen.has('app-personal-coupons')) {
      seen.add('app-personal-coupons');
      rows.push(
        quirkRow({
          id: 'okq8-app-personal-coupons',
          productScope: 'station_goods',
          channel: 'app',
          customerSegment: 'consumer',
          unit: 'metadata',
          is_member_price: true,
          membershipProgram: 'OK',
          is_coupon_price: true,
          sourceUrl: page.sourceUrl,
          observedAt: input.observedAt,
          html: page.html,
          evidenceText: appCoupons[0]
        })
      );
    }

    const washDiscount = text.match(/Alltid\s+10\s*%\s+rabatt på biltvätt/i);
    if (washDiscount && !seen.has('member-car-wash-discount')) {
      seen.add('member-car-wash-discount');
      rows.push(
        quirkRow({
          id: 'okq8-member-car-wash-discount',
          productScope: 'car_wash',
          channel: 'store',
          customerSegment: 'consumer',
          unit: 'offer',
          is_member_price: true,
          membershipProgram: 'OK',
          discountPercent: 10,
          sourceUrl: page.sourceUrl,
          observedAt: input.observedAt,
          html: page.html,
          evidenceText: washDiscount[0]
        })
      );
    }

    const businessFuel = text.match(/För dig som är företagskund gäller priserna här i tabellen[\s\S]*?privatkunder|Oavsett om du tankar i Pajala eller Nässjö[\s\S]*?samma pris/i);
    if (businessFuel && !seen.has('business-fuel-price-split')) {
      seen.add('business-fuel-price-split');
      rows.push(
        quirkRow({
          id: 'okq8-business-fuel-price-split',
          productScope: 'b2b_fuel',
          channel: 'b2b',
          customerSegment: 'business',
          unit: 'metadata',
          out_of_scope_for_consumer_connector: true,
          sourceUrl: page.sourceUrl,
          observedAt: input.observedAt,
          html: page.html,
          evidenceText: businessFuel[0]
        })
      );
    }
  }

  return rows;
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
