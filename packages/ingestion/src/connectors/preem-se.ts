import { createHash } from 'node:crypto';

export const PREEM_SE_BUSINESS_LIST_URL = 'https://www.preem.se/foretag/listpriser/';
export const PREEM_SE_MEMBER_URL = 'https://www.preem.se/medlem-och-kort/';
export const PREEM_SE_PARSER_VERSION = 'preem-se-business-list-v1';
export const PREEM_SE_MEMBER_DISCOUNT_PARSER_VERSION = 'preem-se-member-discounts-v1';

export type PreemSeFuelObservation = {
  id: string;
  domain: 'fuel';
  chainId: 'preem';
  operatorName: 'Preem';
  customerSegment: 'business';
  listPriceKind: 'business_card' | 'truck_card' | 'bulk';
  channel: 'business_list';
  priceScope: 'national_business_list';
  discountBasis: 'pre_discount_list_price';
  isMemberPrice: false;
  isSubscriptionPrice: false;
  isCouponPrice: false;
  isClearance: false;
  multiBuy: null;
  productName: string;
  price: number;
  currency: 'SEK';
  unit: 'l' | 'kg' | 'm3' | 'Nm3' | 'kWh';
  includesVat: boolean;
  effectiveFrom: string;
  observedAt: string;
  sourceUrl: string;
  provenance: {
    source: 'preem_se_business_list_prices';
    parserVersion: string;
    sourceUrl: string;
    contentDigest: string;
    originalPriceText: string;
    originalUnitText: string;
    sectionTitle: string;
  };
};

export type PreemSeMemberFuelDiscountObservation = {
  id: string;
  domain: 'fuel';
  chainId: 'preem';
  operatorName: 'Preem';
  customerSegment: 'consumer';
  programName: 'Preem Medlem';
  channel: 'member_discount';
  stationFormat: 'staffed' | 'automatic';
  requirement: 'preem_mastercard' | 'preem_privatkort_or_connected_payment_card' | 'preem_member_payment_card';
  discountAmount: number;
  discountUnit: 'SEK/l';
  isMemberPrice: true;
  isSubscriptionPrice: false;
  isCouponPrice: false;
  isClearance: false;
  multiBuy: null;
  observedAt: string;
  sourceUrl: string;
  provenance: {
    source: 'preem_se_member_discounts';
    parserVersion: string;
    sourceUrl: string;
    contentDigest: string;
    originalDiscountText: string;
  };
};

const SECTION_PATTERNS: Array<{ title: string; kind: PreemSeFuelObservation['listPriceKind']; includesVat: boolean; stop: RegExp }> = [
  { title: 'Listpriser Företagskort och Transportkort', kind: 'business_card', includesVat: true, stop: /Listpriser Truckkort/i },
  { title: 'Listpriser Truckkort', kind: 'truck_card', includesVat: true, stop: /Listpriser Bulk/i },
  { title: 'Listpriser Bulk', kind: 'bulk', includesVat: false, stop: /Listpriser Elfordonsladdning/i }
];

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

function parsePrice(value: string): number {
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Invalid Preem price: ${value}`);
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}

function normalizeUnit(unit: string): PreemSeFuelObservation['unit'] {
  if (unit === 'kr/l') return 'l';
  if (unit === 'kr/kg') return 'kg';
  if (unit === 'kr/m3') return 'm3';
  if (unit === 'kr/Nm3') return 'Nm3';
  if (unit === 'kr/kWh') return 'kWh';
  throw new Error(`Unsupported Preem unit: ${unit}`);
}

function slug(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function sectionText(text: string, title: string, stop: RegExp): string {
  const start = text.search(new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  if (start < 0) return '';
  const rest = text.slice(start);
  const stopMatch = rest.slice(title.length).search(stop);
  return stopMatch < 0 ? rest : rest.slice(0, title.length + stopMatch);
}

export function parsePreemSeBusinessListPrices(input: {
  html: string;
  observedAt: string;
  sourceUrl?: string;
  parserVersion?: string;
}): PreemSeFuelObservation[] {
  const sourceUrl = input.sourceUrl ?? PREEM_SE_BUSINESS_LIST_URL;
  if (!/\/foretag\/listpriser\/?$/i.test(new URL(sourceUrl).pathname)) {
    throw new Error('Preem connector only accepts the business list price page, not station-local consumer pump pages.');
  }
  const text = decodeHtmlText(input.html);
  if (/captcha|access denied|logga in/i.test(text)) throw new Error('Preem business list price source returned a blocked/login page.');
  if (!/Aktuella listpriser för företagskunder/i.test(text)) throw new Error('Preem business list price heading missing.');

  const digest = contentDigest(input.html);
  const rows: PreemSeFuelObservation[] = [];
  for (const section of SECTION_PATTERNS) {
    const scoped = sectionText(text, section.title, section.stop)
      .replace(/\b(?:Diesel|Bensin|Alternativa drivmedel|Övrigt|Etanol|Eldningsolja|Laddningstyp)\s+Pris\s+(?:inkl|exkl)\. moms\s+Gäller fr\.om\s+/gi, ' ');
    const rowPattern = /(?:Diesel|Bensin|Alternativa drivmedel|Övrigt|Etanol|Eldningsolja|Laddningstyp)\s+(.+?)\s+Pris\s+(inkl|exkl)\. moms\s+([0-9][0-9\s]*(?:[,.][0-9]{1,2})?)\s+(kr\/(?:l|kg|m3|Nm3|kWh))\s+Gäller fr\.om\s+(\d{4}-\d{2}-\d{2})/gi;
    for (const match of scoped.matchAll(rowPattern)) {
      const productName = match[1]!.trim();
      const originalPriceText = match[3]!.trim();
      const originalUnitText = match[4]!.trim();
      const effectiveFrom = match[5]!;
      rows.push({
        id: `preem-${section.kind}-${slug(productName)}-${effectiveFrom}`,
        domain: 'fuel',
        chainId: 'preem',
        operatorName: 'Preem',
        customerSegment: 'business',
        listPriceKind: section.kind,
        channel: 'business_list',
        priceScope: 'national_business_list',
        discountBasis: 'pre_discount_list_price',
        isMemberPrice: false,
        isSubscriptionPrice: false,
        isCouponPrice: false,
        isClearance: false,
        multiBuy: null,
        productName,
        price: parsePrice(originalPriceText),
        currency: 'SEK',
        unit: normalizeUnit(originalUnitText),
        includesVat: section.includesVat,
        effectiveFrom,
        observedAt: input.observedAt,
        sourceUrl,
        provenance: {
          source: 'preem_se_business_list_prices',
          parserVersion: input.parserVersion ?? PREEM_SE_PARSER_VERSION,
          sourceUrl,
          contentDigest: digest,
          originalPriceText,
          originalUnitText,
          sectionTitle: section.title
        }
      });
    }
  }
  if (rows.length === 0) throw new Error('No Preem business list fuel prices parsed.');
  return rows;
}

export async function fetchPreemSeBusinessListPrices(options: {
  fetchImpl?: typeof fetch;
  observedAt?: string;
  sourceUrl?: string;
} = {}): Promise<PreemSeFuelObservation[]> {
  const sourceUrl = options.sourceUrl ?? PREEM_SE_BUSINESS_LIST_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 preem-business-list-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Preem business list price source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Preem business list price source failed with HTTP ${response.status}.`);
  return parsePreemSeBusinessListPrices({ html: await response.text(), observedAt: options.observedAt ?? new Date().toISOString(), sourceUrl });
}

export function parsePreemSeMemberFuelDiscounts(input: {
  html: string;
  observedAt: string;
  sourceUrl?: string;
  parserVersion?: string;
}): PreemSeMemberFuelDiscountObservation[] {
  const sourceUrl = input.sourceUrl ?? PREEM_SE_MEMBER_URL;
  if (!/\/medlem-och-kort\/?$/i.test(new URL(sourceUrl).pathname)) {
    throw new Error('Preem member discount connector only accepts the Preem Medlem page.');
  }
  const text = decodeHtmlText(input.html);
  if (/captcha|access denied|logga in/i.test(text)) throw new Error('Preem member discount source returned a blocked/login page.');
  if (!/Preem Medlem/i.test(text)) throw new Error('Preem member discount heading missing.');

  const digest = contentDigest(input.html);
  const rows: PreemSeMemberFuelDiscountObservation[] = [];
  const discountPatterns: Array<{
    id: string;
    pattern: RegExp;
    stationFormat: PreemSeMemberFuelDiscountObservation['stationFormat'];
    requirement: PreemSeMemberFuelDiscountObservation['requirement'];
  }> = [
    {
      id: 'mastercard-staffed',
      pattern: /(\d+)\s*öre\/liter i drivmedelsrabatt på butikstationer med Preem Mastercard/i,
      stationFormat: 'staffed',
      requirement: 'preem_mastercard'
    },
    {
      id: 'private-card-or-connected-card-staffed',
      pattern: /(\d+)\s*öre\/liter i rabatt på butikstationer med Preem Privatkort eller ett anslutet betalkort/i,
      stationFormat: 'staffed',
      requirement: 'preem_privatkort_or_connected_payment_card'
    },
    {
      id: 'member-card-automatic',
      pattern: /(\d+)\s*öre\/liter i rabatt på automatstationer/i,
      stationFormat: 'automatic',
      requirement: 'preem_member_payment_card'
    }
  ];

  for (const discount of discountPatterns) {
    const match = text.match(discount.pattern);
    if (!match?.[1]) continue;
    const originalDiscountText = match[0];
    rows.push({
      id: `preem-member-${discount.id}`,
      domain: 'fuel',
      chainId: 'preem',
      operatorName: 'Preem',
      customerSegment: 'consumer',
      programName: 'Preem Medlem',
      channel: 'member_discount',
      stationFormat: discount.stationFormat,
      requirement: discount.requirement,
      discountAmount: parseOrePerLiter(match[1]),
      discountUnit: 'SEK/l',
      isMemberPrice: true,
      isSubscriptionPrice: false,
      isCouponPrice: false,
      isClearance: false,
      multiBuy: null,
      observedAt: input.observedAt,
      sourceUrl,
      provenance: {
        source: 'preem_se_member_discounts',
        parserVersion: input.parserVersion ?? PREEM_SE_MEMBER_DISCOUNT_PARSER_VERSION,
        sourceUrl,
        contentDigest: digest,
        originalDiscountText
      }
    });
  }

  if (rows.length === 0) throw new Error('No Preem member fuel discounts parsed.');
  return rows;
}

export async function fetchPreemSeMemberFuelDiscounts(options: {
  fetchImpl?: typeof fetch;
  observedAt?: string;
  sourceUrl?: string;
} = {}): Promise<PreemSeMemberFuelDiscountObservation[]> {
  const sourceUrl = options.sourceUrl ?? PREEM_SE_MEMBER_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 preem-member-discount-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Preem member discount source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Preem member discount source failed with HTTP ${response.status}.`);
  return parsePreemSeMemberFuelDiscounts({ html: await response.text(), observedAt: options.observedAt ?? new Date().toISOString(), sourceUrl });
}

function parseOrePerLiter(value: string): number {
  const ore = Number.parseInt(value.replace(/\s/g, ''), 10);
  if (!Number.isFinite(ore) || ore < 0) throw new Error(`Invalid Preem öre/liter discount: ${value}`);
  return Math.round((ore / 100 + Number.EPSILON) * 100) / 100;
}
